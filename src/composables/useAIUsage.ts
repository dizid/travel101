import { ref, computed } from 'vue'
import { useApi } from './useApi'
import { useUserStore } from '@/stores/userStore'

export interface UsageData {
  used: number
  limit: number
  remaining: number
}

export interface UsageResponse {
  usage: Record<string, UsageData>
  isPro: boolean
  limits: Record<string, number>
}

// Default limits used before API response is available
// These values are fetched from the API and should be accessed via usageData.value.limits
const DEFAULT_LIMITS = {
  general_chat: 1,
  attraction_intro: 1,
  attraction_tips: 1,
  attraction_chat: 1,
  packing: 1,
}

export type FeatureType = keyof typeof DEFAULT_LIMITS

// Get the limit for a feature, preferring API-provided limits
const getLimit = (feature: FeatureType, apiLimits?: Record<string, number>): number => {
  return apiLimits?.[feature] ?? DEFAULT_LIMITS[feature]
}

const defaultUsage = (limit: number): UsageData => ({
  used: 0,
  limit,
  remaining: limit,
})

export function useAIUsage() {
  const { get, loading, error } = useApi()
  const userStore = useUserStore()
  const usageData = ref<UsageResponse | null>(null)
  const lastFetched = ref<number>(0)

  // Cache for 30 seconds to avoid excessive API calls
  const CACHE_TTL = 30 * 1000

  async function fetchUsage(force = false): Promise<UsageResponse | null> {
    const now = Date.now()
    if (!force && usageData.value && (now - lastFetched.value) < CACHE_TTL) {
      return usageData.value
    }

    const result = await get<UsageResponse>('/usage')
    if (result) {
      usageData.value = result
      lastFetched.value = now
    }
    return result
  }

  // Manually decrement remaining after a successful API call
  function decrementUsage(feature: FeatureType) {
    if (!usageData.value || usageData.value.isPro) return

    const current = usageData.value.usage[feature]
    if (current) {
      usageData.value.usage[feature] = {
        ...current,
        used: current.used + 1,
        remaining: Math.max(0, current.remaining - 1),
      }
    }
  }

  // Computed properties for easy access
  const isPro = computed(() => usageData.value?.isPro ?? userStore.isPro)

  // Access API-provided limits with fallback to defaults
  const limits = computed(() => usageData.value?.limits ?? DEFAULT_LIMITS)

  const chatUsage = computed((): UsageData =>
    usageData.value?.usage.general_chat ?? defaultUsage(getLimit('general_chat', usageData.value?.limits))
  )

  const introUsage = computed((): UsageData =>
    usageData.value?.usage.attraction_intro ?? defaultUsage(getLimit('attraction_intro', usageData.value?.limits))
  )

  const tipsUsage = computed((): UsageData =>
    usageData.value?.usage.attraction_tips ?? defaultUsage(getLimit('attraction_tips', usageData.value?.limits))
  )

  const attractionChatUsage = computed((): UsageData =>
    usageData.value?.usage.attraction_chat ?? defaultUsage(getLimit('attraction_chat', usageData.value?.limits))
  )

  const packingUsage = computed((): UsageData =>
    usageData.value?.usage.packing ?? defaultUsage(getLimit('packing', usageData.value?.limits))
  )

  function getUsageForFeature(feature: FeatureType): UsageData {
    return usageData.value?.usage[feature] ?? defaultUsage(getLimit(feature, usageData.value?.limits))
  }

  function canUseFeature(feature: FeatureType): boolean {
    if (isPro.value) return true
    const usage = getUsageForFeature(feature)
    return usage.remaining > 0
  }

  // Calculate total remaining across all features
  const totalRemaining = computed(() => {
    if (isPro.value) return Infinity
    return Object.values(usageData.value?.usage ?? {}).reduce(
      (sum, u) => sum + u.remaining,
      0
    )
  })

  return {
    loading,
    error,
    usageData,
    isPro,
    limits,
    chatUsage,
    introUsage,
    tipsUsage,
    attractionChatUsage,
    packingUsage,
    totalRemaining,
    fetchUsage,
    decrementUsage,
    getUsageForFeature,
    canUseFeature,
    DEFAULT_LIMITS,
  }
}
