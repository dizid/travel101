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
  wasQueryMade,
} from '../__mocks__/db.js'
import {
  setMockAIResponse,
  setMockAIJsonResponse,
  setMockAIError,
  resetAnthropicMocks,
} from '../__mocks__/anthropic.js'
import { resetRateLimitsForTests } from '../lib/rate-limit.mts'

// Mock Netlify.env
vi.stubGlobal('Netlify', {
  env: {
    get: (key: string) => {
      if (key === 'ADMIN_API_KEY') return 'test-admin-key'
      if (key === 'ANTHROPIC_API_KEY') return 'test-anthropic-key'
      return undefined
    },
  },
})

// Import handler after mocks
const { default: handler } = await import('../enrich-place.mts')

describe('enrich-place function', () => {
  beforeEach(() => {
    resetDbMocks()
    resetAnthropicMocks()
    resetRateLimitsForTests()
  })

  describe('authentication', () => {
    it('should return 401 without admin key', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: '/api/enrich-place',
        body: { action: 'get_pending' },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(401)

      const data = await parseResponse(response)
      expect(data).toHaveProperty('error', 'Unauthorized')
    })

    it('should return 401 with invalid admin key', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: '/api/enrich-place',
        headers: { 'x-admin-key': 'wrong-key' },
        body: { action: 'get_pending' },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(401)
    })
  })

  describe('request validation', () => {
    it('should return 405 for non-POST requests', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: '/api/enrich-place',
        headers: { 'x-admin-key': 'test-admin-key' },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(405)
    })

    it('should return 400 for invalid action', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: '/api/enrich-place',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'invalid_action' },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(400)

      const data = await parseResponse(response)
      expect(data.error).toContain('Invalid action')
    })
  })

  describe('action: get_pending', () => {
    it('should return pending places ordered by created_at', async () => {
      const pendingPlaces = [
        { id: '1', slug: 'place-1', name: 'Place 1', place_type: 'attraction', verification_status: 'pending', ai_enriched_at: null },
        { id: '2', slug: 'place-2', name: 'Place 2', place_type: 'restaurant', verification_status: 'pending', ai_enriched_at: null },
      ]
      setMockQueryResult('verification_status IN', pendingPlaces)
      setMockQueryResult('GROUP BY verification_status', [
        { verification_status: 'pending', count: '10' },
        { verification_status: 'ai_scored', count: '5' },
      ])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/enrich-place',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'get_pending' },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(200)

      const data = await parseResponse(response)
      expect(data.pending).toHaveLength(2)
    })

    it('should include needs_review places', async () => {
      setMockQueryResult('verification_status IN', [
        { id: '1', verification_status: 'pending' },
        { id: '2', verification_status: 'needs_review' },
      ])
      setMockQueryResult('GROUP BY verification_status', [])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/enrich-place',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'get_pending' },
      })

      const response = await handler(request, createMockContext())
      const data = await parseResponse(response)

      expect(data.pending).toHaveLength(2)
    })

    it('should respect limit parameter', async () => {
      setMockQueryResult('verification_status IN', [])
      setMockQueryResult('GROUP BY verification_status', [])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/enrich-place',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'get_pending', limit: 5 },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(200)

      // Limit is capped at 100
      expect(wasQueryMade('LIMIT')).toBe(true)
    })

    it('should return counts by verification_status', async () => {
      setMockQueryResult('verification_status IN', [])
      setMockQueryResult('GROUP BY verification_status', [
        { verification_status: 'pending', count: '15' },
        { verification_status: 'ai_scored', count: '100' },
        { verification_status: 'needs_review', count: '3' },
        { verification_status: 'human_verified', count: '50' },
      ])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/enrich-place',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'get_pending' },
      })

      const response = await handler(request, createMockContext())
      const data = await parseResponse(response)

      expect(data.counts).toEqual({
        pending: 15,
        ai_scored: 100,
        needs_review: 3,
        human_verified: 50,
      })
    })
  })

  describe('action: enrich_single', () => {
    const mockPlace = {
      id: 'place-uuid-123',
      slug: 'grand-palace',
      name: 'Grand Palace',
      description: 'Historic royal palace complex',
      about: 'Home of the Thai king for centuries',
      category: 'culture',
      location: 'Bangkok',
      province: 'Bangkok',
      place_type: 'attraction',
      metadata: {},
    }

    it('should return 400 when placeId missing', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: '/api/enrich-place',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'enrich_single' },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(400)

      const data = await parseResponse(response)
      expect(data).toHaveProperty('error', 'placeId required for enrich_single')
    })

    it('should return error when place not found', async () => {
      setMockQueryResult('SELECT id, slug', [])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/enrich-place',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'enrich_single', placeId: 'nonexistent-id' },
      })

      const response = await handler(request, createMockContext())
      const data = await parseResponse(response)

      expect(data).toHaveProperty('error', 'Place not found')
    })

    it('should score place with Claude AI', async () => {
      setMockQueryResult('SELECT id, slug', [mockPlace])
      setMockAIJsonResponse({
        categories: { culture: 0.95, history: 0.85, photography: 0.7 },
        primary_category: 'culture',
        confidence: 0.9,
        reasoning: 'Historic royal palace with significant cultural importance',
      })
      setMockQueryResult('UPDATE attractions', [])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/enrich-place',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'enrich_single', placeId: 'place-uuid-123' },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(200)

      const data = await parseResponse(response)
      expect(data.categories).toBeDefined()
      expect(data.confidence).toBe(0.9)
    })

    it('should set status to ai_scored for valid high-confidence scores', async () => {
      setMockQueryResult('SELECT id, slug', [mockPlace])
      setMockAIJsonResponse({
        categories: { culture: 0.95, history: 0.85 },
        primary_category: 'culture',
        confidence: 0.85,
        reasoning: 'Clear cultural attraction',
      })
      setMockQueryResult('UPDATE attractions', [])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/enrich-place',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'enrich_single', placeId: 'place-uuid-123' },
      })

      const response = await handler(request, createMockContext())
      const data = await parseResponse(response)

      expect(data.status).toBe('ai_scored')
    })

    it('should set status to needs_review for low confidence', async () => {
      setMockQueryResult('SELECT id, slug', [mockPlace])
      setMockAIJsonResponse({
        categories: { culture: 0.5, food: 0.4 },
        primary_category: 'culture',
        confidence: 0.5, // Low confidence
        reasoning: 'Unclear categorization',
      })
      setMockQueryResult('UPDATE attractions', [])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/enrich-place',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'enrich_single', placeId: 'place-uuid-123' },
      })

      const response = await handler(request, createMockContext())
      const data = await parseResponse(response)

      expect(data.status).toBe('needs_review')
    })

    it('should update categories and metadata in database', async () => {
      setMockQueryResult('SELECT id, slug', [mockPlace])
      setMockAIJsonResponse({
        categories: { culture: 0.9, history: 0.8 },
        primary_category: 'culture',
        confidence: 0.85,
        reasoning: 'Historic site',
      })
      setMockQueryResult('UPDATE attractions', [])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/enrich-place',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'enrich_single', placeId: 'place-uuid-123' },
      })

      await handler(request, createMockContext())

      expect(wasQueryMade('UPDATE attractions')).toBe(true)
      expect(wasQueryMade('categories')).toBe(true)
    })
  })

  describe('score validation', () => {
    const coworkingPlace = {
      id: 'cowork-id',
      slug: 'hubba-coworking',
      name: 'HUBBA Coworking',
      description: 'Popular coworking space in Bangkok',
      about: null,
      category: 'coworking',
      location: 'Silom, Bangkok',
      province: 'Bangkok',
      place_type: 'coworking',
      metadata: {},
    }

    const restaurantPlace = {
      id: 'restaurant-id',
      slug: 'som-tam-jay-so',
      name: 'Som Tam Jay So',
      description: 'Famous papaya salad restaurant',
      about: null,
      category: 'food',
      location: 'Bangkok',
      province: 'Bangkok',
      place_type: 'restaurant',
      metadata: {},
    }

    it('should require nomad >= 0.6 for coworking spaces', async () => {
      setMockQueryResult('SELECT id, slug', [coworkingPlace])
      setMockAIJsonResponse({
        categories: { nomad: 0.4, fast_wifi: 0.8 }, // nomad too low
        primary_category: 'nomad',
        confidence: 0.8,
        reasoning: 'Coworking with good wifi',
      })
      setMockQueryResult('UPDATE attractions', [])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/enrich-place',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'enrich_single', placeId: 'cowork-id' },
      })

      const response = await handler(request, createMockContext())
      const data = await parseResponse(response)

      // Should have validation errors
      expect(data.validation.valid).toBe(false)
      expect(data.validation.errors).toContain('Co-working space should have nomad score >= 0.6')
      expect(data.status).toBe('needs_review')
    })

    it('should require food >= 0.5 for restaurants', async () => {
      setMockQueryResult('SELECT id, slug', [restaurantPlace])
      setMockAIJsonResponse({
        categories: { food: 0.3, local_cuisine: 0.7 }, // food too low
        primary_category: 'food',
        confidence: 0.8,
        reasoning: 'Local food place',
      })
      setMockQueryResult('UPDATE attractions', [])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/enrich-place',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'enrich_single', placeId: 'restaurant-id' },
      })

      const response = await handler(request, createMockContext())
      const data = await parseResponse(response)

      expect(data.validation.valid).toBe(false)
      expect(data.validation.errors).toContain('Restaurant should have food score >= 0.5')
    })

    it('should reject budget+luxury both > 0.7', async () => {
      setMockQueryResult('SELECT id, slug', [{
        ...coworkingPlace,
        place_type: 'attraction',
      }])
      setMockAIJsonResponse({
        categories: { budget: 0.8, luxury: 0.8 }, // Both high - invalid
        primary_category: 'budget',
        confidence: 0.8,
        reasoning: 'Mixed signals',
      })
      setMockQueryResult('UPDATE attractions', [])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/enrich-place',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'enrich_single', placeId: 'cowork-id' },
      })

      const response = await handler(request, createMockContext())
      const data = await parseResponse(response)

      expect(data.validation.valid).toBe(false)
      expect(data.validation.errors).toContain('Cannot be both strongly budget and luxury')
    })

    it('should reject scores outside 0-1 range', async () => {
      setMockQueryResult('SELECT id, slug', [coworkingPlace])
      setMockAIJsonResponse({
        categories: { culture: 1.5, beach: -0.2 }, // Invalid ranges
        primary_category: 'culture',
        confidence: 0.8,
        reasoning: 'Test',
      })
      setMockQueryResult('UPDATE attractions', [])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/enrich-place',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'enrich_single', placeId: 'cowork-id' },
      })

      const response = await handler(request, createMockContext())
      const data = await parseResponse(response)

      expect(data.validation.valid).toBe(false)
      expect(data.validation.errors.some((e: string) => e.includes('Invalid score'))).toBe(true)
    })
  })

  describe('AI response parsing', () => {
    const mockPlace = {
      id: 'place-id',
      slug: 'test-place',
      name: 'Test Place',
      description: 'Test description',
      about: null,
      category: 'culture',
      location: 'Bangkok',
      province: 'Bangkok',
      place_type: 'attraction',
      metadata: {},
    }

    it('should parse valid JSON response', async () => {
      setMockQueryResult('SELECT id, slug', [mockPlace])
      setMockAIResponse(JSON.stringify({
        categories: { culture: 0.9 },
        primary_category: 'culture',
        confidence: 0.85,
        reasoning: 'Cultural site',
      }))
      setMockQueryResult('UPDATE attractions', [])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/enrich-place',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'enrich_single', placeId: 'place-id' },
      })

      const response = await handler(request, createMockContext())
      const data = await parseResponse(response)

      expect(data.categories).toEqual({ culture: 0.9 })
    })

    it('should strip markdown code blocks', async () => {
      setMockQueryResult('SELECT id, slug', [mockPlace])
      // AI response wrapped in markdown code blocks
      setMockAIJsonResponse({
        categories: { culture: 0.9 },
        primary_category: 'culture',
        confidence: 0.85,
        reasoning: 'Cultural site',
      })
      setMockQueryResult('UPDATE attractions', [])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/enrich-place',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'enrich_single', placeId: 'place-id' },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(200)
    })

    it('should handle malformed AI response', async () => {
      setMockQueryResult('SELECT id, slug', [mockPlace])
      setMockAIResponse('This is not valid JSON at all')

      const request = createMockRequest({
        method: 'POST',
        url: '/api/enrich-place',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'enrich_single', placeId: 'place-id' },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(500)
    })
  })

  describe('action: enrich_batch', () => {
    const mockPlaces = [
      { id: '1', slug: 'place-1', name: 'Place 1', description: 'Desc 1', about: null, category: 'culture', location: 'BKK', province: 'Bangkok', place_type: 'attraction', metadata: {} },
      { id: '2', slug: 'place-2', name: 'Place 2', description: 'Desc 2', about: null, category: 'beach', location: 'Phuket', province: 'Phuket', place_type: 'attraction', metadata: {} },
    ]

    it('should process up to 50 places', async () => {
      setMockQueryResult('verification_status = \'pending\'', mockPlaces)
      setMockAIJsonResponse({
        categories: { culture: 0.9 },
        primary_category: 'culture',
        confidence: 0.85,
        reasoning: 'Test',
      })
      setMockQueryResult('UPDATE attractions', [])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/enrich-place',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'enrich_batch', limit: 100 }, // Requested 100, but capped at 50
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(200)
    })

    it('should continue processing after individual errors', async () => {
      setMockQueryResult('verification_status = \'pending\'', mockPlaces)

      // First call succeeds, second fails
      let callCount = 0
      const originalSetMockAIJsonResponse = setMockAIJsonResponse
      vi.spyOn(await import('../__mocks__/anthropic.js'), 'setMockAIJsonResponse').mockImplementation((data) => {
        callCount++
        if (callCount === 2) {
          setMockAIResponse('invalid json')
        } else {
          originalSetMockAIJsonResponse(data)
        }
      })

      setMockAIJsonResponse({
        categories: { culture: 0.9 },
        primary_category: 'culture',
        confidence: 0.85,
        reasoning: 'Test',
      })
      setMockQueryResult('UPDATE attractions', [])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/enrich-place',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'enrich_batch', limit: 2 },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(200)

      const data = await parseResponse(response)
      expect(data.processed).toBeGreaterThanOrEqual(1)
    })

    it('should return results summary', async () => {
      setMockQueryResult('verification_status = \'pending\'', mockPlaces)
      setMockAIJsonResponse({
        categories: { culture: 0.9 },
        primary_category: 'culture',
        confidence: 0.85,
        reasoning: 'Test',
      })
      setMockQueryResult('UPDATE attractions', [])

      const request = createMockRequest({
        method: 'POST',
        url: '/api/enrich-place',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'enrich_batch', limit: 10 },
      })

      const response = await handler(request, createMockContext())
      const data = await parseResponse(response)

      expect(data).toHaveProperty('processed')
      expect(data).toHaveProperty('results')
      expect(Array.isArray(data.results)).toBe(true)
    })
  })

  describe('error handling', () => {
    it('should return 500 on AI service error', async () => {
      setMockQueryResult('SELECT id, slug', [{
        id: 'place-id',
        slug: 'test-place',
        name: 'Test Place',
        description: 'Test',
        about: null,
        category: 'culture',
        location: 'Bangkok',
        province: 'Bangkok',
        place_type: 'attraction',
        metadata: {},
      }])
      setMockAIError('API rate limit exceeded')

      const request = createMockRequest({
        method: 'POST',
        url: '/api/enrich-place',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'enrich_single', placeId: 'place-id' },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(500)
    })

    it('should return 500 on database error', async () => {
      setMockQueryError(new Error('Database connection failed'))

      const request = createMockRequest({
        method: 'POST',
        url: '/api/enrich-place',
        headers: { 'x-admin-key': 'test-admin-key' },
        body: { action: 'get_pending' },
      })

      const response = await handler(request, createMockContext())
      expect(response.status).toBe(500)
    })
  })
})
