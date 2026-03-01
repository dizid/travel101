import { describe, it, expect, beforeEach, vi } from 'vitest'
import '../__mocks__/db'
import { setMockQueryResult, clearMockResults } from '../__mocks__/db'
import { setMockEnv, clearMockEnv } from './setup.js'
import { createMockRequest, createMockContext, parseResponse } from './helpers.js'

import festivalsHandler from '../festivals.mts'

const mockContext = createMockContext()

const mockFestivalRow = {
  id: 'fest-1',
  slug: 'songkran',
  name: 'Songkran',
  name_thai: 'สงกรานต์',
  description: 'Thai New Year water festival',
  month_typical: 4,
  date_type: 'fixed',
  date_fixed: '04-13',
  duration_days: 3,
  date_2025: '2025-04-13',
  date_2026: '2026-04-13',
  provinces: ['Bangkok', 'Chiang Mai'],
  is_nationwide: true,
  best_locations: ['Khao San Road', 'Chiang Mai Old City'],
  region: 'Central',
  image_url: 'https://example.com/songkran.jpg',
  activities: ['Water fights', 'Temple visits'],
  tips: ['Wear waterproof bags'],
  dress_code: 'Casual',
  festival_type: 'cultural',
  religion: 'buddhist',
  is_hidden_gem: false,
  crowd_level: 'extreme',
  foreigner_friendly: 5,
}

describe('festivals function', () => {
  beforeEach(() => {
    clearMockResults()
    clearMockEnv()
    vi.clearAllMocks()
    setMockEnv('DATABASE_URL', 'postgresql://test:test@localhost/test')
  })

  describe('GET /api/festivals', () => {
    it('should return all festivals', async () => {
      setMockQueryResult('SELECT * FROM thai_festivals', [mockFestivalRow])
      setMockQueryResult('SELECT COUNT(*)', [{ total: '1' }])

      const req = createMockRequest('GET', '/api/festivals')
      const response = await festivalsHandler(req, mockContext)
      const body = await parseResponse<{ festivals: any[]; total: number }>(response)

      expect(response.status).toBe(200)
      expect(body.festivals).toHaveLength(1)
      expect(body.festivals[0].name).toBe('Songkran')
      expect(body.festivals[0].slug).toBe('songkran')
      expect(body.total).toBe(1)
    })

    it('should filter by month', async () => {
      setMockQueryResult('month_typical', [mockFestivalRow])
      setMockQueryResult('SELECT COUNT(*)', [{ total: '1' }])

      const req = createMockRequest('GET', '/api/festivals?month=4')
      const response = await festivalsHandler(req, mockContext)

      expect(response.status).toBe(200)
    })

    it('should filter by type', async () => {
      setMockQueryResult('festival_type', [mockFestivalRow])
      setMockQueryResult('SELECT COUNT(*)', [{ total: '1' }])

      const req = createMockRequest('GET', '/api/festivals?type=cultural')
      const response = await festivalsHandler(req, mockContext)

      expect(response.status).toBe(200)
    })

    it('should search festivals by name', async () => {
      setMockQueryResult('LIKE', [mockFestivalRow])
      setMockQueryResult('SELECT COUNT(*)', [{ total: '1' }])

      const req = createMockRequest('GET', '/api/festivals?search=water')
      const response = await festivalsHandler(req, mockContext)

      expect(response.status).toBe(200)
    })

    it('should return empty for no results', async () => {
      setMockQueryResult('SELECT COUNT(*)', [{ total: '0' }])

      const req = createMockRequest('GET', '/api/festivals')
      const response = await festivalsHandler(req, mockContext)
      const body = await parseResponse<{ festivals: any[] }>(response)

      expect(response.status).toBe(200)
      expect(body.festivals).toEqual([])
    })
  })

  describe('GET /api/festivals/:slug', () => {
    it('should return single festival by slug', async () => {
      setMockQueryResult('WHERE slug', [mockFestivalRow])

      const req = createMockRequest('GET', '/api/festivals/songkran')
      const response = await festivalsHandler(req, mockContext)
      const body = await parseResponse<any>(response)

      expect(response.status).toBe(200)
      expect(body.name).toBe('Songkran')
    })

    it('should return 404 for unknown slug', async () => {
      const req = createMockRequest('GET', '/api/festivals/nonexistent')
      const response = await festivalsHandler(req, mockContext)

      expect(response.status).toBe(404)
    })
  })

  describe('GET /api/festivals/types', () => {
    it('should return festival types with counts', async () => {
      setMockQueryResult('festival_type as type', [
        { type: 'cultural', count: 10 },
        { type: 'religious', count: 8 },
      ])

      const req = createMockRequest('GET', '/api/festivals/types')
      const response = await festivalsHandler(req, mockContext)
      const body = await parseResponse<{ types: any[] }>(response)

      expect(response.status).toBe(200)
      expect(body.types).toHaveLength(2)
    })
  })

  describe('GET /api/festivals/regions', () => {
    it('should return regions with counts', async () => {
      setMockQueryResult('region, COUNT', [
        { region: 'Central', count: 15 },
        { region: 'Northern', count: 12 },
      ])

      const req = createMockRequest('GET', '/api/festivals/regions')
      const response = await festivalsHandler(req, mockContext)
      const body = await parseResponse<{ regions: any[] }>(response)

      expect(response.status).toBe(200)
      expect(body.regions).toHaveLength(2)
    })
  })

  describe('method validation', () => {
    it('should return 405 for POST', async () => {
      const req = createMockRequest('POST', '/api/festivals')
      const response = await festivalsHandler(req, mockContext)

      expect(response.status).toBe(405)
    })

    it('should return 204 for OPTIONS (CORS preflight)', async () => {
      const req = createMockRequest('OPTIONS', '/api/festivals')
      const response = await festivalsHandler(req, mockContext)

      expect(response.status).toBe(204)
    })
  })
})
