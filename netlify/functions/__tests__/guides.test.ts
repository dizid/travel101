import { describe, it, expect, beforeEach, vi } from 'vitest'
import '../__mocks__/db'
import { setMockQueryResult, clearMockResults } from '../__mocks__/db'
import { setMockEnv, clearMockEnv } from './setup.js'
import { createMockRequest, createMockContext, parseResponse } from './helpers.js'

import guidesHandler from '../guides.mts'

const mockContext = createMockContext()

const mockGuideRow = {
  id: 'guide-1',
  slug: 'bangkok-street-food',
  title: 'Bangkok Street Food Guide',
  subtitle: 'Eat like a local',
  content: '# Bangkok Street Food\n\nGreat food everywhere...',
  excerpt: 'Discover the best street food spots in Bangkok.',
  category: 'food',
  province: 'Bangkok',
  image_url: 'https://example.com/food.jpg',
  image_alt: 'Thai street food',
  author: 'HappyRoam',
  reading_time_min: 8,
  tags: ['food', 'bangkok', 'budget'],
  is_published: true,
  published_at: '2026-01-15',
  updated_at: '2026-02-01',
  view_count: 1500,
}

describe('guides function', () => {
  beforeEach(() => {
    clearMockResults()
    clearMockEnv()
    vi.clearAllMocks()
    setMockEnv('DATABASE_URL', 'postgresql://test:test@localhost/test')
  })

  describe('GET /api/guides', () => {
    it('should return published guides list', async () => {
      setMockQueryResult('SELECT * FROM travel_guides', [mockGuideRow])
      setMockQueryResult('SELECT COUNT(*)', [{ total: '1' }])

      const req = createMockRequest('GET', '/api/guides')
      const response = await guidesHandler(req, mockContext)
      const body = await parseResponse<{ guides: any[]; total: number }>(response)

      expect(response.status).toBe(200)
      expect(body.guides).toHaveLength(1)
      expect(body.guides[0].title).toBe('Bangkok Street Food Guide')
      // Listing should not include full content
      expect(body.guides[0].content).toBeUndefined()
    })

    it('should filter by category', async () => {
      setMockQueryResult('category', [mockGuideRow])
      setMockQueryResult('SELECT COUNT(*)', [{ total: '1' }])

      const req = createMockRequest('GET', '/api/guides?category=food')
      const response = await guidesHandler(req, mockContext)

      expect(response.status).toBe(200)
    })

    it('should search guides', async () => {
      setMockQueryResult('LIKE', [mockGuideRow])
      setMockQueryResult('SELECT COUNT(*)', [{ total: '1' }])

      const req = createMockRequest('GET', '/api/guides?search=street')
      const response = await guidesHandler(req, mockContext)

      expect(response.status).toBe(200)
    })

    it('should paginate results', async () => {
      setMockQueryResult('SELECT * FROM travel_guides', [mockGuideRow])
      setMockQueryResult('SELECT COUNT(*)', [{ total: '10' }])

      const req = createMockRequest('GET', '/api/guides?limit=1&offset=0')
      const response = await guidesHandler(req, mockContext)
      const body = await parseResponse<{ hasMore: boolean; total: number }>(response)

      expect(body.hasMore).toBe(true)
      expect(body.total).toBe(10)
    })
  })

  describe('GET /api/guides/:slug', () => {
    it('should return single guide with content', async () => {
      setMockQueryResult('WHERE slug', [mockGuideRow])

      const req = createMockRequest('GET', '/api/guides/bangkok-street-food')
      const response = await guidesHandler(req, mockContext)
      const body = await parseResponse<any>(response)

      expect(response.status).toBe(200)
      expect(body.title).toBe('Bangkok Street Food Guide')
      expect(body.content).toContain('Bangkok Street Food')
    })

    it('should return 404 for unknown slug', async () => {
      const req = createMockRequest('GET', '/api/guides/nonexistent')
      const response = await guidesHandler(req, mockContext)

      expect(response.status).toBe(404)
    })
  })

  describe('GET /api/guides/categories', () => {
    it('should return categories with counts', async () => {
      setMockQueryResult('category, COUNT', [
        { category: 'food', count: 5 },
        { category: 'destination', count: 3 },
      ])

      const req = createMockRequest('GET', '/api/guides/categories')
      const response = await guidesHandler(req, mockContext)
      const body = await parseResponse<{ categories: any[] }>(response)

      expect(response.status).toBe(200)
      expect(body.categories).toHaveLength(2)
    })
  })

  describe('method validation', () => {
    it('should return 405 for POST', async () => {
      const req = createMockRequest('POST', '/api/guides')
      const response = await guidesHandler(req, mockContext)

      expect(response.status).toBe(405)
    })

    it('should return 204 for OPTIONS', async () => {
      const req = createMockRequest('OPTIONS', '/api/guides')
      const response = await guidesHandler(req, mockContext)

      expect(response.status).toBe(204)
    })
  })

  describe('error handling', () => {
    it('should return 500 on database error', async () => {
      // getDb will return mockSql which will throw on unmatched queries
      // Force an error by making getDb throw
      const { setMockQueryError } = await import('../__mocks__/db')
      setMockQueryError(new Error('Database connection failed'))

      const req = createMockRequest('GET', '/api/guides')
      const response = await guidesHandler(req, mockContext)

      expect(response.status).toBe(500)

      setMockQueryError(null) // Cleanup
    })
  })
})
