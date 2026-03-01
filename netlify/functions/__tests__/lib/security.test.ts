import { describe, it, expect, beforeEach, vi } from 'vitest'
import '../../__mocks__/db'
import { setMockEnv, clearMockEnv } from '../setup.js'

import { safeCompare, validateAdminKey } from '../../lib/security.mts'

describe('security lib', () => {
  beforeEach(() => {
    clearMockEnv()
    vi.clearAllMocks()
  })

  describe('safeCompare', () => {
    it('should return true for equal strings', () => {
      expect(safeCompare('secret123', 'secret123')).toBe(true)
    })

    it('should return false for different strings of same length', () => {
      expect(safeCompare('secret123', 'secret456')).toBe(false)
    })

    it('should return false for different length strings', () => {
      expect(safeCompare('short', 'much-longer-string')).toBe(false)
    })

    it('should return false for empty first argument', () => {
      expect(safeCompare('', 'something')).toBe(false)
    })

    it('should return false for empty second argument', () => {
      expect(safeCompare('something', '')).toBe(false)
    })

    it('should return false for both empty strings', () => {
      expect(safeCompare('', '')).toBe(false)
    })

    it('should handle unicode strings', () => {
      expect(safeCompare('สวัสดี', 'สวัสดี')).toBe(true)
      expect(safeCompare('สวัสดี', 'ลาก่อน')).toBe(false)
    })

    it('should handle long strings', () => {
      const longStr = 'a'.repeat(10000)
      expect(safeCompare(longStr, longStr)).toBe(true)
      expect(safeCompare(longStr, longStr.slice(0, -1) + 'b')).toBe(false)
    })
  })

  describe('validateAdminKey', () => {
    it('should return true when admin key matches', () => {
      setMockEnv('ADMIN_API_KEY', 'my-secret-key')
      const req = new Request('http://localhost/api/test', {
        headers: { 'x-admin-key': 'my-secret-key' },
      })
      expect(validateAdminKey(req)).toBe(true)
    })

    it('should return false when admin key does not match', () => {
      setMockEnv('ADMIN_API_KEY', 'my-secret-key')
      const req = new Request('http://localhost/api/test', {
        headers: { 'x-admin-key': 'wrong-key' },
      })
      expect(validateAdminKey(req)).toBe(false)
    })

    it('should return false when admin key header is missing', () => {
      setMockEnv('ADMIN_API_KEY', 'my-secret-key')
      const req = new Request('http://localhost/api/test')
      expect(validateAdminKey(req)).toBe(false)
    })

    it('should return false when env var is not set', () => {
      const req = new Request('http://localhost/api/test', {
        headers: { 'x-admin-key': 'my-secret-key' },
      })
      expect(validateAdminKey(req)).toBe(false)
    })

    it('should return false when both are missing', () => {
      const req = new Request('http://localhost/api/test')
      expect(validateAdminKey(req)).toBe(false)
    })
  })
})
