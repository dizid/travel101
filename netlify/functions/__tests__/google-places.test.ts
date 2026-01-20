import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  createMockRequest,
  createMockContext,
  parseResponse,
} from './helpers.js'
import {
  setMockQueryResult,
  setMockQueryError,
  resetDbMocks,
  wasQueryMade,
  getMockQueryLog,
} from '../__mocks__/db.js'
import {
  setMockSearchResponse,
  setMockDetailsResponse,
  setMockGoogleApiError,
  clearGooglePlacesMocks,
  createMockPlace,
  createMockPlaces,
  setupGooglePlacesFetchMock,
  getMockFetchCalls,
} from '../__mocks__/google-places-api.js'

// Mock Netlify.env
vi.stubGlobal('Netlify', {
  env: {
    get: (key: string) => {
      if (key === 'ADMIN_API_KEY') return 'test-admin-key'
      if (key === 'GOOGLE_PLACES_API_KEY') return 'test-google-key'
      return undefined
    },
  },
})

// Import handler after mocks
const { default: handler } = await import('../google-places.mts')

describe('google-places function', () => {
  beforeEach(() => {
    resetDbMocks()
    clearGooglePlacesMocks()
    setupGooglePlacesFetchMock()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('authentication', () => {
    it('should return 401 without admin key', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: '/api/google-places',
        body: { action: 'list_provinces' },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(401)

      const data = await parseResponse(response)
      expect(data).toHaveProperty('error', 'Unauthorized')
    })

    it('should return 401 with invalid admin key', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: '/api/google-places',
        headers: { 'x-admin-key': 'wrong-key' },
        body: { action: 'list_provinces' },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(401)
    })

    it('should accept valid admin key', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: '/api/google-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'list_provinces' },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(200)
    })
  })

  describe('request validation', () => {
    it('should return 405 for non-POST requests', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: '/api/google-places',
        headers: { 'x-admin-key': 'test-admin-key' },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(405)
    })

    it('should return 400 for invalid action', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: '/api/google-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'invalid_action' },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(400)

      const data = await parseResponse(response)
      expect(data).toHaveProperty('error', 'Invalid action')
      expect(data).toHaveProperty('validActions')
    })
  })

  describe('action: list_provinces', () => {
    it('should return all Thai provinces with aliases', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: '/api/google-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'list_provinces' },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(200)

      const data = await parseResponse(response)
      expect(data).toHaveProperty('provinces')
      expect(Array.isArray(data.provinces)).toBe(true)
      expect(data.provinces.length).toBeGreaterThan(0)

      // Check structure of province
      const bangkok = data.provinces.find((p: { key: string }) => p.key === 'bangkok')
      expect(bangkok).toBeDefined()
      expect(bangkok).toHaveProperty('name', 'Bangkok')
      expect(bangkok).toHaveProperty('aliases')
      expect(Array.isArray(bangkok.aliases)).toBe(true)
    })
  })

  describe('action: get_place_details', () => {
    it('should return 400 when placeId missing', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: '/api/google-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'get_place_details' },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(400)

      const data = await parseResponse(response)
      expect(data).toHaveProperty('error', 'placeId required for get_place_details')
    })

    it('should return place details and mapped input', async () => {
      const mockPlace = createMockPlace({
        id: 'ChIJ_test_123',
        displayName: { text: 'Wat Arun', languageCode: 'en' },
        formattedAddress: 'Wat Arun, Bangkok 10600, Thailand',
        primaryType: 'buddhist_temple',
        types: ['buddhist_temple', 'tourist_attraction'],
      })
      setMockDetailsResponse(mockPlace)

      const request = createMockRequest({
        method: 'POST',
        url: '/api/google-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'get_place_details', placeId: 'ChIJ_test_123' },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(200)

      const data = await parseResponse(response)
      expect(data).toHaveProperty('place')
      expect(data).toHaveProperty('mappedInput')
      expect(data.place.displayName.text).toBe('Wat Arun')
      expect(data.mappedInput).toHaveProperty('name', 'Wat Arun')
      expect(data.mappedInput).toHaveProperty('category')
    })

    it('should call Google Places API with correct endpoint', async () => {
      setMockDetailsResponse(createMockPlace())

      const request = createMockRequest({
        method: 'POST',
        url: '/api/google-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'get_place_details', placeId: 'ChIJ_test_id' },
      })

      await handler(request, createMockContext())

      const fetchCalls = getMockFetchCalls()
      expect(fetchCalls.some(c => c.url.includes('places.googleapis.com/v1/places/ChIJ_test_id'))).toBe(true)
    })
  })

  describe('action: search_and_ingest', () => {
    it('should return 400 when query missing', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: '/api/google-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'search_and_ingest' },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(400)

      const data = await parseResponse(response)
      expect(data).toHaveProperty('error', 'query required for search_and_ingest')
    })

    it('should search places and insert new ones', async () => {
      const mockPlaces = createMockPlaces(3)
      setMockSearchResponse({ places: mockPlaces })
      // No existing places
      setMockQueryResult('external_ids', [])
      setMockQueryResult('WHERE slug', [])
      // Insert succeeds
      setMockQueryResult('INSERT INTO', [{ id: 'new-uuid', slug: 'test-slug' }])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/google-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'search_and_ingest', query: 'temples in Bangkok' },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(200)

      const data = await parseResponse(response)
      expect(data).toHaveProperty('query', 'temples in Bangkok')
      expect(data).toHaveProperty('results')
      expect(data).toHaveProperty('summary')
    })

    it('should skip permanently closed businesses', async () => {
      const closedPlace = createMockPlace({
        displayName: { text: 'Closed Business', languageCode: 'en' },
        businessStatus: 'CLOSED_PERMANENTLY',
      })
      setMockSearchResponse({ places: [closedPlace] })

      const request = createMockRequest({
        method: 'POST',
        url: '/api/google-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'search_and_ingest', query: 'test' },
      })

      const response = await handler(request, createMockContext())
      const data = await parseResponse(response)

      const closedResult = data.results.find((r: { name: string }) => r.name === 'Closed Business')
      expect(closedResult).toBeDefined()
      expect(closedResult.success).toBe(false)
      expect(closedResult.error).toBe('Permanently closed')
    })

    it('should skip existing places (by google_place_id)', async () => {
      const existingPlace = createMockPlace({
        id: 'ChIJ_existing_id',
        displayName: { text: 'Existing Place', languageCode: 'en' },
      })
      setMockSearchResponse({ places: [existingPlace] })
      setMockQueryResult('external_ids', [{ id: 'existing-uuid', slug: 'existing-slug' }])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/google-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'search_and_ingest', query: 'test' },
      })

      const response = await handler(request, createMockContext())
      const data = await parseResponse(response)

      expect(data.summary.duplicates).toBe(1)
    })

    it('should handle slug collisions', async () => {
      const newPlace = createMockPlace({
        displayName: { text: 'Same Name', languageCode: 'en' },
      })
      setMockSearchResponse({ places: [newPlace] })
      // No external ID match
      setMockQueryResult('external_ids', [])
      // But slug exists
      setMockQueryResult('WHERE slug', [{ id: 'existing-id' }])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/google-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'search_and_ingest', query: 'test' },
      })

      const response = await handler(request, createMockContext())
      const data = await parseResponse(response)

      const result = data.results.find((r: { name: string }) => r.name === 'Same Name')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Slug collision')
    })

    it('should apply location bias for province', async () => {
      setMockSearchResponse({ places: [] })

      const request = createMockRequest({
        method: 'POST',
        url: '/api/google-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'search_and_ingest', query: 'temples', province: 'chiang_mai' },
      })

      await handler(request, createMockContext())

      const fetchCalls = getMockFetchCalls()
      const searchCall = fetchCalls.find(c => c.url.includes('searchText'))
      expect(searchCall).toBeDefined()

      // Check that the request body includes locationBias
      const requestBody = JSON.parse(searchCall!.options.body as string)
      expect(requestBody).toHaveProperty('locationBias')
    })

    it('should respect maxPages limit', async () => {
      // First page with nextPageToken
      setMockSearchResponse({
        places: [createMockPlace()],
        nextPageToken: 'page2token',
      })
      setMockQueryResult('external_ids', [])
      setMockQueryResult('WHERE slug', [])
      setMockQueryResult('INSERT INTO', [{ id: 'new-uuid', slug: 'test-slug' }])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/google-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'search_and_ingest', query: 'test', maxPages: 1 },
      })

      const response = await handler(request, createMockContext())
      const data = await parseResponse(response)

      // Should only process 1 page even though nextPageToken exists
      expect(data.pagesProcessed).toBe(1)
    })

    it('should return summary with counts', async () => {
      const mockPlaces = createMockPlaces(3)
      setMockSearchResponse({ places: mockPlaces })
      setMockQueryResult('external_ids', [])
      setMockQueryResult('WHERE slug', [])
      setMockQueryResult('INSERT INTO', [{ id: 'new-uuid', slug: 'test-slug' }])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/google-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'search_and_ingest', query: 'test' },
      })

      const response = await handler(request, createMockContext())
      const data = await parseResponse(response)

      expect(data.summary).toHaveProperty('total')
      expect(data.summary).toHaveProperty('successful')
      expect(data.summary).toHaveProperty('duplicates')
      expect(data.summary).toHaveProperty('failed')
    })
  })

  describe('action: ingest_by_province', () => {
    it('should return 400 when province missing', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: '/api/google-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'ingest_by_province' },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(400)

      const data = await parseResponse(response)
      expect(data).toHaveProperty('error', 'province required for ingest_by_province')
    })

    it('should return error for unknown province', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: '/api/google-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'ingest_by_province', province: 'unknown_province' },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(500)

      const data = await parseResponse(response)
      expect(data.details).toContain('Unknown province')
    })

    it('should ingest multiple place types', async () => {
      setMockSearchResponse({ places: [createMockPlace()] })
      setMockQueryResult('external_ids', [])
      setMockQueryResult('WHERE slug', [])
      setMockQueryResult('INSERT INTO', [{ id: 'new-uuid', slug: 'test-slug' }])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/google-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: {
          action: 'ingest_by_province',
          province: 'bangkok',
          placeTypes: ['tourist_attraction', 'restaurant'],
        },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(200)

      const data = await parseResponse(response)
      expect(data).toHaveProperty('province', 'Bangkok')
      expect(data).toHaveProperty('results')
      expect(data.results).toHaveProperty('tourist_attraction')
      expect(data.results).toHaveProperty('restaurant')
    })

    it('should aggregate results by place type', async () => {
      setMockSearchResponse({ places: createMockPlaces(5) })
      setMockQueryResult('external_ids', [])
      setMockQueryResult('WHERE slug', [])
      setMockQueryResult('INSERT INTO', [{ id: 'new-uuid', slug: 'test-slug' }])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/google-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: {
          action: 'ingest_by_province',
          province: 'phuket',
          placeTypes: ['tourist_attraction'],
        },
      })

      const response = await handler(request, createMockContext())
      const data = await parseResponse(response)

      expect(data.results.tourist_attraction).toHaveProperty('total')
      expect(data.results.tourist_attraction).toHaveProperty('successful')
    })
  })

  describe('helper functions', () => {
    describe('mapGoogleTypeToPlaceType', () => {
      it('should map tourist_attraction to attraction', async () => {
        const place = createMockPlace({
          primaryType: 'tourist_attraction',
          types: ['tourist_attraction'],
        })
        setMockDetailsResponse(place)

        const request = createMockRequest({
          method: 'POST',
          url: '/api/google-places',
          headers: { 'x-admin-key': 'test-admin-key' },
          body: { action: 'get_place_details', placeId: 'test' },
        })

        const response = await handler(request, createMockContext())
        const data = await parseResponse(response)

        expect(data.mappedInput.placeType).toBe('attraction')
      })

      it('should map restaurant type correctly', async () => {
        const place = createMockPlace({
          primaryType: 'restaurant',
          types: ['restaurant', 'food'],
        })
        setMockDetailsResponse(place)

        const request = createMockRequest({
          method: 'POST',
          url: '/api/google-places',
          headers: { 'x-admin-key': 'test-admin-key' },
          body: { action: 'get_place_details', placeId: 'test' },
        })

        const response = await handler(request, createMockContext())
        const data = await parseResponse(response)

        expect(data.mappedInput.placeType).toBe('restaurant')
      })

      it('should map coworking_space correctly', async () => {
        const place = createMockPlace({
          primaryType: 'coworking_space',
          types: ['coworking_space', 'point_of_interest'],
        })
        setMockDetailsResponse(place)

        const request = createMockRequest({
          method: 'POST',
          url: '/api/google-places',
          headers: { 'x-admin-key': 'test-admin-key' },
          body: { action: 'get_place_details', placeId: 'test' },
        })

        const response = await handler(request, createMockContext())
        const data = await parseResponse(response)

        expect(data.mappedInput.placeType).toBe('coworking')
      })
    })

    describe('mapGoogleTypeToCategory', () => {
      it('should map buddhist_temple to culture', async () => {
        const place = createMockPlace({
          primaryType: 'buddhist_temple',
          types: ['buddhist_temple', 'place_of_worship'],
        })
        setMockDetailsResponse(place)

        const request = createMockRequest({
          method: 'POST',
          url: '/api/google-places',
          headers: { 'x-admin-key': 'test-admin-key' },
          body: { action: 'get_place_details', placeId: 'test' },
        })

        const response = await handler(request, createMockContext())
        const data = await parseResponse(response)

        expect(data.mappedInput.category).toBe('culture')
      })

      it('should map beach to beach category', async () => {
        const place = createMockPlace({
          primaryType: 'beach',
          types: ['beach', 'tourist_attraction'],
        })
        setMockDetailsResponse(place)

        const request = createMockRequest({
          method: 'POST',
          url: '/api/google-places',
          headers: { 'x-admin-key': 'test-admin-key' },
          body: { action: 'get_place_details', placeId: 'test' },
        })

        const response = await handler(request, createMockContext())
        const data = await parseResponse(response)

        expect(data.mappedInput.category).toBe('beach')
      })
    })

    describe('mapPriceLevel', () => {
      it('should map price levels correctly', async () => {
        const place = createMockPlace({
          priceLevel: 'PRICE_LEVEL_MODERATE',
        })
        setMockDetailsResponse(place)

        const request = createMockRequest({
          method: 'POST',
          url: '/api/google-places',
          headers: { 'x-admin-key': 'test-admin-key' },
          body: { action: 'get_place_details', placeId: 'test' },
        })

        const response = await handler(request, createMockContext())
        const data = await parseResponse(response)

        expect(data.mappedInput.metadata.priceRange).toBe('$$')
      })
    })

    describe('extractProvince', () => {
      it('should extract Bangkok from address', async () => {
        const place = createMockPlace({
          formattedAddress: '123 Sukhumvit Road, Bangkok 10110, Thailand',
        })
        setMockDetailsResponse(place)

        const request = createMockRequest({
          method: 'POST',
          url: '/api/google-places',
          headers: { 'x-admin-key': 'test-admin-key' },
          body: { action: 'get_place_details', placeId: 'test' },
        })

        const response = await handler(request, createMockContext())
        const data = await parseResponse(response)

        expect(data.mappedInput.province).toBe('Bangkok')
      })

      it('should extract province from alias (Koh Samui -> Surat Thani)', async () => {
        const place = createMockPlace({
          formattedAddress: 'Chaweng Beach, Koh Samui 84320, Thailand',
        })
        setMockDetailsResponse(place)

        const request = createMockRequest({
          method: 'POST',
          url: '/api/google-places',
          headers: { 'x-admin-key': 'test-admin-key' },
          body: { action: 'get_place_details', placeId: 'test' },
        })

        const response = await handler(request, createMockContext())
        const data = await parseResponse(response)

        expect(data.mappedInput.province).toBe('Surat Thani')
      })
    })

    describe('generateSlug', () => {
      it('should generate valid slug', async () => {
        const place = createMockPlace({
          displayName: { text: 'The Grand Palace & Temple', languageCode: 'en' },
          primaryType: 'tourist_attraction',
        })
        setMockSearchResponse({ places: [place] })
        setMockQueryResult('external_ids', [])
        setMockQueryResult('WHERE slug', [])
        setMockQueryResult('INSERT INTO', [{ id: 'new-uuid', slug: 'the-grand-palace-temple-attraction' }])

        const request = createMockRequest({
          method: 'POST',
          url: '/api/google-places',
          headers: { 'x-admin-key': 'test-admin-key' },
          body: { action: 'search_and_ingest', query: 'test' },
        })

        const response = await handler(request, createMockContext())
        const data = await parseResponse(response)

        // The INSERT should have been called with a hyphenated slug
        expect(wasQueryMade('INSERT INTO')).toBe(true)
        const queryLog = getMockQueryLog()
        const insertQuery = queryLog.find(q => q.query.includes('INSERT INTO'))
        // Check that slug value is lowercased and hyphenated
        expect(insertQuery?.values.some(v =>
          typeof v === 'string' && v.includes('-') && v === v.toLowerCase()
        )).toBe(true)
      })
    })
  })

  describe('error handling', () => {
    it('should return 500 on Google API failure', async () => {
      setMockGoogleApiError(new Error('API quota exceeded'))

      const request = createMockRequest({
        method: 'POST',
        url: '/api/google-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'search_and_ingest', query: 'temples' },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(500)

      const data = await parseResponse(response)
      expect(data).toHaveProperty('error', 'Failed to process request')
    })

    it('should return 500 on database insert error', async () => {
      setMockSearchResponse({ places: [createMockPlace()] })
      setMockQueryResult('external_ids', [])
      setMockQueryResult('WHERE slug', [])
      setMockQueryError(new Error('Database connection failed'))

      const request = createMockRequest({
        method: 'POST',
        url: '/api/google-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'search_and_ingest', query: 'test' },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(500)
    })
  })

  describe('hidden gem detection', () => {
    it('should mark places with low rating count and high rating as hidden gems', async () => {
      const hiddenGem = createMockPlace({
        displayName: { text: 'Secret Waterfall', languageCode: 'en' },
        rating: 4.8,
        userRatingCount: 50, // Low count
      })
      setMockSearchResponse({ places: [hiddenGem] })
      setMockQueryResult('external_ids', [])
      setMockQueryResult('WHERE slug', [])
      setMockQueryResult('INSERT INTO', [{ id: 'new-uuid', slug: 'test-slug' }])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/google-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'search_and_ingest', query: 'waterfall' },
      })

      await handler(request, createMockContext())

      // The INSERT should have isHiddenGem = true
      const queryLog = getMockQueryLog()
      const insertQuery = queryLog.find(q => q.query.includes('INSERT INTO'))
      expect(insertQuery?.values).toContain(true) // is_hidden_gem = true
    })

    it('should not mark popular places as hidden gems', async () => {
      const popularPlace = createMockPlace({
        displayName: { text: 'Grand Palace', languageCode: 'en' },
        rating: 4.7,
        userRatingCount: 50000, // High count
      })
      setMockSearchResponse({ places: [popularPlace] })
      setMockQueryResult('external_ids', [])
      setMockQueryResult('WHERE slug', [])
      setMockQueryResult('INSERT INTO', [{ id: 'new-uuid', slug: 'test-slug' }])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/google-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'search_and_ingest', query: 'palace' },
      })

      await handler(request, createMockContext())

      // Check that is_hidden_gem was set to false
      const queryLog = getMockQueryLog()
      const insertQuery = queryLog.find(q => q.query.includes('INSERT INTO'))
      // The false value for is_hidden_gem should be present
      expect(insertQuery?.values).toContain(false)
    })
  })
})
