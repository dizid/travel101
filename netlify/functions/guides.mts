import type { Context } from '@netlify/functions'
import { getDb } from './lib/db.mts'

interface Guide {
  id: string
  slug: string
  title: string
  subtitle: string | null
  content: string
  excerpt: string | null
  category: string
  province: string | null
  imageUrl: string | null
  imageAlt: string | null
  author: string
  readingTimeMin: number
  tags: string[]
  isPublished: boolean
  publishedAt: string
  updatedAt: string
  viewCount: number
}

// Transform database row to camelCase response
function transformGuide(row: any): Guide {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    content: row.content,
    excerpt: row.excerpt,
    category: row.category,
    province: row.province,
    imageUrl: row.image_url,
    imageAlt: row.image_alt,
    author: row.author,
    readingTimeMin: row.reading_time_min,
    tags: row.tags || [],
    isPublished: row.is_published,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    viewCount: row.view_count,
  }
}

// Transform for listing (exclude full content to save bandwidth)
function transformGuideListing(row: any): Omit<Guide, 'content'> {
  const guide = transformGuide(row)
  const { content: _, ...listing } = guide
  return listing
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default async function handler(req: Request, _context: Context) {
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

    // Check if requesting a single guide by slug
    const lastPart = pathParts.length > 2 ? pathParts[pathParts.length - 1] : null

    // GET /api/guides/categories - list categories with counts
    if (lastPart === 'categories') {
      const result = await sql`
        SELECT category, COUNT(*) as count
        FROM travel_guides
        WHERE is_published = true
        GROUP BY category
        ORDER BY count DESC
      `
      return new Response(JSON.stringify({ categories: result }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // GET /api/guides/:slug - single guide by slug
    if (lastPart && lastPart !== 'categories') {
      const result = await sql`
        SELECT * FROM travel_guides
        WHERE slug = ${lastPart} AND is_published = true
      `

      if (result.length === 0) {
        return new Response(JSON.stringify({ error: 'Guide not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      // Increment view count (fire and forget)
      sql`UPDATE travel_guides SET view_count = view_count + 1 WHERE slug = ${lastPart}`.catch(() => {})

      return new Response(JSON.stringify(transformGuide(result[0])), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // GET /api/guides - list guides with optional filters
    const category = url.searchParams.get('category')
    const province = url.searchParams.get('province')
    const search = url.searchParams.get('search')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100)
    const offset = parseInt(url.searchParams.get('offset') || '0', 10)

    let result

    if (search) {
      const searchPattern = `%${search.toLowerCase()}%`
      result = await sql`
        SELECT * FROM travel_guides
        WHERE is_published = true
          AND (LOWER(title) LIKE ${searchPattern}
            OR LOWER(subtitle) LIKE ${searchPattern}
            OR LOWER(excerpt) LIKE ${searchPattern})
        ORDER BY
          CASE WHEN LOWER(title) LIKE ${searchPattern} THEN 0 ELSE 1 END,
          published_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else if (category) {
      result = await sql`
        SELECT * FROM travel_guides
        WHERE is_published = true AND category = ${category}
        ORDER BY published_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else if (province) {
      result = await sql`
        SELECT * FROM travel_guides
        WHERE is_published = true AND province = ${province}
        ORDER BY published_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      result = await sql`
        SELECT * FROM travel_guides
        WHERE is_published = true
        ORDER BY published_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    const guides = result.map(transformGuideListing)

    // Get total count
    const countResult = await sql`
      SELECT COUNT(*) as total FROM travel_guides WHERE is_published = true
    `
    const total = parseInt(countResult[0].total, 10)

    return new Response(JSON.stringify({
      guides,
      count: guides.length,
      total,
      hasMore: offset + guides.length < total,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })

  } catch (error) {
    console.error('Guides API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
}
