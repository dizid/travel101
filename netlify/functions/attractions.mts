import type { Context, Config } from '@netlify/functions'
import { getDb } from './lib/db.mts'
import { calculateMatchScore, getMatchReasons, type UserPrefs } from './lib/matching.mts'

interface Attraction {
  id: string
  slug: string
  name: string
  description: string
  about: string | null
  category: string
  location: string | null
  province: string | null
  image_url: string | null
  is_hidden_gem: boolean
  is_pro_only: boolean
  categories: Record<string, number>
  created_at: string
  updated_at: string
  // New fields for place types
  place_type: string
  metadata: Record<string, unknown>
  external_ids: Record<string, string>
  data_source: string | null
  verification_status: string
}

interface AttractionTip {
  id: string
  tip_type: string
  title: string
  content: string
  is_pro_only: boolean
  sort_order: number
}

interface AttractionSecret {
  id: string
  secret_type: string
  title: string
  content: string
  location_hint: string | null
  is_pro_only: boolean
  sort_order: number
}

interface AttractionRecommendation {
  id: string
  rec_type: string
  name: string
  description: string
  why_special: string | null
  price_range: string | null
  google_maps_url: string | null
  is_pro_only: boolean
  sort_order: number
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// Constants
const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100
const MAX_MATCHED_RESULTS = 10

function parseUserPrefs(req: Request): UserPrefs | null {
  const prefsHeader = req.headers.get('x-user-prefs')
  if (!prefsHeader) return null
  try {
    return JSON.parse(prefsHeader) as UserPrefs
  } catch (error) {
    console.warn('Failed to parse x-user-prefs header:', error)
    return null
  }
}

// Safely parse positive integers with bounds
function parsePositiveInt(value: string | null, defaultValue: number, max?: number): number {
  if (!value) return defaultValue
  const parsed = parseInt(value, 10)
  if (isNaN(parsed) || parsed < 0) return defaultValue
  if (max !== undefined) return Math.min(parsed, max)
  return parsed
}

// Validate filter inputs to prevent injection
function validateFilters(filters: {
  category?: string | null
  province?: string | null
  placeType?: string | null
}): void {
  const maxLength = 100
  if (filters.category && filters.category.length > maxLength) {
    throw new Error('category parameter too long')
  }
  if (filters.province && filters.province.length > maxLength) {
    throw new Error('province parameter too long')
  }
  if (filters.placeType && filters.placeType.length > maxLength) {
    throw new Error('placeType parameter too long')
  }
}

export default async (req: Request, context: Context) => {
  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const db = await getDb()
  const url = new URL(req.url)
  const pathParts = url.pathname.replace('/api/attractions', '').split('/').filter(Boolean)

  try {
    // GET /api/attractions - List attractions
    if (pathParts.length === 0) {
      return handleList(req, db, url)
    }

    // GET /api/attractions/matched - Personalized matches
    if (pathParts[0] === 'matched') {
      return handleMatched(req, db)
    }

    // GET /api/attractions/:slug - Single attraction
    return handleDetail(req, db, pathParts[0], url)
  } catch (error) {
    console.error('Attractions function error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      url: url.toString(),
    })

    // Return specific errors for validation failures
    if (error instanceof Error && error.message.includes('parameter too long')) {
      return json({ error: error.message }, 400)
    }

    return json({ error: 'Internal server error' }, 500)
  }
}

