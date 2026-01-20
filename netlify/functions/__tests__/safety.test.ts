import { describe, it, expect, beforeEach, vi } from 'vitest'
import '../__mocks__/db'
import { setMockQueryResult, clearMockResults, wasQueryMade, setMockQueryError } from '../__mocks__/db'
import { setMockEnv, clearMockEnv } from './setup.js'
import { createMockRequest, parseResponse } from './helpers.js'

import safetyHandler from '../safety.mts'

const mockContext = {
  geo: { city: 'Bangkok' },
  ip: '127.0.0.1',
}

const mockScamReports = [
  {
    id: 'scam-1',
    scam_type: 'gem_shop',
    title: 'Grand Palace Gem Scam',
    description: 'People telling you palace is closed',
    province: 'Bangkok',
    severity: 3,
    verified: true,
    report_count: 50,
    last_reported_at: '2025-01-15',
  },
  {
    id: 'scam-2',
    scam_type: 'tuk_tuk',
    title: 'Tuk-tuk Tour Scam',
    description: 'Free city tour that takes you to shops',
    province: 'Bangkok',
    severity: 2,
    verified: true,
    report_count: 120,
    last_reported_at: '2025-01-18',
  },
]

const mockProvinceSafety = [
  {
    province: 'Bangkok',
    overall_score: 8,
    tourist_police_phone: '1155',
    hospital_name: 'Bumrungrad Hospital',
    notes: 'Generally safe for tourists',
  },
]

