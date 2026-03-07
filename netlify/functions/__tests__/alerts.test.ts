import { describe, it, expect, beforeEach, vi } from 'vitest'
import '../__mocks__/db'
import { setMockQueryResult, clearMockResults, wasQueryMade, getQueriesMatching } from '../__mocks__/db'
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
