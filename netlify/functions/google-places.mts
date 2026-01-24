import type { Context, Config } from '@netlify/functions'
import { getDb } from './lib/db.mts'

// ==========================================
// TYPES
// ==========================================

type PlaceType = 'attraction' | 'course' | 'tour' | 'activity' | 'coworking' | 'restaurant' | 'event' | 'heritage'

interface GooglePlacesTextSearchRequest {
  textQuery: string
  includedType?: string
  languageCode?: string
  regionCode?: string
  locationBias?: {
    circle?: {
      center: { latitude: number; longitude: number }
      radius: number
    }
  }
  maxResultCount?: number
  pageToken?: string
}

interface GooglePlaceResult {
  id: string
  displayName: {
    text: string
    languageCode: string
  }
  formattedAddress?: string
  shortFormattedAddress?: string
  location?: {
    latitude: number
    longitude: number
  }
  rating?: number
  userRatingCount?: number
  priceLevel?: string
  types?: string[]
  primaryType?: string
  primaryTypeDisplayName?: {
    text: string
    languageCode: string
  }
  editorialSummary?: {
    text: string
    languageCode: string
  }
  websiteUri?: string
  googleMapsUri?: string
  regularOpeningHours?: {
    openNow?: boolean
    weekdayDescriptions?: string[]
  }
  internationalPhoneNumber?: string
  businessStatus?: string
}

interface GooglePlacesSearchResponse {
  places?: GooglePlaceResult[]
  nextPageToken?: string
}

interface PlaceInput {
  slug: string
  name: string
  description: string
  about?: string | null
  category: string
  location?: string | null
  province?: string | null
  imageUrl?: string | null
  isHiddenGem?: boolean
  isProOnly?: boolean
  placeType: PlaceType
  metadata?: Record<string, unknown>
  externalIds?: Record<string, string>
  dataSource: string
}

interface RequestBody {
  action: 'search_and_ingest' | 'get_place_details' | 'ingest_by_province' | 'list_provinces'
  query?: string
  includedType?: string
  province?: string
  placeTypes?: string[]
  placeId?: string
  maxPages?: number
}

// ==========================================
// CONSTANTS
// ==========================================

// Field masks for cost optimization
const STANDARD_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.shortFormattedAddress',
  'places.location',
  'places.types',
  'places.primaryType',
  'places.primaryTypeDisplayName',
  'places.rating',
  'places.userRatingCount',
  'places.priceLevel',
  'places.websiteUri',
  'places.googleMapsUri',
  'places.regularOpeningHours',
  'places.editorialSummary',
  'places.businessStatus',
].join(',')

const DETAIL_FIELD_MASK = [
  'id',
  'displayName',
  'formattedAddress',
  'shortFormattedAddress',
  'location',
  'types',
  'primaryType',
  'primaryTypeDisplayName',
  'rating',
  'userRatingCount',
  'priceLevel',
  'websiteUri',
  'googleMapsUri',
  'regularOpeningHours',
  'editorialSummary',
  'internationalPhoneNumber',
  'businessStatus',
].join(',')

