import { describe, it, expect, beforeEach, vi } from 'vitest'
import '../__mocks__/db'
import { setMockQueryResult, clearMockResults } from '../__mocks__/db'
import { setMockEnv, clearMockEnv } from './setup.js'
import { createMockRequest, createMockContext, parseResponse } from './helpers.js'

import usageHandler from '../usage.mts'

const mockContext = createMockContext()

describe('usage function', () => {
  beforeEach(() => {
    clearMockResults()
    clearMockEnv()
    vi.clearAllMocks()
    setMockEnv('DATABASE_URL', 'postgresql://test:test@localhost/test')
  })

  describe('GET /api/usage', () => {
    it('should return default limits for unauthenticated users', async () => {
      const req = createMockRequest('GET', '/api/usage')
      const response = await usageHandler(req, mockContext)
      const body = await parseResponse<{ usage: any; isPro: boolean; limits: any }>(response)

      expect(response.status).toBe(200)
      expect(body.isPro).toBe(false)
      expect(body.limits).toBeDefined()
      expect(body.usage.general_chat.limit).toBe(1)
      expect(body.usage.general_chat.remaining).toBe(1)
    })

    it('should return usage data for authenticated users', async () => {
      setMockQueryResult('SELECT is_pro FROM user_profiles', [{ is_pro: false }])
      setMockQueryResult('SELECT feature_type, usage_count', [
        { feature_type: 'general_chat', usage_count: 1 },
      ])

      const req = createMockRequest('GET', '/api/usage', {
        headers: { 'x-user-id': 'user-123' },
      })
      const response = await usageHandler(req, mockContext)
      const body = await parseResponse<{ usage: any; isPro: boolean }>(response)

      expect(response.status).toBe(200)
      expect(body.isPro).toBe(false)
    })

    it('should return unlimited for Pro users', async () => {
      setMockQueryResult('SELECT is_pro FROM user_profiles', [{ is_pro: true }])

      const req = createMockRequest('GET', '/api/usage', {
        headers: { 'x-user-id': 'user-pro' },
      })
      const response = await usageHandler(req, mockContext)
      const body = await parseResponse<{ isPro: boolean }>(response)

      expect(response.status).toBe(200)
      expect(body.isPro).toBe(true)
    })

    it('should grant Pro access in test mode without auth', async () => {
      const req = createMockRequest('GET', '/api/usage', {
        headers: { 'x-test-mode': 'test123' },
      })
      const response = await usageHandler(req, mockContext)
      const body = await parseResponse<{ isPro: boolean }>(response)

      expect(response.status).toBe(200)
      expect(body.isPro).toBe(true)
    })
  })

  describe('method validation', () => {
    it('should return 405 for POST', async () => {
      const req = createMockRequest('POST', '/api/usage')
      const response = await usageHandler(req, mockContext)

      expect(response.status).toBe(405)
    })
  })
})
