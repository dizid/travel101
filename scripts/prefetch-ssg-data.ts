/**
 * Pre-fetch all content data from Neon DB for SSG rendering.
 * Runs at build time before vite-ssg renders pages.
 * Writes JSON files to .ssg-data/ that components read during SSR.
 *
 * Uses batch queries (one per table) to minimize DB round-trips.
 * ~10 queries total for the entire site, regardless of page count.
 */

import { neon } from '@neondatabase/serverless'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import dotenv from 'dotenv'

// Load env vars (same as fetch-routes.ts)
dotenv.config({ path: '.env.local' })
dotenv.config()

const DATA_DIR = resolve(process.cwd(), '.ssg-data')

export interface PrefetchResult {
  attractionSlugs: string[]
  heritageSlugs: string[]
  festivalSlugs: string[]
  guideSlugs: string[]
}

/**
 * Read slugs from cached .ssg-data/ JSON files.
 * Used as fallback when DB is unreachable.
 */
function readCachedSlugs(): PrefetchResult {
  try {
    const readJSON = (f: string) => JSON.parse(readFileSync(resolve(DATA_DIR, f), 'utf-8'))
    return {
      attractionSlugs: Object.keys(readJSON('attractions.json')),
      heritageSlugs: Object.keys(readJSON('heritage.json')),
      festivalSlugs: Object.keys(readJSON('festivals.json')),
      guideSlugs: Object.keys(readJSON('guides.json')),
    }
  } catch {
    console.warn('[prefetch-ssg] No cached data found — SSG will render empty pages')
    return { attractionSlugs: [], heritageSlugs: [], festivalSlugs: [], guideSlugs: [] }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function groupBy(arr: any[], key: string): Record<string, any[]> {
  const result: Record<string, any[]> = {}
  for (const item of arr) {
    const k = item[key]
    if (!result[k]) result[k] = []
    result[k].push(item)
  }
  return result
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function writeJSON(filename: string, data: any): void {
  writeFileSync(resolve(DATA_DIR, filename), JSON.stringify(data))
}

/**
 * Compute the next upcoming date for a festival and days until it.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function computeFestivalDates(f: any): { nextDate: string | null; daysUntil: number; isOngoing: boolean } {
  const now = new Date()
  const year = now.getFullYear()

  // Try this year's date first, then next year's
  const dateStr = year === 2025 ? f.date_2025 : f.date_2026
  if (!dateStr) return { nextDate: null, daysUntil: -1, isOngoing: false }

  const festDate = new Date(dateStr)
  const endDate = new Date(festDate)
  endDate.setDate(endDate.getDate() + (f.duration_days || 1) - 1)

  const isOngoing = now >= festDate && now <= endDate
  const diffMs = festDate.getTime() - now.getTime()
  const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  return { nextDate: dateStr, daysUntil, isOngoing }
}

/**
 * Transform a raw DB festival row to the camelCase format the frontend expects.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformFestival(row: any) {
  const dates = computeFestivalDates(row)
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
    region: row.region,
    imageUrl: row.image_url,
    activities: row.activities,
    tips: row.tips,
    dressCode: row.dress_code,
    festivalType: row.festival_type,
    religion: row.religion,
    isHiddenGem: row.is_hidden_gem,
    crowdLevel: row.crowd_level,
    foreignerFriendly: row.foreigner_friendly,
    nextDate: dates.nextDate,
    daysUntil: dates.daysUntil,
    isOngoing: dates.isOngoing,
  }
}

/**
 * Transform a raw DB guide row to the camelCase format the frontend expects.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformGuide(row: any, includeContent = true) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    ...(includeContent ? { content: row.content } : {}),
    excerpt: row.excerpt,
    category: row.category,
    province: row.province,
    imageUrl: row.image_url,
    imageAlt: row.image_alt,
    author: row.author,
    readingTimeMin: row.reading_time_min,
    tags: row.tags,
    isPublished: row.is_published,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    viewCount: row.view_count,
  }
}

/**
 * Transform a heritage image row to camelCase.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformHeritageImage(row: any) {
  return {
    id: row.id,
    attractionId: row.attraction_id,
    imageUrl: row.image_url,
    thumbnailUrl: row.thumbnail_url,
    caption: row.caption,
    altText: row.alt_text,
    source: row.source,
    sourceUrl: row.source_url,
    photographer: row.photographer,
    photographerUrl: row.photographer_url,
    license: row.license,
    isPrimary: row.is_primary,
    displayOrder: row.display_order,
    width: row.width,
    height: row.height,
    blurHash: row.blur_hash,
  }
}

/**
 * Transform a heritage event row to camelCase.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformHeritageEvent(row: any) {
  return {
    id: row.id,
    attractionId: row.attraction_id,
    eventYear: row.event_year,
    eventYearEnd: row.event_year_end,
    eventEra: row.event_era,
    title: row.title,
    description: row.description,
    eventType: row.event_type,
    isApproximate: row.is_approximate,
    sortOrder: row.sort_order,
  }
}

/**
 * Main pre-fetch function. Call before SSG rendering starts.
 * Returns slugs for route generation (avoids a second DB connection).
 */
export async function prefetchSSGData(): Promise<PrefetchResult> {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.warn('[prefetch-ssg] DATABASE_URL not set — checking for cached data')
    return readCachedSlugs()
  }

  // Ensure data directory exists
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })

  let sql: ReturnType<typeof neon>
  try {
    sql = neon(databaseUrl)
  } catch {
    console.warn('[prefetch-ssg] Failed to create DB client — using cached data')
    return readCachedSlugs()
  }

  console.log('[prefetch-ssg] Fetching all content from database...')

  // Wrap DB queries in try/catch — fall back to cached data on network failure
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let results: any[][]
  try {
    // Batch fetch all data in parallel (~10 queries)
    results = await Promise.all([
      sql`SELECT * FROM attractions WHERE verification_status != 'rejected' ORDER BY name`,
      sql`SELECT id, attraction_id, tip_type, title, content, is_pro_only, sort_order, created_at FROM attraction_tips ORDER BY attraction_id, sort_order, created_at`,
      sql`SELECT id, attraction_id, secret_type, title, content, location_hint, is_pro_only, sort_order, created_at FROM attraction_secrets ORDER BY attraction_id, sort_order, created_at`,
      sql`SELECT id, attraction_id, rec_type, name, description, why_special, price_range, google_maps_url, is_pro_only, sort_order, created_at FROM attraction_recommendations ORDER BY attraction_id, sort_order, created_at`,
      sql`SELECT * FROM heritage_images ORDER BY attraction_id, is_primary DESC, display_order`,
      sql`SELECT * FROM heritage_events ORDER BY attraction_id, sort_order, event_year NULLS LAST`,
      sql`SELECT * FROM thai_festivals ORDER BY month_typical, name`,
      sql`SELECT * FROM travel_guides WHERE is_published = true ORDER BY published_at DESC`,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ]) as any[][]
  } catch (err) {
    console.warn(`[prefetch-ssg] DB query failed: ${(err as Error).message}`)
    console.warn('[prefetch-ssg] Falling back to cached .ssg-data/ files')
    return readCachedSlugs()
  }

  const [
    allAttractions,
    allTips,
    allSecrets,
    allRecommendations,
    allHeritageImages,
    allHeritageEvents,
    allFestivals,
    allGuides,
  ] = results

  // Group related data by attraction_id for fast lookup
  const tipsByAttraction = groupBy(allTips, 'attraction_id')
  const secretsByAttraction = groupBy(allSecrets, 'attraction_id')
  const recsByAttraction = groupBy(allRecommendations, 'attraction_id')
  const imagesByAttraction = groupBy(allHeritageImages, 'attraction_id')
  const eventsByAttraction = groupBy(allHeritageEvents, 'attraction_id')

  // Build attraction data (keyed by slug)
  // Attractions are stored in snake_case — the countryStore's transformAttractionDetail handles conversion
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attractionsBySlug: Record<string, any> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attractionList: any[] = []

  // Heritage data uses a different response format
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const heritageBySlug: Record<string, any> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const heritageList: any[] = []

  for (const a of allAttractions) {
    if (a.place_type === 'heritage') {
      // Heritage sites use the /api/heritage/:slug format
      const site = {
        ...a,
        heritageMetadata: a.metadata || {},
        images: (imagesByAttraction[a.id] || []).map(transformHeritageImage),
        timeline: (eventsByAttraction[a.id] || []).map(transformHeritageEvent),
        tips: tipsByAttraction[a.id] || [],
        secrets: secretsByAttraction[a.id] || [],
        recommendations: recsByAttraction[a.id] || [],
      }
      heritageBySlug[a.slug] = site
      heritageList.push({
        ...a,
        heritageMetadata: a.metadata || {},
        primaryImage: (imagesByAttraction[a.id] || []).find((img: { is_primary: boolean }) => img.is_primary) || null,
        imageCount: (imagesByAttraction[a.id] || []).length,
        eventCount: (eventsByAttraction[a.id] || []).length,
      })
    } else {
      // Regular attractions — stored in snake_case (store's transform handles conversion)
      const enriched = {
        ...a,
        tips: tipsByAttraction[a.id] || [],
        secrets: secretsByAttraction[a.id] || [],
        recommendations: recsByAttraction[a.id] || [],
      }
      attractionsBySlug[a.slug] = enriched
      attractionList.push(a) // List doesn't need tips/secrets/recs
    }
  }

  // Transform festivals to camelCase (matches API response format)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const festivalsBySlug: Record<string, any> = {}
  const festivalList = allFestivals.map(transformFestival)
  for (const f of festivalList) {
    festivalsBySlug[f.slug] = f
  }

  // Transform guides to camelCase (matches API response format)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const guidesBySlug: Record<string, any> = {}
  for (const g of allGuides) {
    guidesBySlug[g.slug] = transformGuide(g, true)
  }
  const guideList = allGuides.map(g => transformGuide(g, false))

  // Write all data files
  writeJSON('attractions.json', attractionsBySlug)
  writeJSON('heritage.json', heritageBySlug)
  writeJSON('festivals.json', festivalsBySlug)
  writeJSON('guides.json', guidesBySlug)
  writeJSON('attractions-list.json', attractionList)
  writeJSON('heritage-list.json', heritageList)
  writeJSON('festivals-list.json', festivalList)
  writeJSON('guides-list.json', guideList)

  const counts = {
    attractions: Object.keys(attractionsBySlug).length,
    heritage: Object.keys(heritageBySlug).length,
    festivals: Object.keys(festivalsBySlug).length,
    guides: Object.keys(guidesBySlug).length,
  }
  console.log(`[prefetch-ssg] Pre-fetched: ${counts.attractions} attractions, ${counts.heritage} heritage, ${counts.festivals} festivals, ${counts.guides} guides`)

  // Return slugs so vite config can generate routes without a second DB connection
  return {
    attractionSlugs: Object.keys(attractionsBySlug),
    heritageSlugs: Object.keys(heritageBySlug),
    festivalSlugs: Object.keys(festivalsBySlug),
    guideSlugs: Object.keys(guidesBySlug),
  }
}
