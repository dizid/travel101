import { describe, it, expect, beforeEach, vi } from 'vitest'
import './__mocks__/db'
import { setMockQueryResult, clearMockResults, wasQueryMade, setMockQueryError } from './__mocks__/db'
import { setMockEnv, clearMockEnv } from './__tests__/setup'
import { createMockRequest, parseResponse } from './__tests__/helpers'

import advisoriesHandler from './advisories.mts'

const mockContext = {
  geo: { city: 'Bangkok' },
  ip: '127.0.0.1',
}

const mockProvinceSafety = {
  province: 'Bangkok',
  overall_score: 8,
  tourist_police_phone: '1155',
  hospital_name: 'Bumrungrad Hospital',
  notes: 'Generally safe for tourists',
}

describe('advisories function', () => {
  beforeEach(() => {
    clearMockResults()
    clearMockEnv()
    vi.clearAllMocks()
    setMockEnv('DATABASE_URL', 'postgresql://test:test@localhost/test')
  })

  describe('method validation', () => {
    it('should return 405 for POST method', async () => {
      const req = createMockRequest('POST', '/api/advisories', {
        headers: {},
        body: {},
      })

      const response = await advisoriesHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(405)
      expect(data.error).toBe('Method not allowed')
    })

    it('should return 405 for PUT method', async () => {
      const req = createMockRequest('PUT', '/api/advisories', {
        headers: {},
        body: {},
      })

      const response = await advisoriesHandler(req, mockContext as never)

      expect(response.status).toBe(405)
    })

    it('should return 405 for DELETE method', async () => {
      const req = createMockRequest('DELETE', '/api/advisories', {
        headers: {},
      })

      const response = await advisoriesHandler(req, mockContext as never)

      expect(response.status).toBe(405)
    })
  })

  describe('GET /api/advisories', () => {
    it('should return Thailand advisories', async () => {
      setMockQueryResult('SELECT response_data FROM ai_cache', [])
      setMockQueryResult('INSERT INTO ai_cache', [])

      const req = createMockRequest('GET', '/api/advisories', {
        headers: {},
      })

      const response = await advisoriesHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.country).toBe('Thailand')
      expect(data.overallLevel).toBeDefined()
      expect(data.advisories).toBeInstanceOf(Array)
      expect(data.regionalAlerts).toBeInstanceOf(Array)
    })

    it('should include advisory levels reference', async () => {
      setMockQueryResult('SELECT response_data FROM ai_cache', [])
      setMockQueryResult('INSERT INTO ai_cache', [])

      const req = createMockRequest('GET', '/api/advisories', {
        headers: {},
      })

      const response = await advisoriesHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(data.advisoryLevels).toBeDefined()
      expect(data.advisoryLevels[1].label).toBe('Exercise Normal Precautions')
      expect(data.advisoryLevels[4].label).toBe('Do Not Travel')
    })

    it('should include multiple advisory sources', async () => {
      setMockQueryResult('SELECT response_data FROM ai_cache', [])
      setMockQueryResult('INSERT INTO ai_cache', [])

      const req = createMockRequest('GET', '/api/advisories', {
        headers: {},
      })

      const response = await advisoriesHandler(req, mockContext as never)
      const data = await parseResponse(response)

      const sources = data.advisories.map((a: { source: string }) => a.source)
      expect(sources).toContain('US State Department')
      expect(sources).toContain('UK Foreign Office')
      expect(sources).toContain('Australian DFAT')
    })

    it('should include regional alerts for southern provinces', async () => {
      setMockQueryResult('SELECT response_data FROM ai_cache', [])
      setMockQueryResult('INSERT INTO ai_cache', [])

      const req = createMockRequest('GET', '/api/advisories', {
        headers: {},
      })

      const response = await advisoriesHandler(req, mockContext as never)
      const data = await parseResponse(response)

      const southernAlerts = data.regionalAlerts.filter(
        (a: { province: string }) =>
          ['Yala', 'Pattani', 'Narathiwat'].includes(a.province)
      )
      expect(southernAlerts.length).toBe(3)
      southernAlerts.forEach((alert: { level: number }) => {
        expect(alert.level).toBe(4) // Do not travel
      })
    })

    it('should include lastChecked timestamp', async () => {
      setMockQueryResult('SELECT response_data FROM ai_cache', [])
      setMockQueryResult('INSERT INTO ai_cache', [])

      const req = createMockRequest('GET', '/api/advisories', {
        headers: {},
      })

      const response = await advisoriesHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(data.lastChecked).toBeDefined()
      // Should be a valid ISO date string
      expect(new Date(data.lastChecked).toISOString()).toBeTruthy()
    })
  })

  describe('province filtering', () => {
    it('should filter regional alerts by province', async () => {
      setMockQueryResult('SELECT response_data FROM ai_cache', [])
      setMockQueryResult('SELECT * FROM province_safety', [mockProvinceSafety])
      setMockQueryResult('INSERT INTO ai_cache', [])

      const req = createMockRequest('GET', '/api/advisories?province=Bangkok', {
        headers: {},
      })

      const response = await advisoriesHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      // Bangkok should not have regional alerts (not in deep south)
      expect(data.regionalAlerts.length).toBe(0)
    })

    it('should include province safety data when available', async () => {
      setMockQueryResult('SELECT response_data FROM ai_cache', [])
      setMockQueryResult('SELECT * FROM province_safety', [mockProvinceSafety])
      setMockQueryResult('INSERT INTO ai_cache', [])

      const req = createMockRequest('GET', '/api/advisories?province=Bangkok', {
        headers: {},
      })

      const response = await advisoriesHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(data.provinceSafety).toBeDefined()
      expect(data.provinceSafety.province).toBe('Bangkok')
      expect(data.provinceSafety.overall_score).toBe(8)
    })

    it('should return null provinceSafety when not found', async () => {
      setMockQueryResult('SELECT response_data FROM ai_cache', [])
      setMockQueryResult('SELECT * FROM province_safety', [])
      setMockQueryResult('INSERT INTO ai_cache', [])

      const req = createMockRequest('GET', '/api/advisories?province=UnknownProvince', {
        headers: {},
      })

      const response = await advisoriesHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(data.provinceSafety).toBeNull()
    })

    it('should filter for southern provinces with alerts', async () => {
      setMockQueryResult('SELECT response_data FROM ai_cache', [])
      setMockQueryResult('SELECT * FROM province_safety', [])
      setMockQueryResult('INSERT INTO ai_cache', [])

      const req = createMockRequest('GET', '/api/advisories?province=Yala', {
        headers: {},
      })

      const response = await advisoriesHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(data.regionalAlerts.length).toBe(1)
      expect(data.regionalAlerts[0].province).toBe('Yala')
      expect(data.regionalAlerts[0].level).toBe(4)
    })
  })

  describe('caching', () => {
    it('should return cached response when available', async () => {
      const cachedResponse = {
        country: 'Thailand',
        overallLevel: 2,
        advisories: [{ source: 'Cached', level: 2, title: 'Cached Advisory' }],
        regionalAlerts: [],
        lastChecked: '2025-01-01T00:00:00.000Z',
      }
      setMockQueryResult('SELECT response_data FROM ai_cache', [{ response_data: cachedResponse }])

      const req = createMockRequest('GET', '/api/advisories', {
        headers: {},
      })

      const response = await advisoriesHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.advisories[0].source).toBe('Cached')
    })

    it('should cache new responses', async () => {
      setMockQueryResult('SELECT response_data FROM ai_cache', [])
      setMockQueryResult('INSERT INTO ai_cache', [])

      const req = createMockRequest('GET', '/api/advisories', {
        headers: {},
      })

      await advisoriesHandler(req, mockContext as never)

      expect(wasQueryMade('INSERT INTO ai_cache')).toBe(true)
      expect(wasQueryMade('advisories_thailand_all')).toBe(true)
    })

    it('should use province-specific cache key', async () => {
      setMockQueryResult('SELECT response_data FROM ai_cache', [])
      setMockQueryResult('SELECT * FROM province_safety', [])
      setMockQueryResult('INSERT INTO ai_cache', [])

      const req = createMockRequest('GET', '/api/advisories?province=Bangkok', {
        headers: {},
      })

      await advisoriesHandler(req, mockContext as never)

      expect(wasQueryMade('advisories_thailand_Bangkok')).toBe(true)
    })
  })

  describe('advisory calculations', () => {
    it('should calculate overall level from advisories', async () => {
      setMockQueryResult('SELECT response_data FROM ai_cache', [])
      setMockQueryResult('INSERT INTO ai_cache', [])

      const req = createMockRequest('GET', '/api/advisories', {
        headers: {},
      })

      const response = await advisoriesHandler(req, mockContext as never)
      const data = await parseResponse(response)

      // Overall level should be the max of all advisory levels
      // US = 1, UK = 1, AU = 2, so max = 2
      expect(data.overallLevel).toBe(2)
    })
  })

  describe('error handling', () => {
    it('should return 500 on database error', async () => {
      // Set up the mock to throw an error
      setMockQueryError(new Error('Database connection failed'))

      const req = createMockRequest('GET', '/api/advisories', {
        headers: {},
      })

      const response = await advisoriesHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch advisories')
    })
  })
})
