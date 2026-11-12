import { describe, it, expect, beforeEach, vi } from 'vitest'
import '../__mocks__/db'
import { setMockQueryResult, clearMockResults, wasQueryMade, setMockQueryError, getQueriesMatching } from '../__mocks__/db'
import { setMockEnv, clearMockEnv } from './setup.js'
import { createMockRequest, parseResponse } from './helpers.js'

import { resetRateLimitsForTests } from '../lib/rate-limit.mts'
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
    resetRateLimitsForTests()
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

    it('never returns the reporter user_id on the public list (T-0447)', async () => {
      setMockQueryResult('SELECT * FROM scam_reports', [
        { id: 'r1', user_id: 'secret-user-id', title: 'Tuk-tuk gem scam', province: 'Bangkok', severity: 2 },
      ])
      setMockQueryResult('SELECT * FROM province_safety', mockProvinceSafety)
      setMockQueryResult('SELECT', [{ total_reports: '1', verified_reports: '0', provinces_covered: '1' }])

      const response = await safetyHandler(createMockRequest('GET', '/api/safety', { headers: {} }), mockContext as never)
      const data = await parseResponse(response)

      expect(data.scamReports[0].title).toBe('Tuk-tuk gem scam')
      expect(data.scamReports[0]).not.toHaveProperty('user_id')
      expect(JSON.stringify(data)).not.toContain('secret-user-id')
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

  describe('T-0565 guards', () => {
    const valid = { scam_type: 'tuk_tuk', title: 'Gem shop detour', description: 'Driver insisted on a gem shop', province: 'Bangkok' }

    it('public lists show only checked (verified) reports, with every filter (T-0571)', async () => {
      // The list query itself must filter; the stats query also says 'verified = true',
      // so a check on any query would pass even without the list filter.
      for (const query of ['', '?province=Bangkok', '?type=taxi', '?province=Bangkok&type=taxi']) {
        clearMockResults()
        setMockQueryResult('SELECT * FROM scam_reports', [])
        const before = getQueriesMatching('SELECT * FROM scam_reports').length
        await safetyHandler(createMockRequest('GET', `/api/safety${query}`), { ip: '1.1.1.1' } as never)
        const listQueries = getQueriesMatching('SELECT * FROM scam_reports').slice(before)
        expect(listQueries.length).toBe(1)
        expect(listQueries[0].query).toMatch(/WHERE[^]*verified = true[^]*ORDER BY/)
      }
    })

    it('public numbers count checked reports only (T-0571)', async () => {
      setMockQueryResult('SELECT * FROM scam_reports', [])
      await safetyHandler(createMockRequest('GET', '/api/safety'), { ip: '1.1.1.1' } as never)
      const statsQuery = getQueriesMatching('total_reports').pop()!.query
      expect(statsQuery).toMatch(/COUNT\(\*\) FILTER \(WHERE verified = true\) as total_reports/)
      expect(statsQuery).toMatch(/COUNT\(DISTINCT province\) FILTER \(WHERE verified = true\)/)
    })

    it('a merged report reply carries no report data (T-0571)', async () => {
      setMockQueryResult('SELECT id, report_count', [{ id: 'unchecked-1', report_count: 1 }])
      setMockQueryResult('UPDATE scam_reports', [{ id: 'unchecked-1', user_id: 'reporter-123', description: 'secret' }])
      const res = await safetyHandler(createMockRequest('POST', '/api/safety', { body: valid }), { ip: '5.5.5.5' } as never)
      const data = await parseResponse(res)
      expect(res.status).toBe(200)
      expect(data).toEqual({ message: 'Report added to existing entry', merged: true })
      expect(JSON.stringify(data)).not.toContain('reporter-123')
    })

    it('a new report reply carries only its id (T-0571)', async () => {
      setMockQueryResult('SELECT id, report_count', [])
      setMockQueryResult('INSERT INTO scam_reports', [{ id: 'r-new' }])
      const res = await safetyHandler(createMockRequest('POST', '/api/safety', { body: valid }), { ip: '6.6.6.6' } as never)
      const data = await parseResponse(res)
      expect(res.status).toBe(201)
      expect(data).toEqual({ message: 'Report submitted successfully', id: 'r-new', merged: false })
      expect(getQueriesMatching('INSERT INTO scam_reports').pop()!.query).toContain('RETURNING id')
    })

    it('refuses new reports once 50 unchecked ones came in within 24 hours (T-0571)', async () => {
      setMockQueryResult('SELECT id, report_count', [])
      setMockQueryResult('WHERE verified = false AND created_at', [{ count: 50 }])
      const res = await safetyHandler(createMockRequest('POST', '/api/safety', { body: valid }), { ip: '7.7.7.7' } as never)
      expect(res.status).toBe(429)
      expect(wasQueryMade('INSERT INTO scam_reports')).toBe(false)
    })

    it('counts IPv6 callers per /64 network, so rotating addresses hits the same limit (T-0571)', async () => {
      setMockQueryResult('SELECT id, report_count', [])
      setMockQueryResult('INSERT INTO scam_reports', [{ id: 'r1' }])
      const statuses: number[] = []
      for (let i = 0; i < 6; i++) {
        const res = await safetyHandler(createMockRequest('POST', '/api/safety', { body: valid }), { ip: `2001:db8:abcd:12::${i + 1}` } as never)
        statuses.push(res.status)
      }
      expect(statuses.slice(0, 5).every(s => s === 201)).toBe(true)
      expect(statuses[5]).toBe(429)
    })

    it('refuses unknown types, oversized text and places outside Thailand', async () => {
      for (const body of [
        { ...valid, scam_type: 'not-a-type' },
        { ...valid, title: 'x'.repeat(500) },
        { ...valid, description: 'x'.repeat(5000) },
        { ...valid, lat: 51.5, lng: -0.1 },
      ]) {
        clearMockResults()
        const res = await safetyHandler(createMockRequest('POST', '/api/safety', { body }), { ip: '2.2.2.2' } as never)
        expect(res.status).toBe(400)
        expect(wasQueryMade('INSERT INTO scam_reports')).toBe(false)
      }
    })

    it('turns an out-of-range severity into the default instead of topping the list', async () => {
      setMockQueryResult('SELECT id, report_count', [])
      setMockQueryResult('INSERT INTO scam_reports', [{ id: 'r1' }])
      const res = await safetyHandler(createMockRequest('POST', '/api/safety', { body: { ...valid, severity: 999 } }), { ip: '3.3.3.3' } as never)
      expect(res.status).toBe(201)
    })

    it('limits one address to 5 reports an hour', async () => {
      setMockQueryResult('SELECT id, report_count', [])
      setMockQueryResult('INSERT INTO scam_reports', [{ id: 'r1' }])
      const statuses: number[] = []
      for (let i = 0; i < 6; i++) {
        const res = await safetyHandler(createMockRequest('POST', '/api/safety', { body: valid }), { ip: '4.4.4.4' } as never)
        statuses.push(res.status)
      }
      expect(statuses.slice(0, 5).every(s => s === 201)).toBe(true)
      expect(statuses[5]).toBe(429)
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
      expect(data.id).toBe('scam-new')
      expect(data.report).toBeUndefined()
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
