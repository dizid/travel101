import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mockFetch, createMockResponse } from '@/test/setup'

// Mock useApi
vi.mock('@/composables/useApi', () => ({
  useApi: () => ({
    get: vi.fn(async (url: string) => {
      const response = await fetch(url, { method: 'GET' })
      if (!response.ok) return null
      return response.json()
    }),
    loading: { value: false },
    error: { value: null },
  }),
}))

import { useAIUsage, type UsageResponse } from './useAIUsage'

// Factory functions to avoid shared references between tests
function createMockUsage(): UsageResponse {
  return {
    usage: {
      general_chat: { used: 1, limit: 1, remaining: 0 },
      attraction_intro: { used: 0, limit: 1, remaining: 1 },
      attraction_tips: { used: 0, limit: 1, remaining: 1 },
      attraction_chat: { used: 0, limit: 1, remaining: 1 },
      packing: { used: 0, limit: 1, remaining: 1 },
    },
    isPro: false,
    limits: {
      general_chat: 1,
      attraction_intro: 1,
      attraction_tips: 1,
      attraction_chat: 1,
      packing: 1,
    },
  }
}

function createMockProUsage(): UsageResponse {
  return {
    usage: {
      general_chat: { used: 5, limit: Infinity, remaining: Infinity },
      attraction_intro: { used: 3, limit: Infinity, remaining: Infinity },
      attraction_tips: { used: 2, limit: Infinity, remaining: Infinity },
      attraction_chat: { used: 1, limit: Infinity, remaining: Infinity },
      packing: { used: 0, limit: Infinity, remaining: Infinity },
    },
    isPro: true,
    limits: {},
  }
}

describe('useAIUsage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('fetchUsage', () => {
    it('should fetch and store usage data', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(createMockUsage()))

      const { fetchUsage, usageData } = useAIUsage()
      const result = await fetchUsage()

      expect(result).toBeTruthy()
      expect(usageData.value).toBeTruthy()
      expect(usageData.value!.isPro).toBe(false)
    })

    it('should use cache within TTL', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(createMockUsage()))

      const { fetchUsage } = useAIUsage()
      await fetchUsage()

      // Second call should not fetch
      await fetchUsage()

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should force-fetch when requested', async () => {
      mockFetch
        .mockResolvedValueOnce(createMockResponse(createMockUsage()))
        .mockResolvedValueOnce(createMockResponse(createMockProUsage()))

      const { fetchUsage } = useAIUsage()
      await fetchUsage()
      await fetchUsage(true) // force

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('canUseFeature', () => {
    it('should return true when remaining > 0', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(createMockUsage()))

      const { fetchUsage, canUseFeature } = useAIUsage()
      await fetchUsage()

      expect(canUseFeature('attraction_intro')).toBe(true) // remaining: 1
    })

    it('should return false when limit reached', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(createMockUsage()))

      const { fetchUsage, canUseFeature } = useAIUsage()
      await fetchUsage()

      expect(canUseFeature('general_chat')).toBe(false) // remaining: 0
    })

    it('should always return true for Pro users', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(createMockProUsage()))

      const { fetchUsage, canUseFeature } = useAIUsage()
      await fetchUsage()

      expect(canUseFeature('general_chat')).toBe(true)
      expect(canUseFeature('packing')).toBe(true)
    })
  })

  describe('decrementUsage', () => {
    it('should decrement remaining count', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(createMockUsage()))

      const { fetchUsage, decrementUsage, getUsageForFeature } = useAIUsage()
      await fetchUsage()

      decrementUsage('attraction_intro')

      const usage = getUsageForFeature('attraction_intro')
      expect(usage.used).toBe(1)
      expect(usage.remaining).toBe(0)
    })

    it('should not decrement below zero', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(createMockUsage()))

      const { fetchUsage, decrementUsage, getUsageForFeature } = useAIUsage()
      await fetchUsage()

      decrementUsage('general_chat') // already at 0 remaining
      const usage = getUsageForFeature('general_chat')
      expect(usage.remaining).toBe(0)
    })

    it('should not decrement for Pro users', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(createMockProUsage()))

      const { fetchUsage, decrementUsage, usageData } = useAIUsage()
      await fetchUsage()

      const before = usageData.value?.usage.general_chat.used
      decrementUsage('general_chat')
      const after = usageData.value?.usage.general_chat.used

      expect(before).toBe(after) // Unchanged
    })
  })

  describe('computed properties', () => {
    it('should expose per-feature usage', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(createMockUsage()))

      const { fetchUsage, chatUsage, introUsage, packingUsage } = useAIUsage()
      await fetchUsage(true) // force to avoid cache

      expect(chatUsage.value.remaining).toBe(0) // general_chat limit reached
      expect(introUsage.value.remaining).toBe(1) // attraction_intro has remaining
      expect(packingUsage.value.remaining).toBe(1) // packing has remaining
    })

    it('should calculate totalRemaining', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(createMockUsage()))

      const { fetchUsage, totalRemaining } = useAIUsage()
      await fetchUsage(true) // force to avoid cache

      // totalRemaining sums remaining across all features
      expect(totalRemaining.value).toBeGreaterThanOrEqual(0)
      expect(totalRemaining.value).toBeLessThan(Infinity)
    })

    it('should return Infinity totalRemaining for Pro', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(createMockProUsage()))

      const { fetchUsage, totalRemaining } = useAIUsage()
      await fetchUsage()

      expect(totalRemaining.value).toBe(Infinity)
    })

    it('should return default usage when no data fetched', () => {
      const { chatUsage, DEFAULT_LIMITS } = useAIUsage()

      expect(chatUsage.value.limit).toBe(DEFAULT_LIMITS.general_chat)
      expect(chatUsage.value.used).toBe(0)
    })
  })
})
