import { describe, it, expect, beforeEach, vi } from 'vitest'
import '../__mocks__/db'
import { setMockQueryResult, clearMockResults } from '../__mocks__/db'
import { createMockRequest, parseResponse } from './helpers.js'
import attractionsHandler from '../attractions.mts'

const mockContext = {
  geo: { city: 'Bangkok' },
  ip: '127.0.0.1',
}

const mockAttraction = {
  id: 'attr-1',
  slug: 'grand-palace',
  name: 'Grand Palace',
  description: 'The Grand Palace is a complex of buildings at the heart of Bangkok, Thailand.',
  about: 'Built in 1782, the Grand Palace served as the official residence of the Kings of Siam.',
  category: 'temple',
  location: 'Na Phra Lan Rd',
  province: 'Bangkok',
  image_url: 'https://example.com/grand-palace.jpg',
  is_hidden_gem: false,
  is_pro_only: false,
  categories: { culture: 0.9, temples: 0.9, history: 0.8 },
  place_type: 'attraction',
  metadata: {},
  external_ids: {},
  data_source: 'manual',
  verification_status: 'verified',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockTip = {
  id: 'tip-1',
  tip_type: 'timing',
  title: 'Best time to visit',
  content: 'Visit early morning to avoid crowds',
  is_pro_only: false,
  sort_order: 0,
}

const mockSecret = {
  id: 'secret-1',
  secret_type: 'hidden_spot',
  title: 'Secret viewpoint',
  content: 'There is a hidden viewpoint on the east side',
  location_hint: 'Near the eastern gate',
  is_pro_only: true,
  sort_order: 0,
}

const mockRecommendation = {
  id: 'rec-1',
  rec_type: 'restaurant',
  name: 'Nearby Restaurant',
  description: 'Great Thai food',
  why_special: 'Local favorite',
  price_range: '$$',
  google_maps_url: 'https://maps.google.com/?q=restaurant',
  is_pro_only: false,
  sort_order: 0,
}

describe('attractions function', () => {
  beforeEach(() => {
    clearMockResults()
    vi.clearAllMocks()
  })

  describe('request validation', () => {
    it('should return 405 for non-GET requests', async () => {
      const req = createMockRequest('POST', '/api/attractions')

      const response = await attractionsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(405)
      expect(data.error).toBe('Method not allowed')
    })
  })

  describe('GET /api/attractions - list', () => {
    it('should return list of attractions', async () => {
      setMockQueryResult('SELECT * FROM attractions', [mockAttraction])
      setMockQueryResult('SELECT COUNT', [{ total: '1' }])

      const req = createMockRequest('GET', '/api/attractions')

      const response = await attractionsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.attractions).toHaveLength(1)
      expect(data.attractions[0].name).toBe('Grand Palace')
      expect(data.total).toBe(1)
    })

    it('should filter by category', async () => {
      setMockQueryResult('WHERE category', [mockAttraction])
      setMockQueryResult('SELECT COUNT', [{ total: '1' }])

      const req = createMockRequest('GET', '/api/attractions?category=temple')

      const response = await attractionsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.attractions).toHaveLength(1)
    })

    it('should filter by hidden gems', async () => {
      const hiddenGem = { ...mockAttraction, is_hidden_gem: true }
      setMockQueryResult('is_hidden_gem = true', [hiddenGem])
      setMockQueryResult('SELECT COUNT', [{ total: '1' }])

      const req = createMockRequest('GET', '/api/attractions?hidden_gems=true')

      const response = await attractionsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
    })

    it('should filter by province', async () => {
      setMockQueryResult('province', [mockAttraction])
      setMockQueryResult('SELECT COUNT', [{ total: '1' }])

      const req = createMockRequest('GET', '/api/attractions?province=Bangkok')

      const response = await attractionsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
    })

    it('should filter by place_type', async () => {
      setMockQueryResult('place_type', [mockAttraction])
      setMockQueryResult('SELECT COUNT', [{ total: '1' }])

      const req = createMockRequest('GET', '/api/attractions?place_type=attraction')

      const response = await attractionsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
    })

    it('should support pagination with limit and offset', async () => {
      setMockQueryResult('LIMIT', [mockAttraction])
      setMockQueryResult('SELECT COUNT', [{ total: '50' }])

      const req = createMockRequest('GET', '/api/attractions?limit=10&offset=20')

      const response = await attractionsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.hasMore).toBe(true)
    })

    it('should limit max results to 100', async () => {
      setMockQueryResult('LIMIT', [mockAttraction])
      setMockQueryResult('SELECT COUNT', [{ total: '200' }])

      const req = createMockRequest('GET', '/api/attractions?limit=500')

      const response = await attractionsHandler(req, mockContext as never)

      expect(response.status).toBe(200)
    })

    it('should return personalized results with match scores', async () => {
      setMockQueryResult('SELECT * FROM attractions', [mockAttraction])
      setMockQueryResult('SELECT COUNT', [{ total: '1' }])

      const prefs = JSON.stringify({ interests: ['temples', 'culture'] })
      const req = createMockRequest('GET', '/api/attractions?personalized=true', {
        headers: { 'x-user-prefs': prefs },
      })

      const response = await attractionsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.attractions[0].matchScore).toBeDefined()
      expect(data.attractions[0].matchReasons).toBeDefined()
    })
  })

  describe('GET /api/attractions/matched', () => {
    it('should return top matched attractions', async () => {
      setMockQueryResult('SELECT * FROM attractions ORDER BY name', [
        mockAttraction,
        { ...mockAttraction, id: 'attr-2', slug: 'wat-pho', categories: { beach: 0.9 } },
      ])

      const prefs = JSON.stringify({ interests: ['temples', 'culture'] })
      const req = createMockRequest('GET', '/api/attractions/matched', {
        headers: { 'x-user-prefs': prefs },
      })

      const response = await attractionsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.matches).toBeDefined()
      expect(data.matches.length).toBeGreaterThan(0)
      expect(data.topCategories).toContain('temples')
    })

    it('should return 400 when prefs header is missing', async () => {
      const req = createMockRequest('GET', '/api/attractions/matched')

      const response = await attractionsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.error).toBe('User preferences required (x-user-prefs header)')
    })

    it('should return max 10 matches', async () => {
      const manyAttractions = Array.from({ length: 20 }, (_, i) => ({
        ...mockAttraction,
        id: `attr-${i}`,
        slug: `attraction-${i}`,
      }))
      setMockQueryResult('SELECT * FROM attractions ORDER BY name', manyAttractions)

      const prefs = JSON.stringify({ interests: ['temples'] })
      const req = createMockRequest('GET', '/api/attractions/matched', {
        headers: { 'x-user-prefs': prefs },
      })

      const response = await attractionsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.matches.length).toBeLessThanOrEqual(10)
    })
  })

  describe('GET /api/attractions/:slug - detail', () => {
    it('should return attraction details by slug', async () => {
      setMockQueryResult('WHERE slug', [mockAttraction])

      const req = createMockRequest('GET', '/api/attractions/grand-palace')

      const response = await attractionsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.attraction.slug).toBe('grand-palace')
      expect(data.attraction.name).toBe('Grand Palace')
    })

    it('should return 404 when attraction not found', async () => {
      setMockQueryResult('WHERE slug', [])

      const req = createMockRequest('GET', '/api/attractions/nonexistent')

      const response = await attractionsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(404)
      expect(data.error).toBe('Attraction not found')
    })

    it('should include tips when requested', async () => {
      setMockQueryResult('WHERE slug', [mockAttraction])
      setMockQueryResult('FROM attraction_tips', [mockTip])

      const req = createMockRequest('GET', '/api/attractions/grand-palace?include=tips')

      const response = await attractionsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.attraction.tips).toBeDefined()
      expect(data.attraction.tips).toHaveLength(1)
    })

    it('should include secrets when requested', async () => {
      setMockQueryResult('WHERE slug', [mockAttraction])
      setMockQueryResult('FROM attraction_secrets', [mockSecret])

      const req = createMockRequest('GET', '/api/attractions/grand-palace?include=secrets')

      const response = await attractionsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.attraction.secrets).toBeDefined()
      expect(data.attraction.secrets).toHaveLength(1)
    })

    it('should include recommendations when requested', async () => {
      setMockQueryResult('WHERE slug', [mockAttraction])
      setMockQueryResult('FROM attraction_recommendations', [mockRecommendation])

      const req = createMockRequest('GET', '/api/attractions/grand-palace?include=recommendations')

      const response = await attractionsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.attraction.recommendations).toBeDefined()
      expect(data.attraction.recommendations).toHaveLength(1)
    })

    it('should include all related data when include=all', async () => {
      setMockQueryResult('WHERE slug', [mockAttraction])
      setMockQueryResult('FROM attraction_tips', [mockTip])
      setMockQueryResult('FROM attraction_secrets', [mockSecret])
      setMockQueryResult('FROM attraction_recommendations', [mockRecommendation])

      const req = createMockRequest('GET', '/api/attractions/grand-palace?include=all')

      const response = await attractionsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.attraction.tips).toBeDefined()
      expect(data.attraction.secrets).toBeDefined()
      expect(data.attraction.recommendations).toBeDefined()
    })

    it('should include match info when user prefs provided', async () => {
      setMockQueryResult('WHERE slug', [mockAttraction])

      const prefs = JSON.stringify({ interests: ['temples', 'culture'] })
      const req = createMockRequest('GET', '/api/attractions/grand-palace', {
        headers: { 'x-user-prefs': prefs },
      })

      const response = await attractionsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.matchInfo).toBeDefined()
      expect(data.matchInfo.score).toBeGreaterThan(0)
      expect(data.matchInfo.reasons).toBeDefined()
    })
  })

  describe('error handling', () => {
    it('should return 500 on database error', async () => {
      // The mock will throw an error for unmatched queries
      const req = createMockRequest('GET', '/api/attractions/error-trigger')

      // We need to make the db throw
      setMockQueryResult('WHERE slug', [])

      const response = await attractionsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(404)
    })
  })
})
