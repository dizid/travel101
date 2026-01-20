import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createMockRequest,
  createMockContext,
  parseResponse,
} from './helpers.js'
import {
  setMockQueryResult,
  setMockQueryError,
  resetDbMocks,
  getMockQueryLog,
  wasQueryMade,
} from '../__mocks__/db.js'

// Mock Netlify.env
vi.stubGlobal('Netlify', {
  env: {
    get: (key: string) => {
      if (key === 'ADMIN_API_KEY') return 'test-admin-key'
      return undefined
    },
  },
})

// Import handler after mocks
const { default: handler } = await import('../ingest-places.mts')

describe('ingest-places function', () => {
  beforeEach(() => {
    resetDbMocks()
  })

  describe('authentication', () => {
    it('should return 401 without admin key', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: '/api/ingest-places',
        body: { action: 'list_by_source', source: 'manual' },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(401)

      const data = await parseResponse(response)
      expect(data).toHaveProperty('error', 'Unauthorized')
    })

    it('should return 401 with invalid admin key', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: '/api/ingest-places',
        headers: { 'x-admin-key': 'wrong-key' },
        body: { action: 'list_by_source', source: 'manual' },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(401)
    })

    it('should accept valid admin key', async () => {
      setMockQueryResult('SELECT', [])
      setMockQueryResult('GROUP BY', [])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/ingest-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'list_by_source', source: 'manual' },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(200)
    })
  })

  describe('request validation', () => {
    it('should return 405 for non-POST requests', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: '/api/ingest-places',
        headers: { 'x-admin-key': 'test-admin-key' },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(405)
    })

    it('should return 400 for invalid action', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: '/api/ingest-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'invalid_action' },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(400)

      const data = await parseResponse(response)
      expect(data).toHaveProperty('error')
    })
  })

  describe('action: ingest_single', () => {
    const validPlace = {
      name: 'Test Temple',
      description: 'A beautiful temple in Bangkok',
      category: 'culture',
      placeType: 'attraction',
      dataSource: 'manual',
    }

    it('should return 400 when place is missing', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: '/api/ingest-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'ingest_single' },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(400)

      const data = await parseResponse(response)
      expect(data).toHaveProperty('error', 'place required for ingest_single')
    })

    it('should generate slug from name if not provided', async () => {
      // No existing place with generated slug
      setMockQueryResult('SELECT id, slug FROM attractions WHERE slug', [])
      // Insert result
      setMockQueryResult('INSERT INTO', [
        { id: 'new-uuid-123', slug: 'test-temple-attraction' },
      ])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/ingest-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'ingest_single', place: validPlace },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(200)

      const data = await parseResponse(response)
      expect(data.slug).toBe('test-temple-attraction')
    })

    it('should return error for existing slug', async () => {
      // Existing place with same slug
      setMockQueryResult('SELECT id, slug FROM attractions WHERE slug', [
        { id: 'existing-id', slug: 'test-temple-attraction' },
      ])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/ingest-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'ingest_single', place: validPlace },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(200)

      const data = await parseResponse(response)
      expect(data.success).toBe(false)
      expect(data.error).toContain('already exists')
      expect(data.existingId).toBe('existing-id')
    })

    it('should check duplicate by external_id', async () => {
      // No slug collision
      setMockQueryResult('SELECT id, slug FROM attractions WHERE slug', [])
      // Existing place with same google_place_id
      setMockQueryResult('external_ids', [
        { id: 'existing-google-id', slug: 'existing-place' },
      ])

      const placeWithExternalId = {
        ...validPlace,
        externalIds: { google_place_id: 'ChIJ_existing' },
      }

      const request = createMockRequest({
        method: 'POST',
        url: '/api/ingest-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'ingest_single', place: placeWithExternalId },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(200)

      const data = await parseResponse(response)
      expect(data.success).toBe(false)
      expect(data.error).toContain('google_place_id')
    })

    it('should insert new place with pending status', async () => {
      setMockQueryResult('SELECT id, slug FROM attractions WHERE slug', [])
      setMockQueryResult('INSERT INTO', [
        { id: 'new-uuid', slug: 'test-temple-attraction' },
      ])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/ingest-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'ingest_single', place: validPlace },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(200)

      // Verify the INSERT query included 'pending' status
      expect(wasQueryMade('pending')).toBe(true)
    })

    it('should return needsEnrichment flag', async () => {
      setMockQueryResult('SELECT id, slug FROM attractions WHERE slug', [])
      setMockQueryResult('INSERT INTO', [
        { id: 'new-uuid', slug: 'test-temple-attraction' },
      ])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/ingest-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'ingest_single', place: validPlace },
      })

      const response = await handler(request, createMockContext())
      const data = await parseResponse(response)

      expect(data.success).toBe(true)
      expect(data.needsEnrichment).toBe(true)
    })

    it('should handle all place types', async () => {
      const placeTypes = ['attraction', 'course', 'tour', 'activity', 'coworking', 'restaurant', 'event']

      for (const placeType of placeTypes) {
        resetDbMocks()
        setMockQueryResult('SELECT id, slug FROM attractions WHERE slug', [])
        setMockQueryResult('INSERT INTO', [
          { id: `uuid-${placeType}`, slug: `test-place-${placeType}` },
        ])

        const place = { ...validPlace, name: 'Test Place', placeType }

        const request = createMockRequest({
          method: 'POST',
          url: '/api/ingest-places',
          headers: { 'x-admin-key': 'test-admin-key' },
          body: { action: 'ingest_single', place },
        })

        const response = await handler(request, createMockContext())
        expect(response.status).toBe(200)

        const data = await parseResponse(response)
        expect(data.success).toBe(true)
      }
    })

    it('should use provided slug instead of generating one', async () => {
      setMockQueryResult('SELECT id, slug FROM attractions WHERE slug', [])
      setMockQueryResult('INSERT INTO', [
        { id: 'new-uuid', slug: 'custom-slug' },
      ])

      const placeWithSlug = {
        ...validPlace,
        slug: 'custom-slug',
      }

      const request = createMockRequest({
        method: 'POST',
        url: '/api/ingest-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'ingest_single', place: placeWithSlug },
      })

      const response = await handler(request, createMockContext())
      const data = await parseResponse(response)

      expect(data.slug).toBe('custom-slug')
    })
  })

  describe('action: ingest_batch', () => {
    it('should return 400 when places array is empty', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: '/api/ingest-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'ingest_batch', places: [] },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(400)

      const data = await parseResponse(response)
      expect(data).toHaveProperty('error', 'places array required for ingest_batch')
    })

    it('should return 400 when places array is missing', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: '/api/ingest-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'ingest_batch' },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(400)
    })

    it('should process all places in batch', async () => {
      const places = [
        { name: 'Place 1', description: 'Desc 1', category: 'culture', placeType: 'attraction', dataSource: 'manual' },
        { name: 'Place 2', description: 'Desc 2', category: 'beach', placeType: 'attraction', dataSource: 'manual' },
        { name: 'Place 3', description: 'Desc 3', category: 'food', placeType: 'restaurant', dataSource: 'manual' },
      ]

      // Setup mocks for each place
      setMockQueryResult('SELECT id, slug FROM attractions WHERE slug', [])
      setMockQueryResult('INSERT INTO', [{ id: 'new-id', slug: 'generated-slug' }])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/ingest-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'ingest_batch', places },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(200)

      const data = await parseResponse(response)
      expect(data.total).toBe(3)
      expect(data.results).toHaveLength(3)
    })

    it('should continue after individual errors', async () => {
      const places = [
        { name: 'Good Place', description: 'Works', category: 'culture', placeType: 'attraction', dataSource: 'manual' },
        { name: 'Duplicate Place', description: 'Fails', category: 'culture', placeType: 'attraction', dataSource: 'manual', slug: 'existing-slug' },
      ]

      // First place succeeds
      setMockQueryResult('WHERE slug = $', [])
      setMockQueryResult('INSERT INTO', [{ id: 'new-id', slug: 'good-place-attraction' }])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/ingest-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'ingest_batch', places },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(200)

      const data = await parseResponse(response)
      // Should have processed both even if one failed
      expect(data.results).toHaveLength(2)
    })

    it('should return summary with success/fail counts', async () => {
      setMockQueryResult('SELECT id, slug FROM attractions WHERE slug', [])
      setMockQueryResult('INSERT INTO', [{ id: 'new-id', slug: 'test-slug' }])

      const places = [
        { name: 'Place 1', description: 'Desc', category: 'culture', placeType: 'attraction', dataSource: 'manual' },
        { name: 'Place 2', description: 'Desc', category: 'beach', placeType: 'attraction', dataSource: 'manual' },
      ]

      const request = createMockRequest({
        method: 'POST',
        url: '/api/ingest-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'ingest_batch', places },
      })

      const response = await handler(request, createMockContext())
      const data = await parseResponse(response)

      expect(data).toHaveProperty('total')
      expect(data).toHaveProperty('successful')
      expect(data).toHaveProperty('failed')
      expect(data).toHaveProperty('results')
    })
  })

  describe('action: list_by_source', () => {
    it('should return 400 when source is missing', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: '/api/ingest-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'list_by_source' },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(400)

      const data = await parseResponse(response)
      expect(data).toHaveProperty('error', 'source required for list_by_source')
    })

    it('should filter places by data_source', async () => {
      setMockQueryResult('SELECT id, slug', [
        { id: '1', slug: 'place-1', name: 'Place 1', place_type: 'attraction', verification_status: 'pending', created_at: new Date() },
      ])
      setMockQueryResult('GROUP BY place_type', [
        { place_type: 'attraction', count: '5' },
        { place_type: 'restaurant', count: '3' },
      ])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/ingest-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'list_by_source', source: 'google_places' },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(200)

      // Verify query was made with source filter
      expect(wasQueryMade('google_places')).toBe(true)
    })

    it('should respect limit (max 100)', async () => {
      setMockQueryResult('SELECT id, slug', [])
      setMockQueryResult('GROUP BY place_type', [])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/ingest-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'list_by_source', source: 'manual', limit: 200 },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(200)

      // The limit should be capped at 100
      const queryLog = getMockQueryLog()
      const selectQuery = queryLog.find(q => q.query.includes('LIMIT'))
      expect(selectQuery?.values).toContain(100)
    })

    it('should return counts by place_type', async () => {
      setMockQueryResult('SELECT id, slug', [])
      setMockQueryResult('GROUP BY place_type', [
        { place_type: 'attraction', count: '10' },
        { place_type: 'restaurant', count: '5' },
        { place_type: 'coworking', count: '2' },
      ])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/ingest-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'list_by_source', source: 'manual' },
      })

      const response = await handler(request, createMockContext())
      const data = await parseResponse(response)

      expect(data).toHaveProperty('countsByType')
      expect(data.countsByType).toEqual({
        attraction: 10,
        restaurant: 5,
        coworking: 2,
      })
    })

    it('should return source in response', async () => {
      setMockQueryResult('SELECT id, slug', [])
      setMockQueryResult('GROUP BY place_type', [])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/ingest-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'list_by_source', source: 'viator' },
      })

      const response = await handler(request, createMockContext())
      const data = await parseResponse(response)

      expect(data.source).toBe('viator')
    })
  })

  describe('slug generation', () => {
    it('should lowercase and hyphenate', async () => {
      setMockQueryResult('SELECT id, slug FROM attractions WHERE slug', [])
      setMockQueryResult('INSERT INTO', [
        { id: 'new-id', slug: 'the-grand-palace-attraction' },
      ])

      const place = {
        name: 'The Grand Palace',
        description: 'A palace',
        category: 'culture',
        placeType: 'attraction',
        dataSource: 'manual',
      }

      const request = createMockRequest({
        method: 'POST',
        url: '/api/ingest-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'ingest_single', place },
      })

      const response = await handler(request, createMockContext())
      const data = await parseResponse(response)

      expect(data.slug).toBe('the-grand-palace-attraction')
    })

    it('should remove special characters', async () => {
      setMockQueryResult('SELECT id, slug FROM attractions WHERE slug', [])
      setMockQueryResult('INSERT INTO', [
        { id: 'new-id', slug: 'temple-caf-bar-attraction' },
      ])

      const place = {
        name: 'Temple Café & Bar!',
        description: 'A cafe',
        category: 'food',
        placeType: 'attraction',
        dataSource: 'manual',
      }

      const request = createMockRequest({
        method: 'POST',
        url: '/api/ingest-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'ingest_single', place },
      })

      await handler(request, createMockContext())
      // The slug should have special chars removed
      const queryLog = getMockQueryLog()
      expect(queryLog.some(q => q.values.includes('temple-caf-bar-attraction'))).toBe(true)
    })

    it('should append place_type suffix', async () => {
      setMockQueryResult('SELECT id, slug FROM attractions WHERE slug', [])
      setMockQueryResult('INSERT INTO', [
        { id: 'new-id', slug: 'thai-cooking-course' },
      ])

      const place = {
        name: 'Thai Cooking',
        description: 'A cooking course',
        category: 'food',
        placeType: 'course',
        dataSource: 'manual',
      }

      const request = createMockRequest({
        method: 'POST',
        url: '/api/ingest-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'ingest_single', place },
      })

      const response = await handler(request, createMockContext())
      const data = await parseResponse(response)

      expect(data.slug).toBe('thai-cooking-course')
    })
  })

  describe('error handling', () => {
    it('should return 500 on database error', async () => {
      setMockQueryError(new Error('Connection refused'))

      const request = createMockRequest({
        method: 'POST',
        url: '/api/ingest-places',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'list_by_source', source: 'manual' },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(500)

      const data = await parseResponse(response)
      expect(data).toHaveProperty('error', 'Failed to process ingestion request')
    })
  })
})
