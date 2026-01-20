import { vi } from 'vitest'

/**
 * Mock Stripe API responses
 */
export const mockStripeResponses = {
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

/**
 * Mock Stripe client
 */
export const mockStripe = {
  customers: {
    create: vi.fn().mockResolvedValue(mockStripeResponses.customer),
    retrieve: vi.fn().mockResolvedValue(mockStripeResponses.customer),
    update: vi.fn().mockResolvedValue(mockStripeResponses.customer),
    list: vi.fn().mockResolvedValue({ data: [mockStripeResponses.customer] }),
  },
  checkout: {
    sessions: {
      create: vi.fn().mockResolvedValue(mockStripeResponses.checkoutSession),
      retrieve: vi.fn().mockResolvedValue(mockStripeResponses.checkoutSession),
    },
  },
  billingPortal: {
    sessions: {
      create: vi.fn().mockResolvedValue(mockStripeResponses.portalSession),
    },
  },
  subscriptions: {
    retrieve: vi.fn().mockResolvedValue(mockStripeResponses.subscription),
    update: vi.fn().mockResolvedValue(mockStripeResponses.subscription),
    cancel: vi.fn().mockResolvedValue({ ...mockStripeResponses.subscription, status: 'canceled' }),
  },
  webhooks: {
    constructEvent: vi.fn(),
  },
}

/**
 * Create a mock Stripe webhook event
 */
export function createMockWebhookEvent(
  type: string,
  data: Record<string, unknown>
) {
  return {
    id: `evt_mock_${Date.now()}`,
    type,
    data: { object: data },
    created: Math.floor(Date.now() / 1000),
    livemode: false,
  }
}

/**
 * Common webhook event types
 */
export const webhookEvents = {
  checkoutCompleted: (userId: string, subscriptionId: string) =>
    createMockWebhookEvent('checkout.session.completed', {
      metadata: { user_id: userId },
      subscription: subscriptionId,
      customer: 'cus_mock123',
    }),

  subscriptionUpdated: (status: string) =>
    createMockWebhookEvent('customer.subscription.updated', {
      id: 'sub_mock123',
      status,
      customer: 'cus_mock123',
      current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
    }),

  subscriptionDeleted: () =>
    createMockWebhookEvent('customer.subscription.deleted', {
      id: 'sub_mock123',
      customer: 'cus_mock123',
    }),

  invoicePaymentFailed: () =>
    createMockWebhookEvent('invoice.payment_failed', {
      id: 'in_mock123',
      customer: 'cus_mock123',
      subscription: 'sub_mock123',
    }),
}

/**
 * Mock the Stripe module
 */
vi.mock('stripe', () => ({
  default: vi.fn(() => mockStripe),
}))

/**
 * Reset all Stripe mocks
 */
export function resetStripeMocks(): void {
  mockStripe.customers.create.mockReset().mockResolvedValue(mockStripeResponses.customer)
  mockStripe.customers.retrieve.mockReset().mockResolvedValue(mockStripeResponses.customer)
  mockStripe.customers.update.mockReset().mockResolvedValue(mockStripeResponses.customer)
  mockStripe.customers.list.mockReset().mockResolvedValue({ data: [mockStripeResponses.customer] })
  mockStripe.checkout.sessions.create.mockReset().mockResolvedValue(mockStripeResponses.checkoutSession)
  mockStripe.billingPortal.sessions.create.mockReset().mockResolvedValue(mockStripeResponses.portalSession)
  mockStripe.subscriptions.retrieve.mockReset().mockResolvedValue(mockStripeResponses.subscription)
  mockStripe.webhooks.constructEvent.mockReset()
}

export default {
  mockStripe,
  mockStripeResponses,
  createMockWebhookEvent,
  webhookEvents,
  resetStripeMocks,
}
