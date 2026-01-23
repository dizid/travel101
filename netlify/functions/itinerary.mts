import type { Context, Config } from '@netlify/functions'
import Anthropic from '@anthropic-ai/sdk'
import { getDb } from './lib/db.mts'

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

function getAnthropic() {
  const apiKey = Netlify.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')
  return new Anthropic({ apiKey })
}

async function requirePro(db: ReturnType<typeof getDb>, userId: string) {
  const result = await db`SELECT is_pro FROM user_profiles WHERE user_id = ${userId}`
  if (result.length === 0 || !result[0].is_pro) {
    throw new Error('Pro subscription required')
  }
}

interface ItineraryDay {
  dayNumber: number
  date?: string
  location: string
  activities: {
    timeSlot?: string
    title: string
    description?: string
    activityType?: string
    attractionSlug?: string
    durationMinutes?: number
    estimatedCostThb?: number
  }[]
}

interface CreateItineraryRequest {
  name: string
  startDate?: string
  endDate?: string
  days?: ItineraryDay[]
}

interface GenerateItineraryRequest {
  duration: number // days
  destinations?: string[]
  interests?: string[]
  travelStyle?: string[]
  budget?: string
  groupType?: string
}

export default async (req: Request, context: Context) => {
  const db = await getDb()
  const userId = req.headers.get('x-user-id')

  if (!userId) {
    return json({ error: 'Unauthorized' }, 401)
  }

  try {
    // Verify Pro subscription for all itinerary operations
    await requirePro(db, userId)

    const url = new URL(req.url)
    const itineraryId = url.searchParams.get('id')
    const dayId = url.searchParams.get('dayId')
    const activityId = url.searchParams.get('activityId')
    const resource = url.searchParams.get('resource') // 'day' or 'activity'

    // Handle nested resource operations (days/activities)
    if (resource === 'day') {
      return await handleDayOperations(db, userId, req.method, dayId, itineraryId, req)
    }
    if (resource === 'activity') {
      return await handleActivityOperations(db, userId, req.method, activityId, dayId, req)
    }

    switch (req.method) {
      case 'GET': {
        if (itineraryId) {
          // Get single itinerary with all days and activities
          const itinerary = await db`
            SELECT * FROM itineraries WHERE id = ${itineraryId} AND user_id = ${userId}
          `
          if (itinerary.length === 0) {
            return json({ error: 'Itinerary not found' }, 404)
          }

          const days = await db`
            SELECT * FROM itinerary_days
            WHERE itinerary_id = ${itineraryId}
            ORDER BY day_number
          `

          const dayIds = days.map((d) => d.id)
          let activities: Record<string, unknown>[] = []
          if (dayIds.length > 0) {
            activities = await db`
              SELECT * FROM itinerary_activities
              WHERE day_id = ANY(${dayIds})
              ORDER BY sort_order, time_slot
            `
          }

          // Group activities by day
          const daysWithActivities = days.map((day) => ({
            ...day,
            activities: activities.filter((a) => a.day_id === day.id),
          }))

          return json({
            ...itinerary[0],
            days: daysWithActivities,
          })
        }

        // List all itineraries for user
        const itineraries = await db`
          SELECT id, name, start_date, end_date, status, ai_generated, created_at, updated_at,
            (SELECT COUNT(*) FROM itinerary_days WHERE itinerary_id = itineraries.id) as day_count
          FROM itineraries
          WHERE user_id = ${userId}
          ORDER BY updated_at DESC
        `
        return json({ itineraries })
      }

      case 'POST': {
        const body = await req.json()

        // Handle AI generation
        if (body.action === 'generate') {
          const genReq = body as GenerateItineraryRequest & { action: string }
          return await generateItinerary(db, userId, genReq)
        }

        // Create new itinerary
        const createReq = body as CreateItineraryRequest
        const [itinerary] = await db`
          INSERT INTO itineraries (user_id, name, start_date, end_date)
          VALUES (
            ${userId},
            ${createReq.name || 'My Thailand Trip'},
            ${createReq.startDate || null},
            ${createReq.endDate || null}
          )
          RETURNING *
        `

        // Insert days if provided
        if (createReq.days && createReq.days.length > 0) {
          for (const day of createReq.days) {
            const [insertedDay] = await db`
              INSERT INTO itinerary_days (itinerary_id, day_number, date, location)
              VALUES (${itinerary.id}, ${day.dayNumber}, ${day.date || null}, ${day.location})
              RETURNING id
            `

            // Insert activities for this day
            if (day.activities && day.activities.length > 0) {
              for (let i = 0; i < day.activities.length; i++) {
                const activity = day.activities[i]
                await db`
                  INSERT INTO itinerary_activities (
                    day_id, time_slot, title, description, activity_type,
                    attraction_slug, duration_minutes, estimated_cost_thb, sort_order
                  )
                  VALUES (
                    ${insertedDay.id},
                    ${activity.timeSlot || null},
                    ${activity.title},
                    ${activity.description || null},
                    ${activity.activityType || null},
                    ${activity.attractionSlug || null},
                    ${activity.durationMinutes || null},
                    ${activity.estimatedCostThb || null},
                    ${i}
                  )
                `
              }
            }
          }
        }

        return json({ itinerary }, 201)
      }

      case 'PUT': {
        if (!itineraryId) {
          return json({ error: 'Itinerary ID required' }, 400)
        }

        const body = await req.json()

        // Verify ownership
        const existing = await db`
          SELECT id FROM itineraries WHERE id = ${itineraryId} AND user_id = ${userId}
        `
        if (existing.length === 0) {
          return json({ error: 'Itinerary not found' }, 404)
        }

        // Update itinerary
        const [updated] = await db`
          UPDATE itineraries SET
            name = COALESCE(${body.name || null}, name),
            start_date = COALESCE(${body.startDate || null}, start_date),
            end_date = COALESCE(${body.endDate || null}, end_date),
            status = COALESCE(${body.status || null}, status),
            notes = COALESCE(${body.notes || null}, notes),
            updated_at = NOW()
          WHERE id = ${itineraryId}
          RETURNING *
        `

        return json({ itinerary: updated })
      }

      case 'DELETE': {
        if (!itineraryId) {
          return json({ error: 'Itinerary ID required' }, 400)
        }

        // Verify ownership and delete (cascades to days and activities)
        const deleted = await db`
          DELETE FROM itineraries
          WHERE id = ${itineraryId} AND user_id = ${userId}
          RETURNING id
        `

        if (deleted.length === 0) {
          return json({ error: 'Itinerary not found' }, 404)
        }

        return json({ success: true })
      }

      default:
        return json({ error: 'Method not allowed' }, 405)
    }
  } catch (error) {
    console.error('Itinerary error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message.includes('Pro subscription') ? 403 : 500
    return json({ error: message }, status)
  }
}

async function generateItinerary(
  db: ReturnType<typeof getDb>,
  userId: string,
  request: GenerateItineraryRequest
) {
  const anthropic = getAnthropic()

  // Get user preferences
  const userResult = await db`SELECT prefs FROM user_profiles WHERE user_id = ${userId}`
  const userPrefs = userResult.length > 0 ? userResult[0].prefs : {}

  // Merge request with user preferences
  const interests = request.interests || userPrefs.interests || ['culture', 'food']
  const travelStyle = request.travelStyle || userPrefs.travelStyle || ['relaxation']
  const budget = request.budget || userPrefs.budget || 'mid'
  const groupType = request.groupType || userPrefs.groupType || 'solo'
  const destinations = request.destinations || ['Bangkok', 'Chiang Mai']

  const prompt = `Create a detailed ${request.duration}-day Thailand itinerary.

TRAVELER PROFILE:
- Travel style: ${travelStyle.join(', ')}
- Interests: ${interests.join(', ')}
- Budget level: ${budget}
- Group type: ${groupType}
- Destinations: ${destinations.join(', ')}

Generate a day-by-day itinerary with specific times, activities, and practical details.

Respond ONLY with valid JSON in this exact format:
{
  "name": "Descriptive trip name",
  "days": [
    {
      "dayNumber": 1,
      "location": "City name",
      "activities": [
        {
          "timeSlot": "09:00",
          "title": "Activity name",
          "description": "Brief description with practical tips",
          "activityType": "attraction|food|transport|accommodation|shopping|nightlife|beach|nature|wellness",
          "durationMinutes": 120,
          "estimatedCostThb": 500
        }
      ]
    }
  ],
  "tips": ["Pro tip 1", "Pro tip 2"]
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type')
  }

  // Parse AI response
  let itineraryData
  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content.text]
    itineraryData = JSON.parse(jsonMatch[1] || content.text)
  } catch {
    console.error('Failed to parse AI response:', content.text)
    throw new Error('Failed to generate itinerary')
  }

  // Calculate dates
  const startDate = new Date()
  startDate.setDate(startDate.getDate() + 7) // Start a week from now

  // Save to database
  const [itinerary] = await db`
    INSERT INTO itineraries (user_id, name, start_date, end_date, ai_generated, notes)
    VALUES (
      ${userId},
      ${itineraryData.name || 'AI Generated Trip'},
      ${startDate.toISOString().split('T')[0]},
      ${new Date(startDate.getTime() + (request.duration - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]},
      true,
      ${itineraryData.tips ? itineraryData.tips.join('\n• ') : null}
    )
    RETURNING *
  `

  // Insert days and activities
  for (const day of itineraryData.days) {
    const dayDate = new Date(startDate)
    dayDate.setDate(dayDate.getDate() + day.dayNumber - 1)

    const [insertedDay] = await db`
      INSERT INTO itinerary_days (itinerary_id, day_number, date, location)
      VALUES (${itinerary.id}, ${day.dayNumber}, ${dayDate.toISOString().split('T')[0]}, ${day.location})
      RETURNING id
    `

    if (day.activities) {
      for (let i = 0; i < day.activities.length; i++) {
        const activity = day.activities[i]
        await db`
          INSERT INTO itinerary_activities (
            day_id, time_slot, title, description, activity_type,
            duration_minutes, estimated_cost_thb, sort_order
          )
          VALUES (
            ${insertedDay.id},
            ${activity.timeSlot || null},
            ${activity.title},
            ${activity.description || null},
            ${activity.activityType || null},
            ${activity.durationMinutes || null},
            ${activity.estimatedCostThb || null},
            ${i}
          )
        `
      }
    }
  }

  // Return the full itinerary
  const days = await db`
    SELECT * FROM itinerary_days
    WHERE itinerary_id = ${itinerary.id}
    ORDER BY day_number
  `

  const dayIds = days.map((d) => d.id)
  const activities = await db`
    SELECT * FROM itinerary_activities
    WHERE day_id = ANY(${dayIds})
    ORDER BY sort_order, time_slot
  `

  const daysWithActivities = days.map((day) => ({
    ...day,
    activities: activities.filter((a) => a.day_id === day.id),
  }))

  return json({
    itinerary: {
      ...itinerary,
      days: daysWithActivities,
    },
    tips: itineraryData.tips || [],
  }, 201)
}

// Handle day CRUD operations
async function handleDayOperations(
  db: ReturnType<typeof getDb>,
  userId: string,
  method: string,
  dayId: string | null,
  itineraryId: string | null,
  req: Request
) {
  switch (method) {
    case 'POST': {
      if (!itineraryId) {
        return json({ error: 'Itinerary ID required' }, 400)
      }

      // Verify ownership
      const itinerary = await db`
        SELECT id FROM itineraries WHERE id = ${itineraryId} AND user_id = ${userId}
      `
      if (itinerary.length === 0) {
        return json({ error: 'Itinerary not found' }, 404)
      }

      const body = await req.json()

      // Get the next day number
      const maxDay = await db`
        SELECT COALESCE(MAX(day_number), 0) as max_day
        FROM itinerary_days WHERE itinerary_id = ${itineraryId}
      `
      const nextDayNumber = (maxDay[0]?.max_day || 0) + 1

      const [day] = await db`
        INSERT INTO itinerary_days (itinerary_id, day_number, date, location, notes)
        VALUES (
          ${itineraryId},
          ${body.dayNumber || nextDayNumber},
          ${body.date || null},
          ${body.location || 'Bangkok'},
          ${body.notes || null}
        )
        RETURNING *
      `

      // Update itinerary updated_at
      await db`UPDATE itineraries SET updated_at = NOW() WHERE id = ${itineraryId}`

      return json({ day: { ...day, activities: [] } }, 201)
    }

    case 'PUT': {
      if (!dayId) {
        return json({ error: 'Day ID required' }, 400)
      }

      // Verify ownership via join
      const existing = await db`
        SELECT d.id, i.user_id FROM itinerary_days d
        JOIN itineraries i ON d.itinerary_id = i.id
        WHERE d.id = ${dayId} AND i.user_id = ${userId}
      `
      if (existing.length === 0) {
        return json({ error: 'Day not found' }, 404)
      }

      const body = await req.json()

      const [updated] = await db`
        UPDATE itinerary_days SET
          day_number = COALESCE(${body.dayNumber ?? null}, day_number),
          date = COALESCE(${body.date ?? null}, date),
          location = COALESCE(${body.location ?? null}, location),
          notes = COALESCE(${body.notes ?? null}, notes)
        WHERE id = ${dayId}
        RETURNING *
      `

      // Get activities for this day
      const activities = await db`
        SELECT * FROM itinerary_activities WHERE day_id = ${dayId} ORDER BY sort_order
      `

      return json({ day: { ...updated, activities } })
    }

    case 'DELETE': {
      if (!dayId) {
        return json({ error: 'Day ID required' }, 400)
      }

      // Verify ownership and get itinerary_id
      const existing = await db`
        SELECT d.id, d.itinerary_id, i.user_id FROM itinerary_days d
        JOIN itineraries i ON d.itinerary_id = i.id
        WHERE d.id = ${dayId} AND i.user_id = ${userId}
      `
      if (existing.length === 0) {
        return json({ error: 'Day not found' }, 404)
      }

      // Delete day (activities will cascade)
      await db`DELETE FROM itinerary_days WHERE id = ${dayId}`

      // Renumber remaining days
      await db`
        WITH numbered AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY day_number) as new_number
          FROM itinerary_days WHERE itinerary_id = ${existing[0].itinerary_id}
        )
        UPDATE itinerary_days d
        SET day_number = n.new_number
        FROM numbered n
        WHERE d.id = n.id
      `

      // Update itinerary updated_at
      await db`UPDATE itineraries SET updated_at = NOW() WHERE id = ${existing[0].itinerary_id}`

      return json({ success: true })
    }

    default:
      return json({ error: 'Method not allowed' }, 405)
  }
}

// Handle activity CRUD operations
async function handleActivityOperations(
  db: ReturnType<typeof getDb>,
  userId: string,
  method: string,
  activityId: string | null,
  dayId: string | null,
  req: Request
) {
  switch (method) {
    case 'POST': {
      if (!dayId) {
        return json({ error: 'Day ID required' }, 400)
      }

      // Verify ownership via join
      const day = await db`
        SELECT d.id, d.itinerary_id FROM itinerary_days d
        JOIN itineraries i ON d.itinerary_id = i.id
        WHERE d.id = ${dayId} AND i.user_id = ${userId}
      `
      if (day.length === 0) {
        return json({ error: 'Day not found' }, 404)
      }

      const body = await req.json()

      // Get next sort order
      const maxOrder = await db`
        SELECT COALESCE(MAX(sort_order), -1) as max_order
        FROM itinerary_activities WHERE day_id = ${dayId}
      `
      const nextOrder = (maxOrder[0]?.max_order ?? -1) + 1

      const [activity] = await db`
        INSERT INTO itinerary_activities (
          day_id, time_slot, title, description, activity_type,
          attraction_slug, duration_minutes, estimated_cost_thb,
          google_maps_url, booking_url, notes, sort_order
        )
        VALUES (
          ${dayId},
          ${body.timeSlot || null},
          ${body.title || 'New Activity'},
          ${body.description || null},
          ${body.activityType || 'attraction'},
          ${body.attractionSlug || null},
          ${body.durationMinutes || null},
          ${body.estimatedCostThb || null},
          ${body.googleMapsUrl || null},
          ${body.bookingUrl || null},
          ${body.notes || null},
          ${body.sortOrder ?? nextOrder}
        )
        RETURNING *
      `

      // Update itinerary updated_at
      await db`
        UPDATE itineraries SET updated_at = NOW()
        WHERE id = ${day[0].itinerary_id}
      `

      return json({ activity }, 201)
    }

    case 'PUT': {
      if (!activityId) {
        return json({ error: 'Activity ID required' }, 400)
      }

      // Verify ownership via joins
      const existing = await db`
        SELECT a.id, d.itinerary_id FROM itinerary_activities a
        JOIN itinerary_days d ON a.day_id = d.id
        JOIN itineraries i ON d.itinerary_id = i.id
        WHERE a.id = ${activityId} AND i.user_id = ${userId}
      `
      if (existing.length === 0) {
        return json({ error: 'Activity not found' }, 404)
      }

      const body = await req.json()

      // Handle reordering if sort_order is provided
      if (body.sortOrder !== undefined && body.dayId) {
        // Move activity to new day if day changed
        const [updated] = await db`
          UPDATE itinerary_activities SET
            day_id = ${body.dayId},
            sort_order = ${body.sortOrder}
          WHERE id = ${activityId}
          RETURNING *
        `
        return json({ activity: updated })
      }

      const [updated] = await db`
        UPDATE itinerary_activities SET
          time_slot = COALESCE(${body.timeSlot ?? null}, time_slot),
          title = COALESCE(${body.title ?? null}, title),
          description = COALESCE(${body.description ?? null}, description),
          activity_type = COALESCE(${body.activityType ?? null}, activity_type),
          attraction_slug = COALESCE(${body.attractionSlug ?? null}, attraction_slug),
          duration_minutes = COALESCE(${body.durationMinutes ?? null}, duration_minutes),
          estimated_cost_thb = COALESCE(${body.estimatedCostThb ?? null}, estimated_cost_thb),
          google_maps_url = COALESCE(${body.googleMapsUrl ?? null}, google_maps_url),
          booking_url = COALESCE(${body.bookingUrl ?? null}, booking_url),
          notes = COALESCE(${body.notes ?? null}, notes)
        WHERE id = ${activityId}
        RETURNING *
      `

      // Update itinerary updated_at
      await db`
        UPDATE itineraries SET updated_at = NOW()
        WHERE id = ${existing[0].itinerary_id}
      `

      return json({ activity: updated })
    }

    case 'DELETE': {
      if (!activityId) {
        return json({ error: 'Activity ID required' }, 400)
      }

      // Verify ownership via joins
      const existing = await db`
        SELECT a.id, a.day_id, d.itinerary_id FROM itinerary_activities a
        JOIN itinerary_days d ON a.day_id = d.id
        JOIN itineraries i ON d.itinerary_id = i.id
        WHERE a.id = ${activityId} AND i.user_id = ${userId}
      `
      if (existing.length === 0) {
        return json({ error: 'Activity not found' }, 404)
      }

      await db`DELETE FROM itinerary_activities WHERE id = ${activityId}`

      // Renumber remaining activities in the day
      await db`
        WITH numbered AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY sort_order) - 1 as new_order
          FROM itinerary_activities WHERE day_id = ${existing[0].day_id}
        )
        UPDATE itinerary_activities a
        SET sort_order = n.new_order
        FROM numbered n
        WHERE a.id = n.id
      `

      // Update itinerary updated_at
      await db`
        UPDATE itineraries SET updated_at = NOW()
        WHERE id = ${existing[0].itinerary_id}
      `

      return json({ success: true })
    }

    default:
      return json({ error: 'Method not allowed' }, 405)
  }
}

export const config: Config = {
  path: '/api/itinerary',
}
