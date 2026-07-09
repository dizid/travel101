import { ref, computed } from 'vue'
import { useApi } from './useApi'
import { useUserStore } from '@/stores/userStore'
import { signIn } from './useAuth'

interface SubscriptionStatus {
  isPro: boolean
  subscription: {
    status: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
  } | null
}

export function useSubscription() {
  const { get, post, loading, error } = useApi()
  const userStore = useUserStore()
  const subscriptionStatus = ref<SubscriptionStatus | null>(null)

  async function fetchStatus() {
    const status = await get<SubscriptionStatus>('/subscription')
    if (status) {
      subscriptionStatus.value = status
      userStore.setPro(status.isPro)
    }
    return status
  }

  async function startCheckout() {
    // Require authentication for subscription checkout
    if (!userStore.isAuthenticated) {
      signIn('/dashboard?upgrade=true')
      return null
    }

    const result = await post<{ url: string }>('/subscription', {
      action: 'create-checkout',
    })
    if (result?.url) {
      window.location.href = result.url
    }
    return result
  }

  async function openPortal() {
    // Require authentication for billing portal
    if (!userStore.isAuthenticated) {
      signIn('/dashboard')
      return null
    }

    const result = await post<{ url: string }>('/subscription', {
      action: 'create-portal',
    })
    if (result?.url) {
      window.location.href = result.url
    }
    return result
  }

  const isPro = computed(() => subscriptionStatus.value?.isPro ?? userStore.isPro)

  const nextBillingDate = computed(() => {
    const end = subscriptionStatus.value?.subscription?.currentPeriodEnd
    return end ? new Date(end).toLocaleDateString() : null
  })

  return {
    loading,
    error,
    subscriptionStatus,
    isPro,
    nextBillingDate,
    fetchStatus,
    startCheckout,
    openPortal,
  }
}
