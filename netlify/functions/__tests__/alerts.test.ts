import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import '../__mocks__/db'
import { setMockQueryResult, clearMockResults, wasQueryMade, getQueriesMatching, getMockQueryLog } from '../__mocks__/db'
import { setMockEnv, clearMockEnv } from './setup.js'
import { createMockRequest, parseResponse } from './helpers.js'

import alertsHandler from '../alerts.mts'

const mockContext = {
  geo: { city: 'Bangkok' },
  ip: '127.0.0.1',
}

describe('alerts function', () => {
  beforeEach(() => {
    clearMockResults()
    clearMockEnv()
    vi.clearAllMocks()
    setMockEnv('DATABASE_URL', 'postgresql://test:test@localhost/test')
  })

  describe('authentication', () => {
    it('should return 401 without x-user-id', async () => {
      const req = createMockRequest('GET', '/api/alerts', {
        headers: {},
      })

      const response = await alertsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(401)
      expect(data.error).toBe('No authentication provided')
    })

    it('should return 403 for non-Pro users', async () => {
      setMockQueryResult('SELECT is_pro', [{ is_pro: false }])

      const req = createMockRequest('GET', '/api/alerts', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await alertsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(403)
      expect(data.error).toBe('Pro subscription required')
    })

    it('should return 403 when user not found', async () => {
      setMockQueryResult('SELECT is_pro', [])

      const req = createMockRequest('GET', '/api/alerts', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await alertsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(403)
      expect(data.error).toBe('Pro subscription required')
    })
  })

  describe('GET /api/alerts', () => {
    beforeEach(() => {
      setMockQueryResult('SELECT is_pro', [{ is_pro: true }])
    })

    it('should return all alerts for Pro users', async () => {
      const mockAlerts = [
        { id: 'alert-1', title: 'Visa expiring', alert_type: 'visa_expiry' },
        { id: 'alert-2', title: '90 day report', alert_type: '90day_report' },
      ]
      setMockQueryResult('SELECT * FROM user_alerts', mockAlerts)

      const req = createMockRequest('GET', '/api/alerts', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await alertsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.alerts).toHaveLength(2)
      expect(data.alerts[0].id).toBe('alert-1')
    })

    it('should get unread count', async () => {
      setMockQueryResult('SELECT COUNT', [{ count: '5' }])

      const req = createMockRequest('GET', '/api/alerts?action=unread-count', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await alertsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.count).toBe(5)
    })

    it('should get upcoming alerts for next 30 days', async () => {
      const upcomingAlerts = [
        { id: 'alert-1', trigger_date: '2025-02-15' },
        { id: 'alert-2', trigger_date: '2025-02-20' },
      ]
      setMockQueryResult('BETWEEN CURRENT_DATE AND CURRENT_DATE', upcomingAlerts)

      const req = createMockRequest('GET', '/api/alerts?action=upcoming', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await alertsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.alerts).toHaveLength(2)
      expect(wasQueryMade('30 days')).toBe(true)
    })

    it('should filter dismissed alerts by default', async () => {
      setMockQueryResult('SELECT * FROM user_alerts', [])

      const req = createMockRequest('GET', '/api/alerts', {
        headers: { 'x-user-id': 'user-123' },
      })

      await alertsHandler(req, mockContext as never)

      expect(wasQueryMade('is_dismissed = false')).toBe(true)
    })

    it('should include dismissed alerts when showDismissed=true', async () => {
      setMockQueryResult('SELECT * FROM user_alerts', [])

      const req = createMockRequest('GET', '/api/alerts?showDismissed=true', {
        headers: { 'x-user-id': 'user-123' },
      })

      await alertsHandler(req, mockContext as never)

      const queries = getQueriesMatching('SELECT * FROM user_alerts')
      // Should NOT have the is_dismissed filter
      expect(queries.some((q) => q.query.includes('is_dismissed = false'))).toBe(false)
    })
  })

  describe('POST /api/alerts', () => {
    beforeEach(() => {
      setMockQueryResult('SELECT is_pro', [{ is_pro: true }])
    })

    it('should create manual alert', async () => {
      const mockAlert = {
        id: 'alert-new',
        user_id: 'user-123',
        alert_type: 'custom',
        title: 'Custom reminder',
        message: 'Remember to pack sunscreen',
        trigger_date: '2025-03-01',
        priority: 2,
      }
      setMockQueryResult('INSERT INTO user_alerts', [mockAlert])

      const req = createMockRequest('POST', '/api/alerts', {
        headers: { 'x-user-id': 'user-123' },
        body: {
          alertType: 'custom',
          title: 'Custom reminder',
          message: 'Remember to pack sunscreen',
          triggerDate: '2025-03-01',
        },
      })

      const response = await alertsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(201)
      expect(data.alert).toBeTruthy()
      expect(data.alert.title).toBe('Custom reminder')
    })

    it('should create alert with custom priority', async () => {
      const mockAlert = { id: 'alert-new', priority: 4 }
      setMockQueryResult('INSERT INTO user_alerts', [mockAlert])

      const req = createMockRequest('POST', '/api/alerts', {
        headers: { 'x-user-id': 'user-123' },
        body: {
          alertType: 'visa_expiry',
          title: 'Urgent reminder',
          message: 'Visa expires tomorrow!',
          triggerDate: '2025-02-01',
          priority: 4,
        },
      })

      const response = await alertsHandler(req, mockContext as never)

      expect(response.status).toBe(201)
      expect(wasQueryMade('INSERT INTO user_alerts')).toBe(true)
    })

    it('should setup visa alerts for visa_exempt', async () => {
      setMockQueryResult('UPDATE user_profiles SET', [])
      setMockQueryResult('DELETE FROM user_alerts', [])
      setMockQueryResult('INSERT INTO user_alerts', [
        { id: 'alert-expiry' },
        { id: 'alert-extension' },
        { id: 'alert-welcome' },
      ])

      const req = createMockRequest('POST', '/api/alerts', {
        headers: { 'x-user-id': 'user-123' },
        body: {
          action: 'setup-visa',
          visaType: 'visa_exempt',
          entryDate: '2025-01-15',
        },
      })

      const response = await alertsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.visaInfo.type).toBe('visa_exempt')
      expect(data.alerts).toBeDefined()
    })

    it('should setup visa alerts with 90-day reporting for DTV', async () => {
      setMockQueryResult('UPDATE user_profiles SET', [])
      setMockQueryResult('DELETE FROM user_alerts', [])
      setMockQueryResult('INSERT INTO user_alerts', [{ id: 'alert-1' }])

      const req = createMockRequest('POST', '/api/alerts', {
        headers: { 'x-user-id': 'user-123' },
        body: {
          action: 'setup-visa',
          visaType: 'dtv',
          entryDate: '2025-01-01',
        },
      })

      const response = await alertsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(201)
      expect(data.visaInfo.type).toBe('dtv')
      // DTV has 180 day duration
      expect(wasQueryMade('90day_report')).toBe(true)
    })

    it('should setup visa alerts with custom expiry date', async () => {
      setMockQueryResult('UPDATE user_profiles SET', [])
      setMockQueryResult('DELETE FROM user_alerts', [])
      setMockQueryResult('INSERT INTO user_alerts', [{ id: 'alert-1' }])

      const req = createMockRequest('POST', '/api/alerts', {
        headers: { 'x-user-id': 'user-123' },
        body: {
          action: 'setup-visa',
          visaType: 'retirement_visa',
          entryDate: '2025-01-01',
          visaExpiryDate: '2026-01-01',
        },
      })

      const response = await alertsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(201)
      expect(data.visaInfo.expiryDate).toBe('2026-01-01')
    })

    it('should clear existing visa alerts when setting up new visa', async () => {
      setMockQueryResult('UPDATE user_profiles SET', [])
      setMockQueryResult('DELETE FROM user_alerts', [])
      setMockQueryResult('INSERT INTO user_alerts', [{ id: 'alert-1' }])

      const req = createMockRequest('POST', '/api/alerts', {
        headers: { 'x-user-id': 'user-123' },
        body: {
          action: 'setup-visa',
          visaType: 'tourist_visa_60',
          entryDate: '2025-02-01',
        },
      })

      await alertsHandler(req, mockContext as never)

      expect(wasQueryMade('DELETE FROM user_alerts')).toBe(true)
      expect(wasQueryMade("'visa_expiry', 'visa_extension', '90day_report'")).toBe(true)
    })

    it('should use default config for unknown visa type', async () => {
      setMockQueryResult('UPDATE user_profiles SET', [])
      setMockQueryResult('DELETE FROM user_alerts', [])
      setMockQueryResult('INSERT INTO user_alerts', [{ id: 'alert-1' }])

      const req = createMockRequest('POST', '/api/alerts', {
        headers: { 'x-user-id': 'user-123' },
        body: {
          action: 'setup-visa',
          visaType: 'unknown_type',
          entryDate: '2025-01-01',
        },
      })

      const response = await alertsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      // Default is 30 days
      expect(response.status).toBe(201)
      expect(data.visaInfo.daysRemaining).toBeDefined()
    })
  })

  describe('PUT /api/alerts', () => {
    beforeEach(() => {
      setMockQueryResult('SELECT is_pro', [{ is_pro: true }])
    })

    it('should return 400 without alert ID', async () => {
      const req = createMockRequest('PUT', '/api/alerts', {
        headers: { 'x-user-id': 'user-123' },
        body: { action: 'read' },
      })

      const response = await alertsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.error).toBe('Alert ID required')
    })

    it('should mark alert as read', async () => {
      setMockQueryResult('UPDATE user_alerts', [])

      const req = createMockRequest('PUT', '/api/alerts?id=alert-123', {
        headers: { 'x-user-id': 'user-123' },
        body: { action: 'read' },
      })

      const response = await alertsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(wasQueryMade('is_read = true')).toBe(true)
    })

    it('should dismiss alert', async () => {
      setMockQueryResult('UPDATE user_alerts', [])

      const req = createMockRequest('PUT', '/api/alerts?id=alert-123', {
        headers: { 'x-user-id': 'user-123' },
        body: { action: 'dismiss' },
      })

      const response = await alertsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(wasQueryMade('is_dismissed = true')).toBe(true)
    })

    it('should update alert fields', async () => {
      const updatedAlert = {
        id: 'alert-123',
        title: 'Updated title',
        message: 'Updated message',
        trigger_date: '2025-03-15',
        priority: 3,
      }
      setMockQueryResult('UPDATE user_alerts SET', [updatedAlert])

      const req = createMockRequest('PUT', '/api/alerts?id=alert-123', {
        headers: { 'x-user-id': 'user-123' },
        body: {
          title: 'Updated title',
          message: 'Updated message',
          triggerDate: '2025-03-15',
          priority: 3,
        },
      })

      const response = await alertsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.alert.title).toBe('Updated title')
    })

    it('should return 404 when alert not found', async () => {
      setMockQueryResult('UPDATE user_alerts SET', [])

      const req = createMockRequest('PUT', '/api/alerts?id=nonexistent', {
        headers: { 'x-user-id': 'user-123' },
        body: { title: 'Updated title' },
      })

      const response = await alertsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(404)
      expect(data.error).toBe('Alert not found')
    })
  })

  describe('DELETE /api/alerts', () => {
    beforeEach(() => {
      setMockQueryResult('SELECT is_pro', [{ is_pro: true }])
    })

    it('should return 400 without alert ID', async () => {
      const req = createMockRequest('DELETE', '/api/alerts', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await alertsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.error).toBe('Alert ID required')
    })

    it('should delete alert', async () => {
      setMockQueryResult('DELETE FROM user_alerts', [{ id: 'alert-123' }])

      const req = createMockRequest('DELETE', '/api/alerts?id=alert-123', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await alertsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 404 when alert not found', async () => {
      setMockQueryResult('DELETE FROM user_alerts', [])

      const req = createMockRequest('DELETE', '/api/alerts?id=nonexistent', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await alertsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(404)
      expect(data.error).toBe('Alert not found')
    })

    it('should verify user ownership when deleting', async () => {
      setMockQueryResult('DELETE FROM user_alerts', [{ id: 'alert-123' }])

      const req = createMockRequest('DELETE', '/api/alerts?id=alert-123', {
        headers: { 'x-user-id': 'user-123' },
      })

      await alertsHandler(req, mockContext as never)

      // Verify query includes user_id check
      expect(wasQueryMade('user_id')).toBe(true)
    })
  })

  describe('visa tracking setup (facts + SQL, T-0447)', () => {
    const setupRequest = (body: Record<string, unknown>) =>
      createMockRequest('POST', '/api/alerts', {
        headers: { 'x-user-id': 'user-123' },
        body: { action: 'setup-visa', ...body },
      })
    const insertedAlerts = () =>
      getMockQueryLog()
        .filter((q) => q.query.includes('INSERT INTO user_alerts'))
        .map((q) => ({ type: q.values[1] as string, message: q.values[3] as string, trigger: q.values[4] as string }))

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date('2026-11-12T05:00:00Z'))
      setMockQueryResult('SELECT is_pro', [{ is_pro: true }])
      setMockQueryResult('INSERT INTO user_alerts', [{ id: 'a1' }])
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('never puts a query parameter inside a quoted SQL string (Postgres refuses the insert)', async () => {
      await alertsHandler(setupRequest({ visaType: 'dtv', entryDate: '2026-11-01' }), mockContext as never)
      const queries = getMockQueryLog().map((q) => q.query)
      expect(queries.length).toBeGreaterThan(3)
      for (const query of queries) {
        expect(query).not.toMatch(/'[^']*\$\d+[^']*'/)
      }
    })

    it('reminds about the 90-day report when its window opens, with the online and in-person windows', async () => {
      const response = await alertsHandler(setupRequest({ visaType: 'dtv', entryDate: '2026-11-01' }), mockContext as never)
      expect(response.status).toBe(201)
      const reports = insertedAlerts().filter((a) => a.type === '90day_report')
      // 180-day DTV entry: one report due 30 Jan 2027 (the next would fall on the last day of the stay)
      expect(reports).toHaveLength(1)
      expect(reports[0].trigger).toBe('2027-01-15')
      expect(reports[0].message).toContain('due on 30 Jan 2027')
      expect(reports[0].message).toContain('online at tm47.immigration.go.th until 23 Jan 2027')
      expect(reports[0].message).toContain('in person at your immigration office until 6 Feb 2027')
      expect(reports[0].message).toContain('2,000 THB fine')
    })

    it('still reminds today when the report window is already open', async () => {
      // Due 2026-11-20: window opened 2026-11-05, online closed after 2026-11-13
      await alertsHandler(
        setupRequest({ visaType: 'retirement_visa', entryDate: '2026-08-22' }),
        mockContext as never
      )
      const reports = insertedAlerts().filter((a) => a.type === '90day_report')
      expect(reports[0].trigger).toBe('2026-11-12')
      expect(reports[0].message).toContain('due on 20 Nov 2026')
    })

    it('lists current extension documents (TM.7, no TM.6) and the overstay fine', async () => {
      await alertsHandler(setupRequest({ visaType: 'visa_exempt', entryDate: '2026-11-10' }), mockContext as never)
      const alerts = insertedAlerts()
      const extension = alerts.find((a) => a.type === 'visa_extension')!
      expect(extension.message).toContain('form TM.7, one 4x6 cm photo and the 1,900 THB fee')
      expect(extension.message).not.toContain('TM.6')
      expect(extension.trigger).toBe('2026-11-26')
      const expiry = alerts.find((a) => a.type === 'visa_expiry')!
      expect(expiry.message).toContain('ends in 7 days, on 10 Dec 2026')
      expect(expiry.message).toContain('500 THB per day')
      const welcome = alerts.find((a) => a.type === 'travel_tip')!
      expect(welcome.message).toContain('check it against the date on your entry stamp')
    })

    it.each(['visa_exempt_60', 'work_permit'])('asks for the stamp date for %s (no fixed length)', async (visaType) => {
      const response = await alertsHandler(setupRequest({ visaType, entryDate: '2026-11-01' }), mockContext as never)
      const data = await parseResponse(response)
      expect(response.status).toBe(400)
      expect(data.error).toContain('entry stamp')
      expect(wasQueryMade('UPDATE user_profiles')).toBe(false)
    })

    it('accepts the stamp date for a bilateral 90-day exemption', async () => {
      const response = await alertsHandler(
        setupRequest({ visaType: 'visa_exempt_60', entryDate: '2026-11-01', visaExpiryDate: '2027-01-29' }),
        mockContext as never
      )
      const data = await parseResponse(response)
      expect(response.status).toBe(201)
      expect(data.visaInfo.expiryDate).toBe('2027-01-29')
    })

    it('rejects an invalid entry date or an expiry before entry', async () => {
      const bad = await alertsHandler(setupRequest({ visaType: 'dtv', entryDate: 'not-a-date' }), mockContext as never)
      expect(bad.status).toBe(400)
      const backwards = await alertsHandler(
        setupRequest({ visaType: 'dtv', entryDate: '2026-11-01', visaExpiryDate: '2026-10-01' }),
        mockContext as never
      )
      expect(backwards.status).toBe(400)
    })

    it('returns alerts in the camelCase shape the page reads', async () => {
      setMockQueryResult('SELECT * FROM user_alerts', [
        { id: 'x', alert_type: '90day_report', trigger_date: '2027-01-15', is_read: false, is_dismissed: false, priority: 3 },
      ])
      const req = createMockRequest('GET', '/api/alerts', { headers: { 'x-user-id': 'user-123' } })
      const data = await parseResponse(await alertsHandler(req, mockContext as never))
      expect(data.alerts[0]).toMatchObject({ id: 'x', alertType: '90day_report', triggerDate: '2027-01-15', isRead: false, priority: 3 })
    })
  })

  describe('unsupported methods', () => {
    it('should return 405 for PATCH method', async () => {
      setMockQueryResult('SELECT is_pro', [{ is_pro: true }])

      const req = createMockRequest('PATCH', '/api/alerts', {
        headers: { 'x-user-id': 'user-123' },
        body: {},
      })

      const response = await alertsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(405)
      expect(data.error).toBe('Method not allowed')
    })
  })
})
