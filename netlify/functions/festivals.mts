import type { Context, Config } from '@netlify/functions'
import { getDb } from './lib/db.mts'

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
  provinces: string[] | null
  isNationwide: boolean
  bestLocations: string[] | null
  imageUrl: string | null
  activities: string[] | null
  tips: string[] | null
  dressCode: string | null
  festivalType: string | null
  religion: string | null
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
    date2025: row.date_2025,
    date2026: row.date_2026,
    provinces: row.provinces,
    isNationwide: row.is_nationwide,
    bestLocations: row.best_locations,
    imageUrl: row.image_url,
    activities: row.activities,
    tips: row.tips,
    dressCode: row.dress_code,
    festivalType: row.festival_type,
    religion: row.religion,
  }
}

export default async function handler(req: Request, context: Context) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const sql = getDb()
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)

    // Check for slug in path: /api/festivals/songkran
    const festivalSlug = pathParts.length > 2 ? pathParts[pathParts.length - 1] : null

    // Query params
    const month = url.searchParams.get('month')
    const province = url.searchParams.get('province')
    const upcoming = url.searchParams.get('upcoming')
    const days = parseInt(url.searchParams.get('days') || '30', 10)

    // Single festival by slug
    if (festivalSlug && festivalSlug !== 'upcoming') {
      const result = await sql`
        SELECT * FROM thai_festivals WHERE slug = ${festivalSlug}
      `

      if (result.length === 0) {
        return new Response(JSON.stringify({ error: 'Festival not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify(transformFestival(result[0])), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Upcoming festivals
    if (upcoming === 'true' || festivalSlug === 'upcoming') {
      const today = new Date()
      const year = today.getFullYear()
      const dateColumn = year === 2025 ? 'date_2025' : 'date_2026'
      const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)

      const result = await sql`
        SELECT *,
          CASE
            WHEN ${year} = 2025 THEN date_2025
            ELSE date_2026
          END as next_date
        FROM thai_festivals
        WHERE (
          (${year} = 2025 AND date_2025 >= ${today.toISOString().split('T')[0]}::date AND date_2025 <= ${futureDate.toISOString().split('T')[0]}::date)
          OR (${year} = 2026 AND date_2026 >= ${today.toISOString().split('T')[0]}::date AND date_2026 <= ${futureDate.toISOString().split('T')[0]}::date)
        )
        ORDER BY
          CASE WHEN ${year} = 2025 THEN date_2025 ELSE date_2026 END ASC
      `

      const festivals = result.map((row: any) => ({
        ...transformFestival(row),
        nextDate: row.next_date,
        daysUntil: Math.ceil((new Date(row.next_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
      }))

      return new Response(JSON.stringify({ festivals, count: festivals.length }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // List festivals with optional filters
    let result
    if (month) {
      result = await sql`
        SELECT * FROM thai_festivals
        WHERE month_typical = ${parseInt(month, 10)}
        ORDER BY month_typical, name
      `
    } else if (province) {
      result = await sql`
        SELECT * FROM thai_festivals
        WHERE is_nationwide = true OR ${province} = ANY(provinces)
        ORDER BY month_typical, name
      `
    } else {
      result = await sql`
        SELECT * FROM thai_festivals
        ORDER BY month_typical, name
      `
    }

    const festivals = result.map(transformFestival)

    return new Response(JSON.stringify({ festivals, count: festivals.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Festivals API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const config: Config = {
  path: ['/api/festivals', '/api/festivals/*'],
}
