import { describe, it, expect, beforeEach, vi } from 'vitest'
import '../__mocks__/db'
import { setMockQueryResult, clearMockResults } from '../__mocks__/db'
import { setMockEnv, clearMockEnv } from './setup.js'
import { createMockRequest, createMockContext, parseResponse } from './helpers.js'

import heritageHandler from '../heritage.mts'

const mockContext = createMockContext()

const mockHeritageSite = {
  id: 'her-1',
  slug: 'ayutthaya-historical-park',
  name: 'Ayutthaya Historical Park',
  description: 'Ruins of the ancient capital',
  about: 'Detailed history of Ayutthaya',
  category: 'heritage',
  location: 'Ayutthaya',
  province: 'Ayutthaya',
  image_url: 'https://example.com/ayutthaya.jpg',
  is_hidden_gem: false,
  is_pro_only: false,
  categories: { history: 0.95, culture: 0.9 },
  place_type: 'heritage',
  metadata: {
    constructionEra: 'Ayutthaya Period',
    unescoStatus: 'world_heritage_site',
    unescoInscriptionYear: 1991,
    heritageType: 'ruins',
  },
  created_at: '2026-01-01',
  updated_at: '2026-01-15',
}

describe('heritage function', () => {
  beforeEach(() => {
    clearMockResults()
    clearMockEnv()
    vi.clearAllMocks()
    setMockEnv('DATABASE_URL', 'postgresql://test:test@localhost/test')
  })

  describe('GET /api/heritage', () => {
    it('should return heritage sites list', async () => {
      setMockQueryResult("place_type = 'heritage'", [mockHeritageSite])
      setMockQueryResult('heritage_images', [])
      setMockQueryResult('heritage_events', [])
      setMockQueryResult('SELECT COUNT(*)', [{ total: '1' }])

      const req = createMockRequest('GET', '/api/heritage')
      const response = await heritageHandler(req, mockContext)
      const body = await parseResponse<{ sites: any[]; total: number }>(response)

      expect(response.status).toBe(200)
      expect(body.sites).toHaveLength(1)
      expect(body.sites[0].name).toBe('Ayutthaya Historical Park')
    })

    it('should filter by UNESCO status', async () => {
      setMockQueryResult('unescoStatus', [mockHeritageSite])
      setMockQueryResult('heritage_images', [])
      setMockQueryResult('heritage_events', [])
      setMockQueryResult('SELECT COUNT(*)', [{ total: '1' }])

      const req = createMockRequest('GET', '/api/heritage?unesco=true')
      const response = await heritageHandler(req, mockContext)

      expect(response.status).toBe(200)
    })

    it('should filter by era', async () => {
      setMockQueryResult('constructionEra', [mockHeritageSite])
      setMockQueryResult('heritage_images', [])
      setMockQueryResult('heritage_events', [])
      setMockQueryResult('SELECT COUNT(*)', [{ total: '1' }])

      const req = createMockRequest('GET', '/api/heritage?era=Ayutthaya%20Period')
      const response = await heritageHandler(req, mockContext)

      expect(response.status).toBe(200)
    })
  })

  describe('GET /api/heritage/:slug', () => {
    it('should return single heritage site with images and timeline', async () => {
      setMockQueryResult('WHERE slug', [mockHeritageSite])
      setMockQueryResult('heritage_images', [])
      setMockQueryResult('heritage_events', [])
      setMockQueryResult('attraction_tips', [])
      setMockQueryResult('attraction_secrets', [])
      setMockQueryResult('attraction_recommendations', [])

      const req = createMockRequest('GET', '/api/heritage/ayutthaya-historical-park')
      const response = await heritageHandler(req, mockContext)
      const body = await parseResponse<{ site: any }>(response)

      expect(response.status).toBe(200)
      expect(body.site.name).toBe('Ayutthaya Historical Park')
      expect(body.site.heritageMetadata).toBeDefined()
    })

    it('should return 404 for unknown slug', async () => {
      // No results for heritage query, and no results for general attraction query
      setMockQueryResult('SELECT id FROM attractions', [])

      const req = createMockRequest('GET', '/api/heritage/nonexistent')
      const response = await heritageHandler(req, mockContext)

      expect(response.status).toBe(404)
    })
  })

  describe('GET /api/heritage/eras', () => {
    it('should return available eras', async () => {
      setMockQueryResult('constructionEra', [
        { era: 'Sukhothai Period' },
        { era: 'Ayutthaya Period' },
      ])

      const req = createMockRequest('GET', '/api/heritage/eras')
      const response = await heritageHandler(req, mockContext)
      const body = await parseResponse<{ eras: string[] }>(response)

      expect(response.status).toBe(200)
      expect(body.eras).toContain('Sukhothai Period')
    })
  })

  describe('GET /api/heritage/regions', () => {
    it('should return regions with counts', async () => {
      setMockQueryResult('province, COUNT', [
        { province: 'Ayutthaya', count: 5 },
        { province: 'Bangkok', count: 8 },
      ])

      const req = createMockRequest('GET', '/api/heritage/regions')
      const response = await heritageHandler(req, mockContext)
      const body = await parseResponse<{ regions: any[] }>(response)

      expect(response.status).toBe(200)
      expect(body.regions).toHaveLength(2)
    })
  })

  describe('method validation', () => {
    it('should return 405 for POST', async () => {
      const req = createMockRequest('POST', '/api/heritage')
      const response = await heritageHandler(req, mockContext)

      expect(response.status).toBe(405)
    })
  })
})
