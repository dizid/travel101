import { describe, it, expect, beforeEach, vi } from 'vitest'
import '../../__mocks__/db'
import { mockSql } from '../../__mocks__/db'
import { setMockQueryResult, clearMockResults } from '../../__mocks__/db'

import {
  FREE_LIMITS,
  checkAndIncrementUsage,
  getUsageStatus,
  checkUsage,
  type FeatureType,
} from '../../lib/usage.mts'

describe('usage lib', () => {
  beforeEach(() => {
    clearMockResults()
    vi.clearAllMocks()
  })

  describe('FREE_LIMITS', () => {
    it('should define limits for all feature types', () => {
      expect(FREE_LIMITS.general_chat).toBe(1)
      expect(FREE_LIMITS.attraction_intro).toBe(1)
      expect(FREE_LIMITS.attraction_tips).toBe(1)
      expect(FREE_LIMITS.attraction_chat).toBe(1)
      expect(FREE_LIMITS.packing).toBe(1)
    })
  })

  describe('checkAndIncrementUsage', () => {
    it('should allow Pro users with unlimited access', async () => {
      setMockQueryResult('SELECT is_pro FROM user_profiles', [{ is_pro: true }])

      const result = await checkAndIncrementUsage(mockSql, 'user-pro', 'general_chat')

      expect(result.allowed).toBe(true)
      expect(result.isPro).toBe(true)
      expect(result.remaining).toBe(Infinity)
    })

    it('should allow free user within limit', async () => {
      setMockQueryResult('SELECT is_pro FROM user_profiles', [{ is_pro: false }])
      setMockQueryResult('SELECT usage_count FROM ai_usage', [])

      const result = await checkAndIncrementUsage(mockSql, 'user-free', 'general_chat')

      expect(result.allowed).toBe(true)
      expect(result.isPro).toBe(false)
      expect(result.currentUsage).toBe(1)
      expect(result.remaining).toBe(0) // limit is 1, used 1
    })

    it('should deny free user who reached limit', async () => {
      setMockQueryResult('SELECT is_pro FROM user_profiles', [{ is_pro: false }])
      setMockQueryResult('SELECT usage_count FROM ai_usage', [{ usage_count: 1 }])

      const result = await checkAndIncrementUsage(mockSql, 'user-free', 'general_chat')

      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.currentUsage).toBe(1)
      expect(result.limit).toBe(1)
    })

    it('should handle user not in profiles table', async () => {
      setMockQueryResult('SELECT is_pro FROM user_profiles', [])
      setMockQueryResult('SELECT usage_count FROM ai_usage', [])

      const result = await checkAndIncrementUsage(mockSql, 'new-user', 'packing')

      expect(result.allowed).toBe(true)
      expect(result.isPro).toBe(false)
    })
  })

  describe('getUsageStatus', () => {
    it('should return unlimited for Pro users', async () => {
      setMockQueryResult('SELECT is_pro FROM user_profiles', [{ is_pro: true }])

      const result = await getUsageStatus(mockSql, 'user-pro')

      expect(result.isPro).toBe(true)
      const features = Object.keys(FREE_LIMITS) as FeatureType[]
      for (const feature of features) {
        expect(result.usage[feature].limit).toBe(Infinity)
        expect(result.usage[feature].remaining).toBe(Infinity)
      }
    })

    it('should return usage data for free users', async () => {
      setMockQueryResult('SELECT is_pro FROM user_profiles', [{ is_pro: false }])
      setMockQueryResult('SELECT feature_type, usage_count', [
        { feature_type: 'general_chat', usage_count: 1 },
      ])

      const result = await getUsageStatus(mockSql, 'user-free')

      expect(result.isPro).toBe(false)
      expect(result.usage.general_chat.used).toBe(1)
      expect(result.usage.general_chat.remaining).toBe(0)
      expect(result.usage.packing.used).toBe(0)
      expect(result.usage.packing.remaining).toBe(1)
    })
  })

  describe('checkUsage', () => {
    it('should return usage without incrementing for Pro users', async () => {
      setMockQueryResult('SELECT is_pro FROM user_profiles', [{ is_pro: true }])

      const result = await checkUsage(mockSql, 'user-pro', 'general_chat')

      expect(result.isPro).toBe(true)
      expect(result.remaining).toBe(Infinity)
    })

    it('should return current usage for free users', async () => {
      setMockQueryResult('SELECT is_pro FROM user_profiles', [{ is_pro: false }])
      setMockQueryResult('SELECT usage_count FROM ai_usage', [{ usage_count: 1 }])

      const result = await checkUsage(mockSql, 'user-free', 'general_chat')

      expect(result.isPro).toBe(false)
      expect(result.used).toBe(1)
      expect(result.limit).toBe(1)
      expect(result.remaining).toBe(0)
    })

    it('should return 0 used when no usage record exists', async () => {
      setMockQueryResult('SELECT is_pro FROM user_profiles', [{ is_pro: false }])
      setMockQueryResult('SELECT usage_count FROM ai_usage', [])

      const result = await checkUsage(mockSql, 'new-user', 'packing')

      expect(result.used).toBe(0)
      expect(result.remaining).toBe(1)
    })
  })
})
