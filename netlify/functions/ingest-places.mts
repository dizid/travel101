import type { Context, Config } from '@netlify/functions'
import { getDb } from './lib/db.mts'

interface PlaceInput {
  slug: string
  name: string
  description: string
  about?: string
  category: string
  location?: string
  province?: string
  imageUrl?: string
  isHiddenGem?: boolean
  isProOnly?: boolean
  placeType: 'attraction' | 'course' | 'tour' | 'activity' | 'coworking' | 'restaurant' | 'event'
  metadata?: Record<string, unknown>
  externalIds?: Record<string, string>
  dataSource: string
}

interface RequestBody {
  action: 'ingest_single' | 'ingest_batch' | 'list_by_source'
  place?: PlaceInput
  places?: PlaceInput[]
  source?: string
  limit?: number
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function generateSlug(name: string, placeType: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${base}-${placeType}`
}

async function ingestSingle(db: ReturnType<typeof getDb>, place: PlaceInput) {
  const slug = place.slug || generateSlug(place.name, place.placeType)

  // Check for existing place with same slug
  const existing = await db`
    SELECT id, slug FROM attractions WHERE slug = ${slug}
  `

  if (existing.length > 0) {
    return {
      success: false,
      error: 'Place with this slug already exists',
      existingId: existing[0].id
    }
  }

  // Check for duplicate by external ID
  if (place.externalIds && Object.keys(place.externalIds).length > 0) {
    for (const [key, value] of Object.entries(place.externalIds)) {
      const duplicates = await db`
        SELECT id, slug FROM attractions
        WHERE external_ids->${key} = ${value}
      `
      if (duplicates.length > 0) {
        return {
          success: false,
          error: `Place with ${key}=${value} already exists`,
          existingId: duplicates[0].id
        }
      }
    }
  }

  // Insert new place
  const result = await db`
    INSERT INTO attractions (
      slug, name, description, about, category, location, province,
      image_url, is_hidden_gem, is_pro_only, place_type, metadata,
      external_ids, data_source, verification_status
    ) VALUES (
      ${slug},
      ${place.name},
      ${place.description},
      ${place.about || null},
      ${place.category},
      ${place.location || null},
      ${place.province || null},
      ${place.imageUrl || null},
      ${place.isHiddenGem || false},
      ${place.isProOnly || false},
      ${place.placeType},
      ${JSON.stringify(place.metadata || {})},
      ${JSON.stringify(place.externalIds || {})},
      ${place.dataSource},
      'pending'
    ) RETURNING id, slug
  `

  return {
    success: true,
    id: result[0].id,
    slug: result[0].slug,
    needsEnrichment: true
  }
}

async function ingestBatch(db: ReturnType<typeof getDb>, places: PlaceInput[]) {
  const results = []

  for (const place of places) {
    try {
      const result = await ingestSingle(db, place)
      results.push({
        name: place.name,
        ...result
      })
    } catch (error) {
      results.push({
        name: place.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  return {
    total: places.length,
    successful,
    failed,
    results
  }
}

async function listBySource(db: ReturnType<typeof getDb>, source: string, limit: number) {
  const places = await db`
    SELECT id, slug, name, place_type, verification_status, created_at
    FROM attractions
    WHERE data_source = ${source}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `

  const counts = await db`
    SELECT place_type, COUNT(*) as count
    FROM attractions
    WHERE data_source = ${source}
    GROUP BY place_type
  `

  return {
    source,
    places,
    countsByType: counts.reduce((acc, row) => {
      acc[row.place_type] = parseInt(row.count)
      return acc
    }, {} as Record<string, number>)
  }
}

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  // Simple auth check
  const adminKey = req.headers.get('x-admin-key')
  const expectedKey = Netlify.env.get('ADMIN_API_KEY')
  if (expectedKey && adminKey !== expectedKey) {
    return json({ error: 'Unauthorized' }, 401)
  }

  try {
    const body: RequestBody = await req.json()
    const { action, place, places, source, limit = 50 } = body

    const db = getDb()

    switch (action) {
      case 'ingest_single':
        if (!place) {
          return json({ error: 'place required for ingest_single' }, 400)
        }
        const singleResult = await ingestSingle(db, place)
        return json(singleResult)

      case 'ingest_batch':
        if (!places || places.length === 0) {
          return json({ error: 'places array required for ingest_batch' }, 400)
        }
        const batchResult = await ingestBatch(db, places)
        return json(batchResult)

      case 'list_by_source':
        if (!source) {
          return json({ error: 'source required for list_by_source' }, 400)
        }
        const listResult = await listBySource(db, source, Math.min(limit, 100))
        return json(listResult)

      default:
        return json({ error: 'Invalid action. Use: ingest_single, ingest_batch, list_by_source' }, 400)
    }
  } catch (error) {
    console.error('Ingest places error:', error)
    return json({ error: 'Failed to process ingestion request' }, 500)
  }
}

export const config: Config = {
  path: '/api/ingest-places',
}
