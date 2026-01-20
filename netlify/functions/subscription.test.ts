import { describe, it, expect, beforeEach, vi } from 'vitest'
import './__mocks__/db'
import { setMockQueryResult, clearMockResults, wasQueryMade } from './__mocks__/db'
import { setMockEnv, clearMockEnv } from './__tests__/setup'
import { createMockRequest, parseResponse } from './__tests__/helpers'

// Mock Stripe responses
const mockStripeResponses = {
  customer: {
    id: 'cus_mock123',
    email: 'test@example.com',
    metadata: { user_id: 'user-123' },
  },
  checkoutSession: {
    id: 'cs_mock123',
    url: 'https://checkout.stripe.com/pay/cs_mock123',
  },
  portalSession: {
    url: 'https://billing.stripe.com/session/portal_mock123',
  },
  subscription: {
    id: 'sub_mock123',
    status: 'active',
    current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
    cancel_at_period_end: false,
  },
}

// Mock Stripe client
const mockStripe = {
  customers: {
    create: vi.fn().mockResolvedValue(mockStripeResponses.customer),
    retrieve: vi.fn().mockResolvedValue(mockStripeResponses.customer),
  },
  checkout: {
    sessions: {
      create: vi.fn().mockResolvedValue(mockStripeResponses.checkoutSession),
    },
  },
  billingPortal: {
    sessions: {
      create: vi.fn().mockResolvedValue(mockStripeResponses.portalSession),
    },
  },
  subscriptions: {
    retrieve: vi.fn().mockResolvedValue(mockStripeResponses.subscription),
  },
}

// This mock must be defined before importing subscriptionHandler
vi.mock('stripe', () => ({
  default: vi.fn(() => mockStripe),
}))

import subscriptionHandler from './subscription.mts'

const mockContext = {
  geo: { city: 'Bangkok' },
  ip: '127.0.0.1',
}