// Thai provinces with search parameters
const THAI_PROVINCES: Record<string, {
  name: string
  center: { lat: number; lng: number }
  radius: number
  aliases: string[]
}> = {
  bangkok: {
    name: 'Bangkok',
    center: { lat: 13.7563, lng: 100.5018 },
    radius: 25000,
    aliases: ['Krung Thep', 'BKK']
  },
  chiang_mai: {
    name: 'Chiang Mai',
    center: { lat: 18.7883, lng: 98.9853 },
    radius: 20000,
    aliases: ['Chiangmai']
  },
  phuket: {
    name: 'Phuket',
    center: { lat: 7.8804, lng: 98.3923 },
    radius: 30000,
    aliases: ['Phuket Island']
  },
  krabi: {
    name: 'Krabi',
    center: { lat: 8.0863, lng: 98.9063 },
    radius: 30000,
    aliases: ['Ao Nang', 'Railay']
  },
  surat_thani: {
    name: 'Surat Thani',
    center: { lat: 9.1382, lng: 99.3217 },
    radius: 50000,
    aliases: ['Koh Samui', 'Koh Phangan', 'Koh Tao']
  },
  chonburi: {
    name: 'Chonburi',
    center: { lat: 12.9236, lng: 100.8825 },
    radius: 30000,
    aliases: ['Pattaya', 'Bang Saen', 'Koh Larn']
  },
  chiang_rai: {
    name: 'Chiang Rai',
    center: { lat: 19.9105, lng: 99.8406 },
    radius: 25000,
    aliases: ['Golden Triangle']
  },
  ayutthaya: {
    name: 'Ayutthaya',
    center: { lat: 14.3692, lng: 100.5877 },
    radius: 15000,
    aliases: ['Phra Nakhon Si Ayutthaya']
  },
  kanchanaburi: {
    name: 'Kanchanaburi',
    center: { lat: 14.0228, lng: 99.5328 },
    radius: 40000,
    aliases: ['River Kwai']
  },
  nakhon_ratchasima: {
    name: 'Nakhon Ratchasima',
    center: { lat: 14.9799, lng: 102.0978 },
    radius: 30000,
    aliases: ['Korat', 'Khao Yai']
  }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

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

// Map Google place types to app place types
function mapGoogleTypeToPlaceType(googleTypes: string[], primaryType?: string): PlaceType {
  const typeString = primaryType || googleTypes[0] || ''

  const typeMap: Record<string, PlaceType> = {
    tourist_attraction: 'attraction',
    museum: 'attraction',
    park: 'attraction',
    zoo: 'attraction',
    aquarium: 'attraction',
    amusement_park: 'attraction',
    art_gallery: 'attraction',
    hindu_temple: 'attraction',
    buddhist_temple: 'attraction',
    temple: 'attraction',
    historical_landmark: 'attraction',
    national_park: 'attraction',
    beach: 'attraction',
    waterfall: 'attraction',
    church: 'attraction',
    mosque: 'attraction',
    landmark: 'attraction',

    restaurant: 'restaurant',
    cafe: 'restaurant',
    bar: 'restaurant',
    bakery: 'restaurant',
    coffee_shop: 'restaurant',
    food_court: 'restaurant',
    seafood_restaurant: 'restaurant',
    thai_restaurant: 'restaurant',

    travel_agency: 'tour',

    diving_center: 'activity',
    golf_course: 'activity',
    gym: 'activity',
    spa: 'activity',

    // Nightlife venues
    night_club: 'activity',
    nightclub: 'activity',
    karaoke: 'activity',
    disco: 'activity',
    pub: 'restaurant',

    coworking_space: 'coworking',
  }

  return typeMap[typeString] || 'attraction'
}

// Map Google place types to category
function mapGoogleTypeToCategory(googleTypes: string[], primaryType?: string): string {
  const typeString = primaryType || googleTypes[0] || ''

  const categoryMap: Record<string, string> = {
    tourist_attraction: 'culture',
    museum: 'culture',
    hindu_temple: 'culture',
    buddhist_temple: 'culture',
    temple: 'culture',
    church: 'culture',
    mosque: 'culture',
    historical_landmark: 'history',
    landmark: 'culture',
    park: 'nature',
    national_park: 'nature',
    beach: 'beach',
    waterfall: 'nature',
    zoo: 'nature',
    aquarium: 'nature',
    amusement_park: 'adventure',
    art_gallery: 'culture',
    restaurant: 'food',
    cafe: 'food',
    thai_restaurant: 'food',
    seafood_restaurant: 'food',
    bar: 'nightlife',
    night_club: 'nightlife',
    nightclub: 'nightlife',
    karaoke: 'nightlife',
    disco: 'nightlife',
    pub: 'nightlife',
    spa: 'wellness',
    diving_center: 'adventure',
    golf_course: 'adventure',
  }

  return categoryMap[typeString] || 'culture'
}

// Map Google price level
function mapPriceLevel(priceLevel?: string): { priceRange?: string } {
  const map: Record<string, string> = {
    PRICE_LEVEL_FREE: 'free',
    PRICE_LEVEL_INEXPENSIVE: '$',
    PRICE_LEVEL_MODERATE: '$$',
    PRICE_LEVEL_EXPENSIVE: '$$$',
    PRICE_LEVEL_VERY_EXPENSIVE: '$$$$',
  }
  return priceLevel ? { priceRange: map[priceLevel] } : {}
}

// Extract province from formatted address
function extractProvince(formattedAddress: string): string | null {
  for (const province of Object.values(THAI_PROVINCES)) {
    if (formattedAddress.includes(province.name)) {
      return province.name
    }
    for (const alias of province.aliases) {
      if (formattedAddress.includes(alias)) {
        return province.name
      }
    }
  }
  return null
}

// Map Google Place to PlaceInput
function mapGooglePlaceToPlaceInput(place: GooglePlaceResult): PlaceInput {
  const placeType = mapGoogleTypeToPlaceType(place.types || [], place.primaryType)
  const category = mapGoogleTypeToCategory(place.types || [], place.primaryType)
  const pricing = mapPriceLevel(place.priceLevel)
  const province = extractProvince(place.formattedAddress || '')

  const description = place.editorialSummary?.text
    || `${place.displayName.text} is a ${place.primaryTypeDisplayName?.text || category} located in ${province || 'Thailand'}.`

  return {
    slug: '',
    name: place.displayName.text,
    description,
    about: place.editorialSummary?.text || null,
    category,
    location: place.shortFormattedAddress || place.formattedAddress || null,
    province,
    imageUrl: null,
    isHiddenGem: (place.userRatingCount || 0) < 100 && (place.rating || 0) >= 4.5,
    isProOnly: false,
    placeType,
    metadata: {
      rating: place.rating,
      userRatingCount: place.userRatingCount,
      priceRange: pricing.priceRange,
      googleMapsUrl: place.googleMapsUri,
      websiteUrl: place.websiteUri,
      phoneNumber: place.internationalPhoneNumber,
      openingHours: place.regularOpeningHours?.weekdayDescriptions,
      googleTypes: place.types,
      businessStatus: place.businessStatus,
    },
    externalIds: {
      google_place_id: place.id,
    },
    dataSource: 'google_places',
  }
}

// ==========================================
// API FUNCTIONS
// ==========================================

async function searchPlaces(
  apiKey: string,
  query: string,
  options: {
    includedType?: string
    province?: string
    pageToken?: string
  }
): Promise<GooglePlacesSearchResponse> {
  const province = options.province ? THAI_PROVINCES[options.province] : null

  const requestBody: GooglePlacesTextSearchRequest = {
    textQuery: query,
    languageCode: 'en',
    regionCode: 'TH',
    maxResultCount: 20,
    ...(options.includedType && { includedType: options.includedType }),
    ...(options.pageToken && { pageToken: options.pageToken }),
    ...(province && {
      locationBias: {
        circle: {
          center: { latitude: province.center.lat, longitude: province.center.lng },
          radius: province.radius,
        }
      }
    }),
  }

  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': STANDARD_FIELD_MASK,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Google Places API error: ${response.status} - ${error}`)
  }

  return response.json()
}

