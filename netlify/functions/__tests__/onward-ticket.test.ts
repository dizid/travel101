import { describe, it, expect, beforeEach, vi } from 'vitest'
import '../__mocks__/db'
import { setMockQueryResult, clearMockResults } from '../__mocks__/db'
import { setMockEnv, clearMockEnv, mockFetch } from './setup.js'
import { createMockRequest, createMockContext, parseResponse } from './helpers.js'

// Mock Stripe with paymentIntents and refunds
const mockPaymentIntent = {
  id: 'pi_mock123',
  client_secret: 'pi_mock123_secret_abc',
  status: 'succeeded',
  amount: 1200,
  currency: 'usd',
}

const mockStripe = {
  paymentIntents: {
    create: vi.fn().mockResolvedValue(mockPaymentIntent),
    retrieve: vi.fn().mockResolvedValue(mockPaymentIntent),
  },
  refunds: {
    create: vi.fn().mockResolvedValue({ id: 'ref_mock123' }),
  },
}

vi.mock('stripe', () => ({
  default: vi.fn(() => mockStripe),
}))

// Mock auth
vi.mock('../lib/auth.mts', () => ({
  requireAuth: vi.fn().mockResolvedValue('user-123'),
  validateAuth: vi.fn().mockResolvedValue({ userId: 'user-123' }),
}))

import handler from '../onward-ticket.mts'
import { requireAuth, validateAuth } from '../lib/auth.mts'

const mockContext = createMockContext()

// Reusable Duffel mock responses
const mockOfferRequestResponse = {
  data: { id: 'orq_mock123' },
}

const mockOffersResponse = {
  data: [{
    id: 'off_abc123',
    owner: { name: 'Thai Airways', iata_code: 'TG' },
    total_amount: '45.50',
    total_currency: 'USD',
    payment_requirements: { requires_instant_payment: false },
    slices: [{
      duration: 'PT2H30M',
      segments: [{
        origin: { iata_code: 'BKK' },
        destination: { iata_code: 'KUL' },
        departing_at: '2026-08-01T09:00:00',
        arriving_at: '2026-08-01T11:30:00',
        operating_carrier: { name: 'Thai Airways' },
        marketing_carrier_flight_number: 'TG415',
        duration: 'PT2H30M',
      }],
    }],
  }],
}

const mockOfferDetailResponse = {
  data: {
    id: 'off_abc123',
    passengers: [{ id: 'pas_mock123' }],
  },
}

const mockOrderResponse = {
  data: {
    id: 'ord_mock123',
    booking_reference: 'ABC123',
    owner: { name: 'Thai Airways' },
    slices: [{
      segments: [{
        origin: { iata_code: 'BKK' },
        destination: { iata_code: 'KUL' },
        departing_at: '2026-08-01T09:00:00',
        arriving_at: '2026-08-01T11:30:00',
      }],
    }],
    payment_status: { payment_required_by: '2026-08-10T00:00:00' },
  },
}

const validPassenger = {
  given_name: 'John',
  family_name: 'Doe',
  born_on: '1990-01-15',
  gender: 'm' as const,
  email: 'john@example.com',
  phone: '+66812345678',
}

