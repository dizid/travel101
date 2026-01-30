import type { Context, Config } from '@netlify/functions'
import { getDb } from './lib/db.mts'

// Database row types
interface HeritageAttraction {
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
  place_type: string
  metadata: HeritageMetadata
  created_at: string
  updated_at: string
}

interface HeritageMetadata {
  constructionDate?: string
  constructionEra?: string
  architecturalStyles?: string[]
  unescoStatus?: 'world_heritage_site' | 'tentative_list' | null
  unescoInscriptionYear?: number
  unescoCriteria?: string[]
  kingdomDynasty?: string
  religiousSignificance?: string
  entryFeeTHB?: number
  entryFeeForeignerTHB?: number
  openingHours?: string
  dressCode?: string
  bestTimeToVisit?: string
  heritageType?: string
  historicalSignificance?: string
}

interface HeritageImage {
  id: string
  attraction_id: string
  image_url: string
  thumbnail_url: string | null
  caption: string | null
  alt_text: string
  source: string | null
  source_url: string | null
  photographer: string | null
  photographer_url: string | null
  license: string | null
  is_primary: boolean
  display_order: number
  width: number | null
  height: number | null
  blur_hash: string | null
  created_at: string
}

interface HeritageEvent {
  id: string
  attraction_id: string
  event_year: number | null
  event_year_end: number | null
  event_era: string | null
  title: string
  description: string
  event_type: string | null
  is_approximate: boolean
  sort_order: number
  created_at: string
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

export default async (req: Request, context: Context) => {
  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const db = await getDb()
  const url = new URL(req.url)
  const pathParts = url.pathname.replace('/api/heritage', '').split('/').filter(Boolean)

  try {
    // GET /api/heritage - List heritage sites
    if (pathParts.length === 0) {
      return handleList(db, url)
    }

    // GET /api/heritage/eras - List available eras
    if (pathParts[0] === 'eras') {
      return handleEras(db)
    }

    // GET /api/heritage/regions - List available regions/provinces
    if (pathParts[0] === 'regions') {
      return handleRegions(db)
    }

    // GET /api/heritage/:slug - Single heritage site detail
    return handleDetail(db, pathParts[0])
  } catch (error) {
    console.error('Heritage function error:', error)
    return json({ error: 'Internal server error' }, 500)
  }
}

async function handleList(db: ReturnType<typeof getDb>, url: URL) {
  const era = url.searchParams.get('era')
  const region = url.searchParams.get('region')
  const unescoOnly = url.searchParams.get('unesco') === 'true'
  const heritageType = url.searchParams.get('type')
  const search = url.searchParams.get('search')
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
  const offset = parseInt(url.searchParams.get('offset') || '0')

  // Build query based on filters
  let sites: HeritageAttraction[]

  if (unescoOnly && era) {
    sites = await db`
      SELECT * FROM attractions
      WHERE place_type = 'heritage'
        AND metadata->>'unescoStatus' = 'world_heritage_site'
        AND metadata->>'constructionEra' = ${era}
      ORDER BY name
      LIMIT ${limit} OFFSET ${offset}
    `
  } else if (unescoOnly) {
    sites = await db`
      SELECT * FROM attractions
      WHERE place_type = 'heritage'
        AND metadata->>'unescoStatus' = 'world_heritage_site'
      ORDER BY name
      LIMIT ${limit} OFFSET ${offset}
    `
  } else if (era) {
    sites = await db`
      SELECT * FROM attractions
      WHERE place_type = 'heritage'
        AND metadata->>'constructionEra' = ${era}
      ORDER BY name
      LIMIT ${limit} OFFSET ${offset}
    `
  } else if (region) {
    sites = await db`
      SELECT * FROM attractions
      WHERE place_type = 'heritage'
        AND province = ${region}
      ORDER BY name
      LIMIT ${limit} OFFSET ${offset}
    `
  } else if (heritageType) {
    sites = await db`
      SELECT * FROM attractions
      WHERE place_type = 'heritage'
        AND metadata->>'heritageType' = ${heritageType}
      ORDER BY name
      LIMIT ${limit} OFFSET ${offset}
    `
  } else if (search) {
    const searchPattern = `%${search}%`
    sites = await db`
      SELECT * FROM attractions
      WHERE place_type = 'heritage'
        AND (name ILIKE ${searchPattern} OR description ILIKE ${searchPattern})
      ORDER BY name
      LIMIT ${limit} OFFSET ${offset}
    `
  } else {
    sites = await db`
      SELECT * FROM attractions
      WHERE place_type = 'heritage'
      ORDER BY
        CASE WHEN metadata->>'unescoStatus' = 'world_heritage_site' THEN 0 ELSE 1 END,
        name
      LIMIT ${limit} OFFSET ${offset}
    `
  }

  // Get primary image for each site
  const siteIds = sites.map(s => s.id)
  let primaryImages: HeritageImage[] = []

  if (siteIds.length > 0) {
    primaryImages = await db`
      SELECT DISTINCT ON (attraction_id) *
      FROM heritage_images
      WHERE attraction_id = ANY(${siteIds})
      ORDER BY attraction_id, is_primary DESC, display_order
    `
  }

  // Transform and create a map of images by attraction_id
  const transformImage = (img: HeritageImage) => ({
    id: img.id,
    attractionId: img.attraction_id,
    imageUrl: img.image_url,
    thumbnailUrl: img.thumbnail_url,
    caption: img.caption,
    altText: img.alt_text,
    source: img.source,
    sourceUrl: img.source_url,
    photographer: img.photographer,
    photographerUrl: img.photographer_url,
    license: img.license,
    isPrimary: img.is_primary,
    displayOrder: img.display_order,
    width: img.width,
    height: img.height,
    blurHash: img.blur_hash,
  })
  const imageMap = new Map(primaryImages.map(img => [img.attraction_id, transformImage(img)]))

  // Get image and event counts
  let imageCounts: { attraction_id: string; count: string }[] = []
  let eventCounts: { attraction_id: string; count: string }[] = []

  if (siteIds.length > 0) {
    imageCounts = await db`
      SELECT attraction_id, COUNT(*)::text as count
      FROM heritage_images
      WHERE attraction_id = ANY(${siteIds})
      GROUP BY attraction_id
    `
    eventCounts = await db`
      SELECT attraction_id, COUNT(*)::text as count
      FROM heritage_events
      WHERE attraction_id = ANY(${siteIds})
      GROUP BY attraction_id
    `
  }

  const imageCountMap = new Map(imageCounts.map(c => [c.attraction_id, parseInt(c.count)]))
  const eventCountMap = new Map(eventCounts.map(c => [c.attraction_id, parseInt(c.count)]))

  // Transform to response format
  const sitesWithData = sites.map(site => ({
    ...site,
    heritageMetadata: site.metadata || {},
    primaryImage: imageMap.get(site.id) || null,
    imageCount: imageCountMap.get(site.id) || 0,
    eventCount: eventCountMap.get(site.id) || 0,
  }))

  // Get total count
  const countResult = await db`
    SELECT COUNT(*) as total FROM attractions WHERE place_type = 'heritage'
  `
  const total = parseInt(countResult[0].total)

  return json({
    sites: sitesWithData,
    total,
    hasMore: offset + limit < total,
  })
}

async function handleDetail(db: ReturnType<typeof getDb>, slug: string) {
  // Get heritage site by slug
  const sites: HeritageAttraction[] = await db`
    SELECT * FROM attractions
    WHERE slug = ${slug} AND place_type = 'heritage'
  `

  if (sites.length === 0) {
    // Check if it exists but isn't heritage
    const anyAttractions = await db`
      SELECT id FROM attractions WHERE slug = ${slug}
    `
    if (anyAttractions.length > 0) {
      return json({ error: 'This attraction is not a heritage site' }, 400)
    }
    return json({ error: 'Heritage site not found' }, 404)
  }

  const site = sites[0]

  // Get all images
  const images: HeritageImage[] = await db`
    SELECT *
    FROM heritage_images
    WHERE attraction_id = ${site.id}
    ORDER BY is_primary DESC, display_order
  `

  // Get timeline events
  const timeline: HeritageEvent[] = await db`
    SELECT *
    FROM heritage_events
    WHERE attraction_id = ${site.id}
    ORDER BY sort_order, event_year NULLS LAST
  `

  // Get tips
  const tips: AttractionTip[] = await db`
    SELECT id, tip_type, title, content, is_pro_only, sort_order
    FROM attraction_tips
    WHERE attraction_id = ${site.id}
    ORDER BY sort_order, created_at
  `

  // Get secrets
  const secrets: AttractionSecret[] = await db`
    SELECT id, secret_type, title, content, location_hint, is_pro_only, sort_order
    FROM attraction_secrets
    WHERE attraction_id = ${site.id}
    ORDER BY sort_order, created_at
  `

  // Get recommendations
  const recommendations: AttractionRecommendation[] = await db`
    SELECT id, rec_type, name, description, why_special, price_range, google_maps_url, is_pro_only, sort_order
    FROM attraction_recommendations
    WHERE attraction_id = ${site.id}
    ORDER BY sort_order, created_at
  `

  // Transform snake_case to camelCase for frontend
  const transformedImages = images.map(img => ({
    id: img.id,
    attractionId: img.attraction_id,
    imageUrl: img.image_url,
    thumbnailUrl: img.thumbnail_url,
    caption: img.caption,
    altText: img.alt_text,
    source: img.source,
    sourceUrl: img.source_url,
    photographer: img.photographer,
    photographerUrl: img.photographer_url,
    license: img.license,
    isPrimary: img.is_primary,
    displayOrder: img.display_order,
    width: img.width,
    height: img.height,
    blurHash: img.blur_hash,
  }))

  const transformedTimeline = timeline.map(evt => ({
    id: evt.id,
    attractionId: evt.attraction_id,
    eventYear: evt.event_year,
    eventYearEnd: evt.event_year_end,
    eventEra: evt.event_era,
    title: evt.title,
    description: evt.description,
    eventType: evt.event_type,
    isApproximate: evt.is_approximate,
    sortOrder: evt.sort_order,
  }))

  return json({
    site: {
      ...site,
      heritageMetadata: site.metadata || {},
      images: transformedImages,
      timeline: transformedTimeline,
      tips,
      secrets,
      recommendations,
    },
  })
}

async function handleEras(db: ReturnType<typeof getDb>) {
  // Get distinct eras from heritage sites
  const eras = await db`
    SELECT DISTINCT metadata->>'constructionEra' as era
    FROM attractions
    WHERE place_type = 'heritage'
      AND metadata->>'constructionEra' IS NOT NULL
    ORDER BY era
  `

  // Define era order for sorting
  const eraOrder = [
    'Prehistoric',
    'Dvaravati Period',
    'Srivijaya Period',
    'Khmer Period',
    'Sukhothai Period',
    'Ayutthaya Period',
    'Thonburi Period',
    'Rattanakosin Period',
    'Modern',
  ]

  const sortedEras = eras
    .map(e => e.era)
    .filter(Boolean)
    .sort((a, b) => {
      const aIndex = eraOrder.indexOf(a)
      const bIndex = eraOrder.indexOf(b)
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    })

  return json({ eras: sortedEras })
}

async function handleRegions(db: ReturnType<typeof getDb>) {
  // Get distinct provinces with heritage sites
  const regions = await db`
    SELECT DISTINCT province, COUNT(*)::int as count
    FROM attractions
    WHERE place_type = 'heritage'
      AND province IS NOT NULL
    GROUP BY province
    ORDER BY count DESC, province
  `

  return json({
    regions: regions.map(r => ({
      name: r.province,
      count: r.count,
    })),
  })
}

// Routing handled by netlify.toml redirects