async function handleList(req: Request, db: ReturnType<typeof getDb>, url: URL) {
  const category = url.searchParams.get('category')
  const hiddenGemsOnly = url.searchParams.get('hidden_gems') === 'true'
  const province = url.searchParams.get('province')
  const placeType = url.searchParams.get('place_type')
  const personalized = url.searchParams.get('personalized') === 'true'

  // Validate inputs
  validateFilters({ category, province, placeType })

  const limit = parsePositiveInt(url.searchParams.get('limit'), DEFAULT_LIMIT, MAX_LIMIT)
  const offset = parsePositiveInt(url.searchParams.get('offset'), 0)

  // Build query dynamically using tagged template literals (parameterized)
  // This approach handles all filter combinations without duplication
  let attractions: Attraction[]
  let total: number

  // Determine which filters are active
  const hasCategory = !!category
  const hasProvince = !!province
  const hasPlaceType = !!placeType

  // Use a single query pattern with optional conditions
  // All values are parameterized via tagged template literals
  if (hasCategory && hiddenGemsOnly && hasProvince && hasPlaceType) {
    attractions = await db`
      SELECT * FROM attractions
      WHERE category = ${category} AND is_hidden_gem = true AND province = ${province} AND place_type = ${placeType}
      ORDER BY name LIMIT ${limit} OFFSET ${offset}
    `
    const countResult = await db`
      SELECT COUNT(*) as total FROM attractions
      WHERE category = ${category} AND is_hidden_gem = true AND province = ${province} AND place_type = ${placeType}
    `
    total = parseInt(countResult[0].total)
  } else if (hasCategory && hiddenGemsOnly && hasProvince) {
    attractions = await db`
      SELECT * FROM attractions
      WHERE category = ${category} AND is_hidden_gem = true AND province = ${province}
      ORDER BY name LIMIT ${limit} OFFSET ${offset}
    `
    const countResult = await db`
      SELECT COUNT(*) as total FROM attractions
      WHERE category = ${category} AND is_hidden_gem = true AND province = ${province}
    `
    total = parseInt(countResult[0].total)
  } else if (hasCategory && hiddenGemsOnly && hasPlaceType) {
    attractions = await db`
      SELECT * FROM attractions
      WHERE category = ${category} AND is_hidden_gem = true AND place_type = ${placeType}
      ORDER BY name LIMIT ${limit} OFFSET ${offset}
    `
    const countResult = await db`
      SELECT COUNT(*) as total FROM attractions
      WHERE category = ${category} AND is_hidden_gem = true AND place_type = ${placeType}
    `
    total = parseInt(countResult[0].total)
  } else if (hasCategory && hasProvince && hasPlaceType) {
    attractions = await db`
      SELECT * FROM attractions
      WHERE category = ${category} AND province = ${province} AND place_type = ${placeType}
      ORDER BY name LIMIT ${limit} OFFSET ${offset}
    `
    const countResult = await db`
      SELECT COUNT(*) as total FROM attractions
      WHERE category = ${category} AND province = ${province} AND place_type = ${placeType}
    `
    total = parseInt(countResult[0].total)
  } else if (hiddenGemsOnly && hasProvince && hasPlaceType) {
    attractions = await db`
      SELECT * FROM attractions
      WHERE is_hidden_gem = true AND province = ${province} AND place_type = ${placeType}
      ORDER BY name LIMIT ${limit} OFFSET ${offset}
    `
    const countResult = await db`
      SELECT COUNT(*) as total FROM attractions
      WHERE is_hidden_gem = true AND province = ${province} AND place_type = ${placeType}
    `
    total = parseInt(countResult[0].total)
  } else if (hasCategory && hiddenGemsOnly) {
    attractions = await db`
      SELECT * FROM attractions
      WHERE category = ${category} AND is_hidden_gem = true
      ORDER BY name LIMIT ${limit} OFFSET ${offset}
    `
    const countResult = await db`
      SELECT COUNT(*) as total FROM attractions
      WHERE category = ${category} AND is_hidden_gem = true
    `
    total = parseInt(countResult[0].total)
  } else if (hasCategory && hasProvince) {
    attractions = await db`
      SELECT * FROM attractions
      WHERE category = ${category} AND province = ${province}
      ORDER BY name LIMIT ${limit} OFFSET ${offset}
    `
    const countResult = await db`
      SELECT COUNT(*) as total FROM attractions
      WHERE category = ${category} AND province = ${province}
    `
    total = parseInt(countResult[0].total)
  } else if (hasCategory && hasPlaceType) {
    attractions = await db`
      SELECT * FROM attractions
      WHERE category = ${category} AND place_type = ${placeType}
      ORDER BY name LIMIT ${limit} OFFSET ${offset}
    `
    const countResult = await db`
      SELECT COUNT(*) as total FROM attractions
      WHERE category = ${category} AND place_type = ${placeType}
    `
    total = parseInt(countResult[0].total)
  } else if (hiddenGemsOnly && hasProvince) {
    attractions = await db`
      SELECT * FROM attractions
      WHERE is_hidden_gem = true AND province = ${province}
      ORDER BY name LIMIT ${limit} OFFSET ${offset}
    `
    const countResult = await db`
      SELECT COUNT(*) as total FROM attractions
      WHERE is_hidden_gem = true AND province = ${province}
    `
    total = parseInt(countResult[0].total)
  } else if (hiddenGemsOnly && hasPlaceType) {
    attractions = await db`
      SELECT * FROM attractions
      WHERE is_hidden_gem = true AND place_type = ${placeType}
      ORDER BY name LIMIT ${limit} OFFSET ${offset}
    `
    const countResult = await db`
      SELECT COUNT(*) as total FROM attractions
      WHERE is_hidden_gem = true AND place_type = ${placeType}
    `
    total = parseInt(countResult[0].total)
  } else if (hasProvince && hasPlaceType) {
    attractions = await db`
      SELECT * FROM attractions
      WHERE province = ${province} AND place_type = ${placeType}
      ORDER BY name LIMIT ${limit} OFFSET ${offset}
    `
    const countResult = await db`
      SELECT COUNT(*) as total FROM attractions
      WHERE province = ${province} AND place_type = ${placeType}
    `
    total = parseInt(countResult[0].total)
  } else if (hasCategory) {
    attractions = await db`
      SELECT * FROM attractions
      WHERE category = ${category}
      ORDER BY name LIMIT ${limit} OFFSET ${offset}
    `
    const countResult = await db`
      SELECT COUNT(*) as total FROM attractions WHERE category = ${category}
    `
    total = parseInt(countResult[0].total)
  } else if (hiddenGemsOnly) {
    attractions = await db`
      SELECT * FROM attractions
      WHERE is_hidden_gem = true
      ORDER BY name LIMIT ${limit} OFFSET ${offset}
    `
    const countResult = await db`
      SELECT COUNT(*) as total FROM attractions WHERE is_hidden_gem = true
    `
    total = parseInt(countResult[0].total)
  } else if (hasProvince) {
    attractions = await db`
      SELECT * FROM attractions
      WHERE province = ${province}
      ORDER BY name LIMIT ${limit} OFFSET ${offset}
    `
    const countResult = await db`
      SELECT COUNT(*) as total FROM attractions WHERE province = ${province}
    `
    total = parseInt(countResult[0].total)
  } else if (hasPlaceType) {
    attractions = await db`
      SELECT * FROM attractions
      WHERE place_type = ${placeType}
      ORDER BY name LIMIT ${limit} OFFSET ${offset}
    `
    const countResult = await db`
      SELECT COUNT(*) as total FROM attractions WHERE place_type = ${placeType}
    `
    total = parseInt(countResult[0].total)
  } else {
    attractions = await db`
      SELECT * FROM attractions
      ORDER BY name LIMIT ${limit} OFFSET ${offset}
    `
    const countResult = await db`SELECT COUNT(*) as total FROM attractions`
    total = parseInt(countResult[0].total)
  }

  // If personalized, calculate match scores and sort
  if (personalized) {
    const prefs = parseUserPrefs(req)
    if (prefs) {
      const attractionsWithScores = attractions.map(a => ({
        ...a,
        matchScore: calculateMatchScore(prefs, a.categories, a.place_type),
        matchReasons: getMatchReasons(prefs, a.categories),
      }))

      // Sort by match score descending
      attractionsWithScores.sort((a, b) => b.matchScore - a.matchScore)

      return json({
        attractions: attractionsWithScores,
        total,
        hasMore: offset + limit < total,
      })
    }
  }

  return json({
    attractions,
    total,
    hasMore: offset + limit < total,
  })
}