async function getPlaceDetails(
  apiKey: string,
  placeId: string
): Promise<GooglePlaceResult> {
  const response = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}`,
    {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': DETAIL_FIELD_MASK,
      },
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Google Places API error: ${response.status} - ${error}`)
  }

  return response.json()
}

// ==========================================
// ACTION HANDLERS
// ==========================================

async function handleSearchAndIngest(
  db: ReturnType<typeof getDb>,
  apiKey: string,
  params: {
    query: string
    includedType?: string
    province?: string
    maxPages?: number
  }
) {
  const results: Array<{ name: string; success: boolean; id?: string; slug?: string; error?: string }> = []
  let pageToken: string | undefined
  let pageCount = 0
  const maxPages = params.maxPages || 1

  do {
    const searchResponse = await searchPlaces(apiKey, params.query, {
      includedType: params.includedType,
      province: params.province,
      pageToken,
    })

    for (const place of searchResponse.places || []) {
      // Skip closed businesses
      if (place.businessStatus === 'CLOSED_PERMANENTLY') {
        results.push({
          name: place.displayName.text,
          success: false,
          error: 'Permanently closed',
        })
        continue
      }

      // Check for existing place by google_place_id
      const existing = await db`
        SELECT id, slug FROM attractions
        WHERE external_ids->>'google_place_id' = ${place.id}
      `

      if (existing.length > 0) {
        results.push({
          name: place.displayName.text,
          success: false,
          error: 'Already exists',
          id: existing[0].id,
        })
        continue
      }

      // Map and insert
      const placeInput = mapGooglePlaceToPlaceInput(place)
      const slug = generateSlug(placeInput.name, placeInput.placeType)

      // Check for slug collision
      const slugExists = await db`
        SELECT id FROM attractions WHERE slug = ${slug}
      `

      if (slugExists.length > 0) {
        results.push({
          name: placeInput.name,
          success: false,
          error: 'Slug collision',
        })
        continue
      }

      try {
        const insertResult = await db`
          INSERT INTO attractions (
            slug, name, description, about, category, location, province,
            image_url, is_hidden_gem, is_pro_only, place_type, metadata,
            external_ids, data_source, verification_status
          ) VALUES (
            ${slug},
            ${placeInput.name},
            ${placeInput.description},
            ${placeInput.about || null},
            ${placeInput.category},
            ${placeInput.location || null},
            ${placeInput.province || null},
            ${placeInput.imageUrl || null},
            ${placeInput.isHiddenGem || false},
            ${placeInput.isProOnly || false},
            ${placeInput.placeType},
            ${JSON.stringify(placeInput.metadata || {})},
            ${JSON.stringify(placeInput.externalIds || {})},
            ${placeInput.dataSource},
            'pending'
          ) RETURNING id, slug
        `

        results.push({
          name: placeInput.name,
          success: true,
          id: insertResult[0].id,
          slug: insertResult[0].slug,
        })
      } catch (error) {
        results.push({
          name: placeInput.name,
          success: false,
          error: error instanceof Error ? error.message : 'Insert failed',
        })
      }
    }

    pageToken = searchResponse.nextPageToken
    pageCount++

    // Delay between pages for rate limiting
    if (pageToken && pageCount < maxPages) {
      await new Promise(r => setTimeout(r, 200))
    }

  } while (pageToken && pageCount < maxPages)

  return {
    query: params.query,
    province: params.province,
    pagesProcessed: pageCount,
    results,
    summary: {
      total: results.length,
      successful: results.filter(r => r.success).length,
      duplicates: results.filter(r => r.error === 'Already exists').length,
      failed: results.filter(r => !r.success && r.error !== 'Already exists').length,
    },
  }
}