describe('subscription function', () => {
  beforeEach(() => {
    clearMockResults()
    clearMockEnv()
    vi.clearAllMocks()

    // Reset mock function implementations
    mockStripe.customers.create.mockResolvedValue(mockStripeResponses.customer)
    mockStripe.customers.retrieve.mockResolvedValue(mockStripeResponses.customer)
    mockStripe.checkout.sessions.create.mockResolvedValue(mockStripeResponses.checkoutSession)
    mockStripe.billingPortal.sessions.create.mockResolvedValue(mockStripeResponses.portalSession)
    mockStripe.subscriptions.retrieve.mockResolvedValue(mockStripeResponses.subscription)

    // Set required env vars
    setMockEnv('STRIPE_SECRET_KEY', 'sk_test_123')
    setMockEnv('STRIPE_PRO_PRICE_ID', 'price_pro_123')
    setMockEnv('URL', 'https://example.com')
  })

  describe('authentication', () => {
    it('should return 401 when x-user-id header is missing', async () => {
      const req = createMockRequest('GET', '/api/subscription', {
        headers: {},
      })

      const response = await subscriptionHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('GET /api/subscription', () => {
    it('should return subscription status for Pro user', async () => {
      const mockUser = {
        user_id: 'user-123',
        is_pro: true,
        stripe_subscription_id: 'sub_123',
      }
      setMockQueryResult('SELECT is_pro', [mockUser])

      const req = createMockRequest('GET', '/api/subscription', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await subscriptionHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.isPro).toBe(true)
      expect(data.subscription).toBeTruthy()
      expect(data.subscription.status).toBe('active')
    })

    it('should return isPro false for free user', async () => {
      const mockUser = {
        user_id: 'user-123',
        is_pro: false,
        stripe_subscription_id: null,
      }
      setMockQueryResult('SELECT is_pro', [mockUser])

      const req = createMockRequest('GET', '/api/subscription', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await subscriptionHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.isPro).toBe(false)
      expect(data.subscription).toBeNull()
    })

    it('should return 404 when user not found', async () => {
      setMockQueryResult('SELECT is_pro', [])

      const req = createMockRequest('GET', '/api/subscription', {
        headers: { 'x-user-id': 'nonexistent' },
      })

      const response = await subscriptionHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(404)
      expect(data.error).toBe('User not found')
    })

    it('should handle Stripe API error gracefully', async () => {
      const mockUser = {
        user_id: 'user-123',
        is_pro: true,
        stripe_subscription_id: 'sub_invalid',
      }
      setMockQueryResult('SELECT is_pro', [mockUser])
      mockStripe.subscriptions.retrieve.mockRejectedValueOnce(new Error('Invalid subscription'))

      const req = createMockRequest('GET', '/api/subscription', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await subscriptionHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.isPro).toBe(true)
      expect(data.subscription).toBeNull()
    })
  })

  describe('POST /api/subscription - create-checkout', () => {
    it('should create checkout session for existing user', async () => {
      const mockUser = {
        user_id: 'user-123',
        stripe_customer_id: 'cus_existing',
        is_pro: false,
      }
      setMockQueryResult('SELECT * FROM user_profiles', [mockUser])

      const req = createMockRequest('POST', '/api/subscription', {
        headers: { 'x-user-id': 'user-123' },
        body: { action: 'create-checkout', email: 'test@example.com' },
      })

      const response = await subscriptionHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.url).toBe(mockStripeResponses.checkoutSession.url)
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalled()
    })

    it('should create customer if not exists', async () => {
      const mockUser = {
        user_id: 'user-123',
        stripe_customer_id: null,
        is_pro: false,
      }
      setMockQueryResult('SELECT * FROM user_profiles', [mockUser])
      setMockQueryResult('UPDATE user_profiles SET stripe_customer_id', [mockUser])

      const req = createMockRequest('POST', '/api/subscription', {
        headers: { 'x-user-id': 'user-123' },
        body: { action: 'create-checkout', email: 'new@example.com' },
      })

      const response = await subscriptionHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(mockStripe.customers.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          metadata: { user_id: 'user-123' },
        })
      )
    })

    it('should create user profile if not exists', async () => {
      // First query returns empty (no user), second returns created user
      setMockQueryResult('SELECT * FROM user_profiles WHERE user_id', [])
      const newUser = {
        user_id: 'user-123',
        stripe_customer_id: null,
        is_pro: false,
      }
      setMockQueryResult('INSERT INTO user_profiles', [newUser])
      setMockQueryResult('UPDATE user_profiles SET stripe_customer_id', [newUser])

      const req = createMockRequest('POST', '/api/subscription', {
        headers: { 'x-user-id': 'user-123' },
        body: { action: 'create-checkout' },
      })

      const response = await subscriptionHandler(req, mockContext as never)

      expect(response.status).toBe(200)
      expect(wasQueryMade('INSERT INTO user_profiles')).toBe(true)
    })

    it('should return 500 when price not configured', async () => {
      clearMockEnv()
      setMockEnv('STRIPE_SECRET_KEY', 'sk_test_123')
      // Don't set STRIPE_PRO_PRICE_ID

      const mockUser = {
        user_id: 'user-123',
        stripe_customer_id: 'cus_123',
        is_pro: false,
      }
      setMockQueryResult('SELECT * FROM user_profiles', [mockUser])

      const req = createMockRequest('POST', '/api/subscription', {
        headers: { 'x-user-id': 'user-123' },
        body: { action: 'create-checkout' },
      })

      const response = await subscriptionHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(500)
      expect(data.error).toBe('Price not configured')
    })
  })

  describe('POST /api/subscription - create-portal', () => {
    it('should create billing portal session', async () => {
      const mockUser = {
        user_id: 'user-123',
        stripe_customer_id: 'cus_123',
      }
      setMockQueryResult('SELECT stripe_customer_id', [mockUser])

      const req = createMockRequest('POST', '/api/subscription', {
        headers: { 'x-user-id': 'user-123' },
        body: { action: 'create-portal' },
      })

      const response = await subscriptionHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.url).toBe(mockStripeResponses.portalSession.url)
      expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_123',
          return_url: 'https://example.com/dashboard',
        })
      )
    })

    it('should return 404 when no subscription found', async () => {
      setMockQueryResult('SELECT stripe_customer_id', [])

      const req = createMockRequest('POST', '/api/subscription', {
        headers: { 'x-user-id': 'user-123' },
        body: { action: 'create-portal' },
      })

      const response = await subscriptionHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(404)
      expect(data.error).toBe('No subscription found')
    })

    it('should return 404 when customer has no Stripe ID', async () => {
      const mockUser = {
        user_id: 'user-123',
        stripe_customer_id: null,
      }
      setMockQueryResult('SELECT stripe_customer_id', [mockUser])

      const req = createMockRequest('POST', '/api/subscription', {
        headers: { 'x-user-id': 'user-123' },
        body: { action: 'create-portal' },
      })

      const response = await subscriptionHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(404)
      expect(data.error).toBe('No subscription found')
    })
  })

  describe('POST /api/subscription - invalid action', () => {
    it('should return 400 for unknown action', async () => {
      const req = createMockRequest('POST', '/api/subscription', {
        headers: { 'x-user-id': 'user-123' },
        body: { action: 'unknown-action' },
      })

      const response = await subscriptionHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid action')
    })
  })

  describe('unsupported methods', () => {
    it('should return 405 for PUT method', async () => {
      const req = createMockRequest('PUT', '/api/subscription', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await subscriptionHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(405)
      expect(data.error).toBe('Method not allowed')
    })

    it('should return 405 for DELETE method', async () => {
      const req = createMockRequest('DELETE', '/api/subscription', {
        headers: { 'x-user-id': 'user-123' },
      })

      const response = await subscriptionHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(405)
      expect(data.error).toBe('Method not allowed')
    })
  })

  describe('error handling', () => {
    it('should return 500 on Stripe API error', async () => {
      const mockUser = {
        user_id: 'user-123',
        stripe_customer_id: 'cus_123',
        is_pro: false,
      }
      setMockQueryResult('SELECT * FROM user_profiles', [mockUser])
      mockStripe.checkout.sessions.create.mockRejectedValueOnce(new Error('Stripe error'))

      const req = createMockRequest('POST', '/api/subscription', {
        headers: { 'x-user-id': 'user-123' },
        body: { action: 'create-checkout' },
      })

      const response = await subscriptionHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})