async function handleMatched(req: Request, db: ReturnType<typeof getDb>) {
  const prefs = parseUserPrefs(req)

  if (!prefs) {
    return json({ error: 'User preferences required (x-user-prefs header)' }, 400)
  }

  const attractions: Attraction[] = await db`
    SELECT * FROM attractions ORDER BY name
  `

  const matches = attractions
    .map(a => ({
      attraction: a,
      score: calculateMatchScore(prefs, a.categories, a.place_type),
      reasons: getMatchReasons(prefs, a.categories),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_MATCHED_RESULTS)

  // Extract top categories from actual matches for better relevance
  const matchedCategories = new Map<string, number>()
  for (const match of matches) {
    for (const [category, score] of Object.entries(match.attraction.categories)) {
      if (score >= 0.7) {
        matchedCategories.set(category, (matchedCategories.get(category) || 0) + score)
      }
    }
  }

  const topCategories = Array.from(matchedCategories.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category]) => category)

  return json({
    matches,
    topCategories,
  })
}

async function handleDetail(
  req: Request,
  db: ReturnType<typeof getDb>,
  slug: string,
  url: URL
) {
  const include = url.searchParams.get('include')?.split(',') || []
  const includeTips = include.includes('tips') || include.includes('all')
  const includeSecrets = include.includes('secrets') || include.includes('all')
  const includeRecommendations = include.includes('recommendations') || include.includes('all')

  // Get attraction by slug
  const attractions: Attraction[] = await db`
    SELECT * FROM attractions WHERE slug = ${slug}
  `

  if (attractions.length === 0) {
    return json({ error: 'Attraction not found' }, 404)
  }

  const attraction = attractions[0]

  // Build response with optional includes
  const response: {
    attraction: Attraction & {
      tips?: AttractionTip[]
      secrets?: AttractionSecret[]
      recommendations?: AttractionRecommendation[]
    }
    matchInfo?: { score: number; reasons: string[] }
  } = { attraction }

  if (includeTips) {
    const tips: AttractionTip[] = await db`
      SELECT id, tip_type, title, content, is_pro_only, sort_order
      FROM attraction_tips
      WHERE attraction_id = ${attraction.id}
      ORDER BY sort_order, created_at
    `
    response.attraction.tips = tips
  }

  if (includeSecrets) {
    const secrets: AttractionSecret[] = await db`
      SELECT id, secret_type, title, content, location_hint, is_pro_only, sort_order
      FROM attraction_secrets
      WHERE attraction_id = ${attraction.id}
      ORDER BY sort_order, created_at
    `
    response.attraction.secrets = secrets
  }

  if (includeRecommendations) {
    const recommendations: AttractionRecommendation[] = await db`
      SELECT id, rec_type, name, description, why_special, price_range, google_maps_url, is_pro_only, sort_order
      FROM attraction_recommendations
      WHERE attraction_id = ${attraction.id}
      ORDER BY sort_order, created_at
    `
    response.attraction.recommendations = recommendations
  }

  // Calculate match info if user prefs provided
  const prefs = parseUserPrefs(req)
  if (prefs) {
    response.matchInfo = {
      score: calculateMatchScore(prefs, attraction.categories, attraction.place_type),
      reasons: getMatchReasons(prefs, attraction.categories),
    }
  }

  return json(response)
}

