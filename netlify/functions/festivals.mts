import type { Context, Config } from '@netlify/functions'
import { getDb } from './lib/db.mts'
import {
  festivalDateForYear,
  nextFestivalOccurrence,
  thailandToday,
} from '../../src/data/festivalDates.ts'

interface Festival {
  id: string
  slug: string
  name: string
  nameThai: string | null
  description: string | null
  monthTypical: number | null
  dateType: string
  dateFixed: string | null
  durationDays: number
  date2025: string | null
  date2026: string | null
  /** From src/data/festivalDates.ts (the table has no 2027 column); null = not announced yet */
  date2027: string | null
  provinces: string[] | null
  isNationwide: boolean
  bestLocations: string[] | null
  region: string | null
  imageUrl: string | null
  activities: string[] | null
  tips: string[] | null
  dressCode: string | null
  festivalType: string | null
  religion: string | null
  isHiddenGem: boolean
  crowdLevel: string | null
  foreignerFriendly: number | null
}

// Transform database row to camelCase response
function transformFestival(row: any): Festival {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameThai: row.name_thai,
    description: row.description,
    monthTypical: row.month_typical,
    dateType: row.date_type,
    dateFixed: row.date_fixed,
    durationDays: row.duration_days,
    // Dates as "YYYY-MM-DDT00:00:00.000Z" whatever the server's time zone; a date in
    // src/data/festivalDates.ts wins over the column (e.g. a corrected 2026 date)
    date2025: festivalDateForYear(row.slug, 2025, row.date_2025),
    date2026: festivalDateForYear(row.slug, 2026, row.date_2026),
    date2027: festivalDateForYear(row.slug, 2027),
    provinces: row.provinces,
    isNationwide: row.is_nationwide,
    bestLocations: row.best_locations,
    region: row.region,
    imageUrl: row.image_url,
    activities: row.activities,
    tips: row.tips,
    dressCode: row.dress_code,
    festivalType: row.festival_type,
    religion: row.religion,
    isHiddenGem: row.is_hidden_gem ?? false,
    crowdLevel: row.crowd_level,
    foreignerFriendly: row.foreigner_friendly,
  }
}

// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default async function handler(req: Request, context: Context) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  try {
    const sql = await getDb()
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)

    // Check for special endpoints or slug in path
    const lastPart = pathParts.length > 2 ? pathParts[pathParts.length - 1] : null

    // GET /api/festivals/types - list all festival types with counts
    if (lastPart === 'types') {
      const result = await sql`
        SELECT festival_type as type, COUNT(*) as count
        FROM thai_festivals
        WHERE festival_type IS NOT NULL
        GROUP BY festival_type
        ORDER BY count DESC
      `
      return new Response(JSON.stringify({ types: result }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // GET /api/festivals/regions - list all regions with counts
    if (lastPart === 'regions') {
      const result = await sql`
        SELECT region, COUNT(*) as count
        FROM thai_festivals
        WHERE region IS NOT NULL
        GROUP BY region
        ORDER BY count DESC
      `
      return new Response(JSON.stringify({ regions: result }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Query params
    const month = url.searchParams.get('month')
    const province = url.searchParams.get('province')
    const upcoming = url.searchParams.get('upcoming')
    const days = parseInt(url.searchParams.get('days') || '60', 10)
    const type = url.searchParams.get('type')
    const region = url.searchParams.get('region')
    const hidden = url.searchParams.get('hidden')
    const search = url.searchParams.get('search')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 100)
    const offset = parseInt(url.searchParams.get('offset') || '0', 10)

    // Single festival by slug
    if (lastPart && lastPart !== 'upcoming') {
      const result = await sql`
        SELECT * FROM thai_festivals WHERE slug = ${lastPart}
      `

      if (result.length === 0) {
        return new Response(JSON.stringify({ error: 'Festival not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      // Add next date and days until (left out once every known date has passed)
      const festival = transformFestival(result[0])
      const enriched = { ...festival, ...nextFestivalOccurrence(festival) }

      return new Response(JSON.stringify(enriched), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Upcoming festivals: on now, or starting within `days` days (Thailand date).
    // The next date can come from any year (database columns or src/data/festivalDates.ts),
    // so it's worked out here rather than in SQL; the table is small (~60 rows).
    if (upcoming === 'true' || lastPart === 'upcoming') {
      const windowDays = Number.isFinite(days) && days >= 0 ? days : 60

      let rows
      if (type) {
        rows = await sql`SELECT * FROM thai_festivals WHERE festival_type = ${type}`
      } else if (region) {
        rows = await sql`SELECT * FROM thai_festivals WHERE region = ${region}`
      } else if (hidden === 'true') {
        rows = await sql`SELECT * FROM thai_festivals WHERE is_hidden_gem = true`
      } else {
        rows = await sql`SELECT * FROM thai_festivals`
      }

      const today = thailandToday()
      const festivals = rows
        .map((row: any) => {
          const festival = transformFestival(row)
          const next = nextFestivalOccurrence(festival, today)
          return next ? { ...festival, ...next } : null
        })
        .filter((f): f is NonNullable<typeof f> => f !== null && f.daysUntil <= windowDays)
        .sort((a, b) => a.nextDate.localeCompare(b.nextDate) || a.name.localeCompare(b.name))
        .slice(offset, offset + limit)

      return new Response(JSON.stringify({ festivals, count: festivals.length }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // List festivals with optional filters
    let result

    // Search by name
    if (search) {
      const searchPattern = `%${search.toLowerCase()}%`
      result = await sql`
        SELECT * FROM thai_festivals
        WHERE LOWER(name) LIKE ${searchPattern}
          OR LOWER(name_thai) LIKE ${searchPattern}
          OR LOWER(description) LIKE ${searchPattern}
        ORDER BY
          CASE WHEN LOWER(name) LIKE ${searchPattern} THEN 0 ELSE 1 END,
          month_typical, name
        LIMIT ${limit} OFFSET ${offset}
      `
    }
    // Filter by type
    else if (type) {
      result = await sql`
        SELECT * FROM thai_festivals
        WHERE festival_type = ${type}
        ORDER BY month_typical, name
        LIMIT ${limit} OFFSET ${offset}
      `
    }
    // Filter by region
    else if (region) {
      result = await sql`
        SELECT * FROM thai_festivals
        WHERE region = ${region}
        ORDER BY month_typical, name
        LIMIT ${limit} OFFSET ${offset}
      `
    }
    // Hidden gems only
    else if (hidden === 'true') {
      result = await sql`
        SELECT * FROM thai_festivals
        WHERE is_hidden_gem = true
        ORDER BY month_typical, name
        LIMIT ${limit} OFFSET ${offset}
      `
    }
    // Filter by month
    else if (month) {
      result = await sql`
        SELECT * FROM thai_festivals
        WHERE month_typical = ${parseInt(month, 10)}
        ORDER BY month_typical, name
        LIMIT ${limit} OFFSET ${offset}
      `
    }
    // Filter by province
    else if (province) {
      result = await sql`
        SELECT * FROM thai_festivals
        WHERE is_nationwide = true OR ${province} = ANY(provinces)
        ORDER BY month_typical, name
        LIMIT ${limit} OFFSET ${offset}
      `
    }
    // All festivals
    else {
      result = await sql`
        SELECT * FROM thai_festivals
        ORDER BY month_typical, name
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    const festivals = result.map(transformFestival)

    // Get total count for pagination
    const countResult = await sql`SELECT COUNT(*) as total FROM thai_festivals`
    const total = parseInt(countResult[0].total, 10)

    return new Response(JSON.stringify({
      festivals,
      count: festivals.length,
      total,
      hasMore: offset + festivals.length < total
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })

  } catch (error) {
    console.error('Festivals API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
}

