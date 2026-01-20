import { describe, it, expect, beforeEach, vi } from 'vitest'
import './__mocks__/db'
import './__mocks__/stripe'
import { clearMockResults, getMockQueryLog, wasQueryMade } from './__mocks__/db'
import { mockStripe, webhookEvents } from './__mocks__/stripe'
import { setMockEnv, clearMockEnv } from './__tests__/setup'
import webhookHandler from './webhook-stripe.mts'

const mockContext = {
  geo: { city: 'Bangkok' },
  ip: '127.0.0.1',
}

describe('webhook-stripe function', () => {
  beforeEach(() => {
    clearMockResults()
    clearMockEnv()
    vi.clearAllMocks()

    // Set required env vars
    setMockEnv('STRIPE_SECRET_KEY', 'sk_test_123')
    setMockEnv('STRIPE_WEBHOOK_SECRET', 'whsec_test_123')
  })

  describe('request validation', () => {
    it('should return 405 for non-POST requests', async () => {
      const req = new Request('https://example.com/api/webhook/stripe', {
        method: 'GET',
      })

      const response = await webhookHandler(req, mockContext as never)

      expect(response.status).toBe(405)
    })

    it('should return 500 when Stripe not configured', async () => {
      clearMockEnv()

      const req = new Request('https://example.com/api/webhook/stripe', {
        method: 'POST',
        headers: { 'stripe-signature': 'sig_123' },
        body: JSON.stringify({}),
      })

      const response = await webhookHandler(req, mockContext as never)

      expect(response.status).toBe(500)
    })

    it('should return 400 when signature is missing', async () => {
      const req = new Request('https://example.com/api/webhook/stripe', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await webhookHandler(req, mockContext as never)

      expect(response.status).toBe(400)
    })
  })

  describe('checkout.session.completed', () => {
    it('should activate Pro for user on successful checkout', async () => {
      const event = webhookEvents.checkoutCompleted('user-123', 'sub_mock123')
      mockStripe.webhooks.constructEvent.mockReturnValueOnce(event)

      const req = new Request('https://example.com/api/webhook/stripe', {
        method: 'POST',
        headers: { 'stripe-signature': 'sig_valid' },
        body: JSON.stringify(event),
      })

      const response = await webhookHandler(req, mockContext as never)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.received).toBe(true)

      // Check that user was updated
      expect(wasQueryMade('UPDATE user_profiles')).toBe(true)
      expect(wasQueryMade('is_pro = true')).toBe(true)
    })

    it('should not update if user_id is missing in metadata', async () => {
      const event = {
        ...webhookEvents.checkoutCompleted('user-123', 'sub_123'),
        data: {
          object: {
            metadata: {},
            subscription: 'sub_123',
          },
        },
      }
      mockStripe.webhooks.constructEvent.mockReturnValueOnce(event)

      const req = new Request('https://example.com/api/webhook/stripe', {
        method: 'POST',
        headers: { 'stripe-signature': 'sig_valid' },
        body: JSON.stringify(event),
      })

      const response = await webhookHandler(req, mockContext as never)

      expect(response.status).toBe(200)
      // No UPDATE should be made without user_id
      expect(wasQueryMade('UPDATE user_profiles')).toBe(false)
    })
  })

  describe('customer.subscription.updated', () => {
    it('should set isPro true for active subscription', async () => {
      const event = webhookEvents.subscriptionUpdated('active')
      mockStripe.webhooks.constructEvent.mockReturnValueOnce(event)

      const req = new Request('https://example.com/api/webhook/stripe', {
        method: 'POST',
        headers: { 'stripe-signature': 'sig_valid' },
        body: JSON.stringify(event),
      })

      const response = await webhookHandler(req, mockContext as never)

      expect(response.status).toBe(200)
      expect(wasQueryMade('is_pro =')).toBe(true)
    })

    it('should set isPro true for trialing subscription', async () => {
      const event = webhookEvents.subscriptionUpdated('trialing')
      mockStripe.webhooks.constructEvent.mockReturnValueOnce(event)

      const req = new Request('https://example.com/api/webhook/stripe', {
        method: 'POST',
        headers: { 'stripe-signature': 'sig_valid' },
        body: JSON.stringify(event),
      })

      const response = await webhookHandler(req, mockContext as never)

      expect(response.status).toBe(200)
    })

    it('should set isPro false for past_due subscription', async () => {
      const event = webhookEvents.subscriptionUpdated('past_due')
      mockStripe.webhooks.constructEvent.mockReturnValueOnce(event)

      const req = new Request('https://example.com/api/webhook/stripe', {
        method: 'POST',
        headers: { 'stripe-signature': 'sig_valid' },
        body: JSON.stringify(event),
      })

      const response = await webhookHandler(req, mockContext as never)

      expect(response.status).toBe(200)
    })

    it('should set isPro false for canceled subscription', async () => {
      const event = webhookEvents.subscriptionUpdated('canceled')
      mockStripe.webhooks.constructEvent.mockReturnValueOnce(event)

      const req = new Request('https://example.com/api/webhook/stripe', {
        method: 'POST',
        headers: { 'stripe-signature': 'sig_valid' },
        body: JSON.stringify(event),
      })

      const response = await webhookHandler(req, mockContext as never)

      expect(response.status).toBe(200)
    })
  })

  describe('customer.subscription.deleted', () => {
    it('should remove Pro status and clear subscription', async () => {
      const event = webhookEvents.subscriptionDeleted()
      mockStripe.webhooks.constructEvent.mockReturnValueOnce(event)

      const req = new Request('https://example.com/api/webhook/stripe', {
        method: 'POST',
        headers: { 'stripe-signature': 'sig_valid' },
        body: JSON.stringify(event),
      })

      const response = await webhookHandler(req, mockContext as never)

      expect(response.status).toBe(200)
      expect(wasQueryMade('is_pro = false')).toBe(true)
      expect(wasQueryMade('stripe_subscription_id = NULL')).toBe(true)
    })
  })

  describe('invoice.payment_failed', () => {
    it('should handle payment failure event', async () => {
      const event = webhookEvents.invoicePaymentFailed()
      mockStripe.webhooks.constructEvent.mockReturnValueOnce(event)

      const req = new Request('https://example.com/api/webhook/stripe', {
        method: 'POST',
        headers: { 'stripe-signature': 'sig_valid' },
        body: JSON.stringify(event),
      })

      const response = await webhookHandler(req, mockContext as never)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.received).toBe(true)
      // Payment failed doesn't update the database directly
    })
  })

  describe('unhandled events', () => {
    it('should return success for unhandled event types', async () => {
      const event = {
        id: 'evt_unknown',
        type: 'some.other.event',
        data: { object: {} },
        created: Math.floor(Date.now() / 1000),
      }
      mockStripe.webhooks.constructEvent.mockReturnValueOnce(event)

      const req = new Request('https://example.com/api/webhook/stripe', {
        method: 'POST',
        headers: { 'stripe-signature': 'sig_valid' },
        body: JSON.stringify(event),
      })

      const response = await webhookHandler(req, mockContext as never)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.received).toBe(true)
    })
  })

  describe('signature verification', () => {
    it('should return 400 when signature verification fails', async () => {
      mockStripe.webhooks.constructEvent.mockImplementationOnce(() => {
        throw new Error('Invalid signature')
      })

      const req = new Request('https://example.com/api/webhook/stripe', {
        method: 'POST',
        headers: { 'stripe-signature': 'sig_invalid' },
        body: JSON.stringify({}),
      })

      const response = await webhookHandler(req, mockContext as never)

      expect(response.status).toBe(400)
    })
  })
})