describe('onward-ticket function', () => {
  beforeEach(() => {
    clearMockResults()
    clearMockEnv()
    vi.clearAllMocks()

    setMockEnv('STRIPE_SECRET_KEY', 'sk_test_123')
    setMockEnv('DUFFEL_API_TOKEN', 'duffel_test_token')

    // Reset auth mocks to defaults
    vi.mocked(requireAuth).mockResolvedValue('user-123')
    vi.mocked(validateAuth).mockResolvedValue({ userId: 'user-123' } as any)

    // Reset Stripe mocks
    mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent)
    mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent)
    mockStripe.refunds.create.mockResolvedValue({ id: 'ref_mock123' })
  })

  // --- Request validation ---

  describe('request validation', () => {
    it('returns 405 for non-POST requests', async () => {
      const req = createMockRequest('GET', '/api/onward-ticket')
      const res = await handler(req, mockContext)
      expect(res.status).toBe(405)
    })

    it('returns 400 for invalid JSON body', async () => {
      const req = new Request('http://localhost/api/onward-ticket', {
        method: 'POST',
        body: 'not json{{{',
      })
      const res = await handler(req, mockContext)
      expect(res.status).toBe(400)
      const data = await parseResponse(res)
      expect(data.error).toBe('Invalid JSON body')
    })

    it('returns 400 when action field is missing', async () => {
      const req = createMockRequest('POST', '/api/onward-ticket', { body: { foo: 'bar' } })
      const res = await handler(req, mockContext)
      expect(res.status).toBe(400)
      const data = await parseResponse(res)
      expect(data.error).toBe('Missing action field')
    })

    it('returns 400 for invalid action', async () => {
      const req = createMockRequest('POST', '/api/onward-ticket', { body: { action: 'invalid' } })
      const res = await handler(req, mockContext)
      expect(res.status).toBe(400)
    })
  })

  // --- Search ---

  describe('action: search', () => {
    it('returns 400 when origin/destination/date missing', async () => {
      const req = createMockRequest('POST', '/api/onward-ticket', {
        body: { action: 'search', origin: 'BKK' },
      })
      const res = await handler(req, mockContext)
      expect(res.status).toBe(400)
      const data = await parseResponse(res)
      expect(data.error).toContain('Missing required fields')
    })

    it('returns 400 for invalid airport code', async () => {
      const req = createMockRequest('POST', '/api/onward-ticket', {
        body: { action: 'search', origin: 'bkk', destination: 'KUL', date: '2026-08-01' },
      })
      const res = await handler(req, mockContext)
      expect(res.status).toBe(400)
      const data = await parseResponse(res)
      expect(data.error).toContain('Invalid airport code')
    })

    it('returns 400 for invalid date format', async () => {
      const req = createMockRequest('POST', '/api/onward-ticket', {
        body: { action: 'search', origin: 'BKK', destination: 'KUL', date: '01-08-2026' },
      })
      const res = await handler(req, mockContext)
      expect(res.status).toBe(400)
      const data = await parseResponse(res)
      expect(data.error).toContain('Invalid date format')
    })

    it('returns cached results when available', async () => {
      const cachedOffers = { offers: [{ id: 'off_cached' }] }
      setMockQueryResult('ai_cache', [{ data: cachedOffers }])

      const req = createMockRequest('POST', '/api/onward-ticket', {
        body: { action: 'search', origin: 'BKK', destination: 'KUL', date: '2026-08-01' },
      })
      const res = await handler(req, mockContext)
      expect(res.status).toBe(200)
      const data = await parseResponse(res)
      // jsonResponse wraps as { data: ..., success: true }
      expect(data.data).toEqual(cachedOffers)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('calls Duffel API and returns offers on cache miss', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockOfferRequestResponse) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockOffersResponse) })

      const req = createMockRequest('POST', '/api/onward-ticket', {
        body: { action: 'search', origin: 'BKK', destination: 'KUL', date: '2026-08-01' },
      })
      const res = await handler(req, mockContext)
      expect(res.status).toBe(200)
      const data = await parseResponse(res)
      expect(data.data.offers).toHaveLength(1)
      expect(data.data.offers[0].id).toBe('off_abc123')
      expect(data.data.offers[0].airline).toBe('Thai Airways')
      expect(data.data.offers[0].price).toBe('45.50')
      expect(data.data.offers[0].stops).toBe(0)
    })

    it('simplifies offer segments correctly', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockOfferRequestResponse) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockOffersResponse) })

      const req = createMockRequest('POST', '/api/onward-ticket', {
        body: { action: 'search', origin: 'BKK', destination: 'KUL', date: '2026-08-01' },
      })
      const res = await handler(req, mockContext)
      const data = await parseResponse(res)
      const segment = data.data.offers[0].segments[0]
      expect(segment.origin).toBe('BKK')
      expect(segment.destination).toBe('KUL')
      expect(segment.flightNumber).toBe('TG415')
    })

    it('filters out offers requiring instant payment', async () => {
      const offersWithInstantPayment = {
        data: [
          ...mockOffersResponse.data,
          {
            id: 'off_instant',
            owner: { name: 'Budget Air' },
            total_amount: '25.00',
            total_currency: 'USD',
            payment_requirements: { requires_instant_payment: true },
            slices: [{ segments: [{ departing_at: '', arriving_at: '' }] }],
          },
        ],
      }

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockOfferRequestResponse) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(offersWithInstantPayment) })

      const req = createMockRequest('POST', '/api/onward-ticket', {
        body: { action: 'search', origin: 'BKK', destination: 'KUL', date: '2026-08-01' },
      })
      const res = await handler(req, mockContext)
      const data = await parseResponse(res)
      expect(data.data.offers).toHaveLength(1)
      expect(data.data.offers[0].id).toBe('off_abc123')
    })
  })

  // --- Status ---

  describe('action: status', () => {
    it('returns default status for unauthenticated users', async () => {
      vi.mocked(validateAuth).mockResolvedValue({ userId: null } as any)

      const req = createMockRequest('POST', '/api/onward-ticket', {
        body: { action: 'status' },
      })
      const res = await handler(req, mockContext)
      expect(res.status).toBe(200)
      const data = await parseResponse(res)
      expect(data.data.isPro).toBe(false)
      expect(data.data.bookingsThisMonth).toBe(0)
      expect(data.data.monthlyLimit).toBe(2)
      expect(data.data.serviceFee).toBe(1200)
    })

    it('returns Pro status and booking count for authenticated user', async () => {
      setMockQueryResult('user_profiles', [{ is_pro: true }])
      setMockQueryResult('onward_bookings', [{ count: 1 }])

      const req = createMockRequest('POST', '/api/onward-ticket', {
        body: { action: 'status' },
      })
      const res = await handler(req, mockContext)
      expect(res.status).toBe(200)
      const data = await parseResponse(res)
      expect(data.data.isPro).toBe(true)
      expect(data.data.bookingsThisMonth).toBe(1)
    })

    it('returns non-Pro status for free user', async () => {
      setMockQueryResult('user_profiles', [{ is_pro: false }])

      const req = createMockRequest('POST', '/api/onward-ticket', {
        body: { action: 'status' },
      })
      const res = await handler(req, mockContext)
      const data = await parseResponse(res)
      expect(data.data.isPro).toBe(false)
      expect(data.data.bookingsThisMonth).toBe(0)
    })
  })

  // --- Create Payment ---

  describe('action: create-payment', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(requireAuth).mockRejectedValue(new Response(JSON.stringify({ error: 'No authentication provided' }), { status: 401 }))

      const req = createMockRequest('POST', '/api/onward-ticket', {
        body: { action: 'create-payment' },
      })
      const res = await handler(req, mockContext)
      expect(res.status).toBe(401)
    })

    it('creates PaymentIntent with correct amount', async () => {
      const req = createMockRequest('POST', '/api/onward-ticket', {
        body: { action: 'create-payment' },
        headers: { 'x-user-id': 'user-123' },
      })
      const res = await handler(req, mockContext)
      expect(res.status).toBe(200)
      const data = await parseResponse(res)
      expect(data.data.clientSecret).toBe('pi_mock123_secret_abc')
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 1200,
        currency: 'usd',
        metadata: { user_id: 'user-123', type: 'onward_ticket' },
      })
    })
  })

  // --- Book ---

  describe('action: book', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(requireAuth).mockRejectedValue(new Response(JSON.stringify({ error: 'No authentication provided' }), { status: 401 }))

      const req = createMockRequest('POST', '/api/onward-ticket', {
        body: { action: 'book', offerId: 'off_abc123', passenger: validPassenger },
      })
      const res = await handler(req, mockContext)
      expect(res.status).toBe(401)
    })

    it('returns 400 when offerId is missing', async () => {
      const req = createMockRequest('POST', '/api/onward-ticket', {
        body: { action: 'book', passenger: validPassenger },
        headers: { 'x-user-id': 'user-123' },
      })
      const res = await handler(req, mockContext)
      expect(res.status).toBe(400)
    })

    it('returns 400 when passenger is missing', async () => {
      const req = createMockRequest('POST', '/api/onward-ticket', {
        body: { action: 'book', offerId: 'off_abc123' },
        headers: { 'x-user-id': 'user-123' },
      })
      const res = await handler(req, mockContext)
      expect(res.status).toBe(400)
    })

    it('returns 400 for invalid email', async () => {
      const req = createMockRequest('POST', '/api/onward-ticket', {
        body: {
          action: 'book',
          offerId: 'off_abc123',
          passenger: { ...validPassenger, email: 'not-an-email' },
        },
        headers: { 'x-user-id': 'user-123' },
      })
      const res = await handler(req, mockContext)
      expect(res.status).toBe(400)
      const data = await parseResponse(res)
      expect(data.error).toContain('Invalid email')
    })

    it('returns 400 for invalid date of birth', async () => {
      const req = createMockRequest('POST', '/api/onward-ticket', {
        body: {
          action: 'book',
          offerId: 'off_abc123',
          passenger: { ...validPassenger, born_on: '15-01-1990' },
        },
        headers: { 'x-user-id': 'user-123' },
      })
      const res = await handler(req, mockContext)
      expect(res.status).toBe(400)
      const data = await parseResponse(res)
      expect(data.error).toContain('Invalid date of birth')
    })

    it('returns 400 for invalid offer ID format', async () => {
      const req = createMockRequest('POST', '/api/onward-ticket', {
        body: {
          action: 'book',
          offerId: 'invalid_id',
          passenger: validPassenger,
        },
        headers: { 'x-user-id': 'user-123' },
      })
      const res = await handler(req, mockContext)
      expect(res.status).toBe(400)
      const data = await parseResponse(res)
      expect(data.error).toContain('Invalid offer ID')
    })

    describe('Pro path', () => {
      beforeEach(() => {
        setMockQueryResult('user_profiles', [{ is_pro: true }])
        setMockQueryResult('onward_bookings', [{ count: 0 }])
      })

      it('creates booking without payment for Pro user within limit', async () => {
        mockFetch
          .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockOfferDetailResponse) })
          .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockOrderResponse) })

        const req = createMockRequest('POST', '/api/onward-ticket', {
          body: { action: 'book', offerId: 'off_abc123', passenger: validPassenger },
          headers: { 'x-user-id': 'user-123' },
        })
        const res = await handler(req, mockContext)
        expect(res.status).toBe(200)
        const data = await parseResponse(res)
        expect(data.data.pnr).toBe('ABC123')
        expect(data.data.airline).toBe('Thai Airways')
        expect(data.data.origin).toBe('BKK')
        expect(data.data.destination).toBe('KUL')
        expect(data.data.passengerName).toBe('John Doe')
        expect(mockStripe.paymentIntents.create).not.toHaveBeenCalled()
      })

      it('returns 403 when Pro monthly limit reached without payment', async () => {
        setMockQueryResult('onward_bookings', [{ count: 2 }])

        const req = createMockRequest('POST', '/api/onward-ticket', {
          body: { action: 'book', offerId: 'off_abc123', passenger: validPassenger },
          headers: { 'x-user-id': 'user-123' },
        })
        const res = await handler(req, mockContext)
        expect(res.status).toBe(403)
        const data = await parseResponse(res)
        expect(data.error).toContain('limit reached')
      })
    })

    describe('Paid path', () => {
      beforeEach(() => {
        setMockQueryResult('user_profiles', [{ is_pro: false }])
      })

      it('returns 400 when paymentIntentId is missing for non-Pro', async () => {
        const req = createMockRequest('POST', '/api/onward-ticket', {
          body: { action: 'book', offerId: 'off_abc123', passenger: validPassenger },
          headers: { 'x-user-id': 'user-123' },
        })
        const res = await handler(req, mockContext)
        expect(res.status).toBe(400)
        const data = await parseResponse(res)
        expect(data.error).toContain('Payment required')
      })

      it('returns existing booking for idempotent request', async () => {
        setMockQueryResult('onward_bookings', [{
          duffel_order_id: 'ord_existing',
          pnr: 'XYZ789',
          airline: 'AirAsia',
          origin: 'BKK',
          destination: 'KUL',
          departure_time: '2026-08-01T09:00:00',
          arrival_time: '2026-08-01T11:30:00',
          hold_expires_at: '2026-08-10T00:00:00',
          passenger_name: 'John Doe',
        }])

        const req = createMockRequest('POST', '/api/onward-ticket', {
          body: {
            action: 'book',
            offerId: 'off_abc123',
            passenger: validPassenger,
            paymentIntentId: 'pi_existing',
          },
          headers: { 'x-user-id': 'user-123' },
        })
        const res = await handler(req, mockContext)
        expect(res.status).toBe(200)
        const data = await parseResponse(res)
        expect(data.data.pnr).toBe('XYZ789')
        expect(data.data.bookingId).toBe('ord_existing')
      })

      it('returns 400 when payment is not succeeded', async () => {
        clearMockResults()
        setMockQueryResult('user_profiles', [{ is_pro: false }])

        mockStripe.paymentIntents.retrieve.mockResolvedValue({
          ...mockPaymentIntent,
          status: 'requires_payment_method',
        })

        const req = createMockRequest('POST', '/api/onward-ticket', {
          body: {
            action: 'book',
            offerId: 'off_abc123',
            passenger: validPassenger,
            paymentIntentId: 'pi_mock123',
          },
          headers: { 'x-user-id': 'user-123' },
        })
        const res = await handler(req, mockContext)
        expect(res.status).toBe(400)
        const data = await parseResponse(res)
        expect(data.error).toContain('Payment not completed')
      })

      it('creates booking after successful payment', async () => {
        clearMockResults()
        setMockQueryResult('user_profiles', [{ is_pro: false }])

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockOfferDetailResponse) })
          .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockOrderResponse) })

        const req = createMockRequest('POST', '/api/onward-ticket', {
          body: {
            action: 'book',
            offerId: 'off_abc123',
            passenger: validPassenger,
            paymentIntentId: 'pi_mock123',
          },
          headers: { 'x-user-id': 'user-123' },
        })
        const res = await handler(req, mockContext)
        expect(res.status).toBe(200)
        const data = await parseResponse(res)
        expect(data.data.pnr).toBe('ABC123')
        expect(data.data.origin).toBe('BKK')
        expect(data.data.destination).toBe('KUL')
      })

      it('refunds Stripe when Duffel order creation fails on paid path', async () => {
        clearMockResults()
        setMockQueryResult('user_profiles', [{ is_pro: false }])

        mockFetch
          .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockOfferDetailResponse) })
          .mockResolvedValueOnce({ ok: false, status: 422, text: () => Promise.resolve('Order failed') })

        const req = createMockRequest('POST', '/api/onward-ticket', {
          body: {
            action: 'book',
            offerId: 'off_abc123',
            passenger: validPassenger,
            paymentIntentId: 'pi_mock123',
          },
          headers: { 'x-user-id': 'user-123' },
        })
        const res = await handler(req, mockContext)
        expect(res.status).toBe(500)
        const data = await parseResponse(res)
        expect(data.error).toContain('refunded')
        expect(mockStripe.refunds.create).toHaveBeenCalledWith({
          payment_intent: 'pi_mock123',
        })
      })
    })
  })
})
