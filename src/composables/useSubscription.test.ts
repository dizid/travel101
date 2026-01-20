import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSubscription } from './useSubscription'
import { useUserStore } from '@/stores/userStore'
import { mockFetch, createMockResponse, mockLocation } from '@/test/setup'

describe('useSubscription', () => {
  let userStore: ReturnType<typeof useUserStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    userStore = useUserStore()
    userStore.setAuthUser('user-123')
  })

  describe('fetchStatus', () => {
    it('should fetch and store subscription status', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          isPro: true,
          subscription: {
            status: 'active',
            currentPeriodEnd: '2024-12-31T00:00:00Z',
            cancelAtPeriodEnd: false,
          },
        })
      )

      const { fetchStatus, subscriptionStatus, isPro } = useSubscription()
      await fetchStatus()

      expect(subscriptionStatus.value?.isPro).toBe(true)
      expect(subscriptionStatus.value?.subscription?.status).toBe('active')
      expect(isPro.value).toBe(true)
    })

    it('should sync Pro status to user store', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          isPro: true,
          subscription: null,
        })
      )

      const { fetchStatus } = useSubscription()
      await fetchStatus()

      expect(userStore.isPro).toBe(true)
    })

    it('should handle non-Pro status', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          isPro: false,
          subscription: null,
        })
      )

      const { fetchStatus, isPro } = useSubscription()
      await fetchStatus()

      expect(isPro.value).toBe(false)
    })
  })

  describe('startCheckout', () => {
    it('should redirect to Stripe checkout URL', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          url: 'https://checkout.stripe.com/pay/cs_test123',
        })
      )

      const { startCheckout } = useSubscription()
      await startCheckout()

      expect(mockLocation.href).toBe('https://checkout.stripe.com/pay/cs_test123')
    })

    it('should send create-checkout action', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          url: 'https://checkout.stripe.com/pay/cs_test123',
        })
      )

      const { startCheckout } = useSubscription()
      await startCheckout()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/subscription'),
        expect.objectContaining({
          body: expect.stringContaining('create-checkout'),
        })
      )
    })

    it('should not redirect if no URL returned', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ url: null }))
      mockLocation.href = 'initial'

      const { startCheckout } = useSubscription()
      await startCheckout()

      expect(mockLocation.href).toBe('initial')
    })
  })

  describe('openPortal', () => {
    it('should redirect to Stripe billing portal', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          url: 'https://billing.stripe.com/session/portal_test123',
        })
      )

      const { openPortal } = useSubscription()
      await openPortal()

      expect(mockLocation.href).toBe('https://billing.stripe.com/session/portal_test123')
    })

    it('should send create-portal action', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          url: 'https://billing.stripe.com/session/portal_test123',
        })
      )

      const { openPortal } = useSubscription()
      await openPortal()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/subscription'),
        expect.objectContaining({
          body: expect.stringContaining('create-portal'),
        })
      )
    })
  })

  describe('isPro computed', () => {
    it('should use subscriptionStatus if available', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          isPro: true,
          subscription: null,
        })
      )

      const { fetchStatus, isPro } = useSubscription()
      await fetchStatus()

      expect(isPro.value).toBe(true)
    })

    it('should fall back to userStore.isPro', () => {
      userStore.setPro(true)

      const { isPro } = useSubscription()

      expect(isPro.value).toBe(true)
    })

    it('should prefer subscriptionStatus over userStore', async () => {
      userStore.setPro(true)
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          isPro: false,
          subscription: null,
        })
      )

      const { fetchStatus, isPro } = useSubscription()
      await fetchStatus()

      expect(isPro.value).toBe(false)
    })
  })

  describe('nextBillingDate computed', () => {
    it('should format billing date', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          isPro: true,
          subscription: {
            status: 'active',
            currentPeriodEnd: '2024-12-31T00:00:00Z',
            cancelAtPeriodEnd: false,
          },
        })
      )

      const { fetchStatus, nextBillingDate } = useSubscription()
      await fetchStatus()

      expect(nextBillingDate.value).toBeDefined()
      expect(typeof nextBillingDate.value).toBe('string')
    })

    it('should return null when no subscription', () => {
      const { nextBillingDate } = useSubscription()

      expect(nextBillingDate.value).toBeNull()
    })

    it('should return null when subscription has no end date', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          isPro: true,
          subscription: {
            status: 'active',
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
          },
        })
      )

      const { fetchStatus, nextBillingDate } = useSubscription()
      await fetchStatus()

      expect(nextBillingDate.value).toBeNull()
    })
  })

  describe('loading and error', () => {
    it('should expose loading state', async () => {
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(createMockResponse({ isPro: false })), 100)
          )
      )

      const { loading, fetchStatus } = useSubscription()

      const promise = fetchStatus()
      expect(loading.value).toBe(true)

      await promise
      expect(loading.value).toBe(false)
    })
  })
})