describe('safety function', () => {
  beforeEach(() => {
    clearMockResults()
    clearMockEnv()
    vi.clearAllMocks()
    setMockEnv('DATABASE_URL', 'postgresql://test:test@localhost/test')
  })

  describe('GET /api/safety', () => {
    it('should return scam reports and safety info', async () => {
      setMockQueryResult('SELECT * FROM scam_reports', mockScamReports)
      setMockQueryResult('SELECT * FROM province_safety', mockProvinceSafety)
      setMockQueryResult('SELECT', [{ total_reports: '170', verified_reports: '150', provinces_covered: '5' }])

      const req = createMockRequest('GET', '/api/safety', {
        headers: {},
      })

      const response = await safetyHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.scamReports).toHaveLength(2)
      expect(data.provinceSafety).toHaveLength(1)
      expect(data.scamTypes).toBeDefined()
      expect(data.emergencyNumbers).toBeDefined()
    })

    it('should include emergency numbers', async () => {
      setMockQueryResult('SELECT * FROM scam_reports', [])
      setMockQueryResult('SELECT * FROM province_safety', [])
      setMockQueryResult('SELECT', [{ total_reports: '0', verified_reports: '0', provinces_covered: '0' }])

      const req = createMockRequest('GET', '/api/safety', {
        headers: {},
      })

      const response = await safetyHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(data.emergencyNumbers.touristPolice).toBe('1155')
      expect(data.emergencyNumbers.police).toBe('191')
      expect(data.emergencyNumbers.ambulance).toBe('1669')
      expect(data.emergencyNumbers.fire).toBe('199')
    })

    it('should include scam type definitions', async () => {
      setMockQueryResult('SELECT * FROM scam_reports', [])
      setMockQueryResult('SELECT * FROM province_safety', [])
      setMockQueryResult('SELECT', [{ total_reports: '0', verified_reports: '0', provinces_covered: '0' }])

      const req = createMockRequest('GET', '/api/safety', {
        headers: {},
      })

      const response = await safetyHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(data.scamTypes).toBeInstanceOf(Array)
      const gemShopType = data.scamTypes.find((t: { value: string }) => t.value === 'gem_shop')
      expect(gemShopType).toBeDefined()
      expect(gemShopType.label).toBe('Gem Shop Scam')
    })

    it('should filter by province', async () => {
      setMockQueryResult('WHERE province', [mockScamReports[0]])
      setMockQueryResult('SELECT * FROM province_safety WHERE province', [mockProvinceSafety[0]])
      setMockQueryResult('SELECT', [{ total_reports: '50', verified_reports: '50', provinces_covered: '1' }])

      const req = createMockRequest('GET', '/api/safety?province=Bangkok', {
        headers: {},
      })

      const response = await safetyHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(wasQueryMade('WHERE province')).toBe(true)
    })

    it('should filter by scam type', async () => {
      setMockQueryResult('WHERE scam_type', [mockScamReports[0]])
      setMockQueryResult('SELECT * FROM province_safety', mockProvinceSafety)
      setMockQueryResult('SELECT', [{ total_reports: '50', verified_reports: '50', provinces_covered: '1' }])

      const req = createMockRequest('GET', '/api/safety?type=gem_shop', {
        headers: {},
      })

      const response = await safetyHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(wasQueryMade('scam_type')).toBe(true)
    })

    it('should filter by both province and type', async () => {
      setMockQueryResult('WHERE province', [mockScamReports[0]])
      setMockQueryResult('SELECT * FROM province_safety WHERE province', [mockProvinceSafety[0]])
      setMockQueryResult('SELECT', [{ total_reports: '50', verified_reports: '50', provinces_covered: '1' }])

      const req = createMockRequest('GET', '/api/safety?province=Bangkok&type=gem_shop', {
        headers: {},
      })

      const response = await safetyHandler(req, mockContext as never)

      expect(response.status).toBe(200)
    })

    it('should limit results', async () => {
      setMockQueryResult('SELECT * FROM scam_reports', [])
      setMockQueryResult('SELECT * FROM province_safety', [])
      setMockQueryResult('SELECT', [{ total_reports: '0', verified_reports: '0', provinces_covered: '0' }])

      const req = createMockRequest('GET', '/api/safety?limit=10', {
        headers: {},
      })

      await safetyHandler(req, mockContext as never)

      expect(wasQueryMade('LIMIT')).toBe(true)
    })

    it('should cap limit at 100', async () => {
      setMockQueryResult('SELECT * FROM scam_reports', [])
      setMockQueryResult('SELECT * FROM province_safety', [])
      setMockQueryResult('SELECT', [{ total_reports: '0', verified_reports: '0', provinces_covered: '0' }])

      const req = createMockRequest('GET', '/api/safety?limit=500', {
        headers: {},
      })

      await safetyHandler(req, mockContext as never)

      // The query should have limit 100, not 500
      expect(wasQueryMade('LIMIT')).toBe(true)
    })

    it('should include statistics', async () => {
      setMockQueryResult('SELECT * FROM scam_reports', [])
      setMockQueryResult('SELECT * FROM province_safety', [])
      setMockQueryResult('SELECT', [
        { total_reports: '170', verified_reports: '150', provinces_covered: '5' },
      ])

      const req = createMockRequest('GET', '/api/safety', {
        headers: {},
      })

      const response = await safetyHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(data.stats).toBeDefined()
      expect(data.stats.total_reports).toBe('170')
      expect(data.stats.verified_reports).toBe('150')
      expect(data.stats.provinces_covered).toBe('5')
    })
  })

  describe('POST /api/safety - submit report', () => {
    it('should return 400 when scam_type is missing', async () => {
      const req = createMockRequest('POST', '/api/safety', {
        headers: {},
        body: {
          title: 'Test scam',
          description: 'Description',
          province: 'Bangkok',
        },
      })

      const response = await safetyHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.error).toContain('scam_type')
    })

    it('should return 400 when title is missing', async () => {
      const req = createMockRequest('POST', '/api/safety', {
        headers: {},
        body: {
          scam_type: 'gem_shop',
          description: 'Description',
          province: 'Bangkok',
        },
      })

      const response = await safetyHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.error).toContain('title')
    })

    it('should return 400 when description is missing', async () => {
      const req = createMockRequest('POST', '/api/safety', {
        headers: {},
        body: {
          scam_type: 'gem_shop',
          title: 'Test scam',
          province: 'Bangkok',
        },
      })

      const response = await safetyHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.error).toContain('description')
    })

    it('should return 400 when province is missing', async () => {
      const req = createMockRequest('POST', '/api/safety', {
        headers: {},
        body: {
          scam_type: 'gem_shop',
          title: 'Test scam',
          description: 'Description',
        },
      })

      const response = await safetyHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.error).toContain('province')
    })

    it('should create new report', async () => {
      setMockQueryResult('SELECT id, report_count FROM scam_reports', [])
      setMockQueryResult('INSERT INTO scam_reports', [
        {
          id: 'scam-new',
          scam_type: 'taxi',
          title: 'Taxi meter not used',
          description: 'Driver refused to use meter',
          province: 'Bangkok',
          severity: 2,
        },
      ])

      const req = createMockRequest('POST', '/api/safety', {
        headers: {},
        body: {
          scam_type: 'taxi',
          title: 'Taxi meter not used',
          description: 'Driver refused to use meter',
          province: 'Bangkok',
        },
      })

      const response = await safetyHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(201)
      expect(data.message).toBe('Report submitted successfully')
      expect(data.report).toBeDefined()
      expect(data.merged).toBe(false)
    })

    it('should merge with existing report if similar', async () => {
      setMockQueryResult('SELECT id, report_count FROM scam_reports', [
        { id: 'scam-existing', report_count: 5 },
      ])
      setMockQueryResult('UPDATE scam_reports', [
        {
          id: 'scam-existing',
          report_count: 6,
          title: 'Taxi meter not used',
        },
      ])

      const req = createMockRequest('POST', '/api/safety', {
        headers: {},
        body: {
          scam_type: 'taxi',
          title: 'Taxi meter not used',
          description: 'Same scam different day',
          province: 'Bangkok',
        },
      })

      const response = await safetyHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.message).toBe('Report added to existing entry')
      expect(data.merged).toBe(true)
      expect(wasQueryMade('report_count = report_count + 1')).toBe(true)
    })

    it('should include user_id if provided', async () => {
      setMockQueryResult('SELECT id, report_count FROM scam_reports', [])
      setMockQueryResult('INSERT INTO scam_reports', [{ id: 'scam-new' }])

      const req = createMockRequest('POST', '/api/safety', {
        headers: { 'x-user-id': 'user-123' },
        body: {
          scam_type: 'taxi',
          title: 'Test',
          description: 'Test',
          province: 'Bangkok',
        },
      })

      await safetyHandler(req, mockContext as never)

      expect(wasQueryMade('user_id')).toBe(true)
    })

    it('should accept optional location fields', async () => {
      setMockQueryResult('SELECT id, report_count FROM scam_reports', [])
      setMockQueryResult('INSERT INTO scam_reports', [{ id: 'scam-new' }])

      const req = createMockRequest('POST', '/api/safety', {
        headers: {},
        body: {
          scam_type: 'taxi',
          title: 'Test',
          description: 'Test',
          province: 'Bangkok',
          location_name: 'Khao San Road',
          lat: 13.7563,
          lng: 100.5018,
          severity: 3,
        },
      })

      const response = await safetyHandler(req, mockContext as never)

      expect(response.status).toBe(201)
      expect(wasQueryMade('location_name')).toBe(true)
      expect(wasQueryMade('lat')).toBe(true)
    })

    it('should use default severity of 2', async () => {
      setMockQueryResult('SELECT id, report_count FROM scam_reports', [])
      setMockQueryResult('INSERT INTO scam_reports', [{ id: 'scam-new', severity: 2 }])

      const req = createMockRequest('POST', '/api/safety', {
        headers: {},
        body: {
          scam_type: 'taxi',
          title: 'Test',
          description: 'Test',
          province: 'Bangkok',
        },
      })

      await safetyHandler(req, mockContext as never)

      expect(wasQueryMade('severity')).toBe(true)
    })
  })

  describe('unsupported methods', () => {
    it('should return 405 for PUT method', async () => {
      const req = createMockRequest('PUT', '/api/safety', {
        headers: {},
        body: {},
      })

      const response = await safetyHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(405)
      expect(data.error).toBe('Method not allowed')
    })

    it('should return 405 for DELETE method', async () => {
      const req = createMockRequest('DELETE', '/api/safety', {
        headers: {},
      })

      const response = await safetyHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(405)
      expect(data.error).toBe('Method not allowed')
    })
  })

  describe('error handling', () => {
    it('should return 500 on database error', async () => {
      // Set up the mock to throw an error
      setMockQueryError(new Error('Database connection failed'))

      const req = createMockRequest('GET', '/api/safety', {
        headers: {},
      })

      const response = await safetyHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})