async function handleIngestByProvince(
  db: ReturnType<typeof getDb>,
  apiKey: string,
  params: {
    province: string
    placeTypes?: string[]
    maxPagesPerType?: number
  }
) {
  const province = THAI_PROVINCES[params.province]
  if (!province) {
    throw new Error(`Unknown province: ${params.province}. Valid: ${Object.keys(THAI_PROVINCES).join(', ')}`)
  }

  const placeTypes = params.placeTypes || ['tourist_attraction', 'restaurant']
  const allResults: Record<string, { total: number; successful: number; duplicates: number; failed: number } | { error: string }> = {}

  for (const placeType of placeTypes) {
    // Search with province name
    const query = `${placeType.replace(/_/g, ' ')} in ${province.name} Thailand`

    try {
      const result = await handleSearchAndIngest(db, apiKey, {
        query,
        includedType: placeType,
        province: params.province,
        maxPages: params.maxPagesPerType || 2,
      })

      allResults[placeType] = result.summary
    } catch (error) {
      allResults[placeType] = {
        error: error instanceof Error ? error.message : 'Failed',
      }
    }

    // Rate limit between queries
    await new Promise(r => setTimeout(r, 500))
  }

  return {
    province: province.name,
    results: allResults,
  }
}

async function handleGetPlaceDetails(
  apiKey: string,
  placeId: string
) {
  const details = await getPlaceDetails(apiKey, placeId)
  return {
    place: details,
    mappedInput: mapGooglePlaceToPlaceInput(details),
  }
}

// ==========================================
// MAIN HANDLER
// ==========================================

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  // Admin-only authentication
  const adminKey = req.headers.get('x-admin-key')
  const expectedKey = Netlify.env.get('ADMIN_API_KEY')
  if (expectedKey && adminKey !== expectedKey) {
    return json({ error: 'Unauthorized' }, 401)
  }

  // Get Google Places API key
  const googleApiKey = Netlify.env.get('GOOGLE_PLACES_API_KEY')
  if (!googleApiKey) {
    return json({ error: 'GOOGLE_PLACES_API_KEY not configured' }, 500)
  }

  try {
    const body: RequestBody = await req.json()
    const db = await getDb()

    switch (body.action) {
      case 'search_and_ingest':
        if (!body.query) {
          return json({ error: 'query required for search_and_ingest' }, 400)
        }
        return json(await handleSearchAndIngest(db, googleApiKey, {
          query: body.query,
          includedType: body.includedType,
          province: body.province,
          maxPages: body.maxPages,
        }))

      case 'get_place_details':
        if (!body.placeId) {
          return json({ error: 'placeId required for get_place_details' }, 400)
        }
        return json(await handleGetPlaceDetails(googleApiKey, body.placeId))

      case 'ingest_by_province':
        if (!body.province) {
          return json({ error: 'province required for ingest_by_province' }, 400)
        }
        return json(await handleIngestByProvince(db, googleApiKey, {
          province: body.province,
          placeTypes: body.placeTypes,
          maxPagesPerType: body.maxPages,
        }))

      case 'list_provinces':
        return json({
          provinces: Object.entries(THAI_PROVINCES).map(([key, value]) => ({
            key,
            name: value.name,
            aliases: value.aliases,
          })),
        })

      default:
        return json({
          error: 'Invalid action',
          validActions: ['search_and_ingest', 'get_place_details', 'ingest_by_province', 'list_provinces'],
        }, 400)
    }
  } catch (error) {
    console.error('Google Places function error:', error)
    return json({
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500)
  }
}

export const config: Config = {
  path: '/api/google-places',
}
