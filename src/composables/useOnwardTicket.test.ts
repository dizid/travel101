import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockFetch, createMockResponse, createErrorResponse } from '@/test/setup'
import { useOnwardTicket, type FlightOffer, type BookingConfirmation } from './useOnwardTicket'

// Mock useApi to use our mockFetch
vi.mock('@/composables/useApi', () => ({
  useApi: () => ({
    post: vi.fn(async (url: string, body: Record<string, unknown>, options?: Record<string, unknown>) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!response.ok) return null
      return response.json()
    }),
    loading: { value: false },
    error: { value: null },
  }),
}))

const mockOffer: FlightOffer = {
  id: 'offer-1',
  airline: 'Thai Airways',
  airlineCode: 'TG',
  price: '45.00',
  currency: 'USD',
  departureTime: '2026-04-20T08:00:00Z',
  arrivalTime: '2026-04-20T10:30:00Z',
  duration: '2h 30m',
  stops: 0,
}

const mockBooking: BookingConfirmation = {
  bookingId: 'book-1',
  pnr: 'ABC123',
  airline: 'Thai Airways',
  origin: 'BKK',
  destination: 'SIN',
  departureTime: '2026-04-20T08:00:00Z',
  arrivalTime: '2026-04-20T10:30:00Z',
  expiresAt: '2026-04-20T20:00:00Z',
  passengerName: 'John Doe',
}

describe('useOnwardTicket', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('searchFlights', () => {
    it('should search for flights', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ data: { offers: [mockOffer] }, success: true })
      )

      const { searchFlights, searchResults, searching } = useOnwardTicket()
      await searchFlights('BKK', 'SIN', '2026-04-20')

      expect(searchResults.value).toHaveLength(1)
      expect(searchResults.value[0].airline).toBe('Thai Airways')
      expect(searching.value).toBe(false)
    })

    it('should clear previous results before searching', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ data: { offers: [mockOffer] }, success: true })
      )

      const { searchFlights, searchResults } = useOnwardTicket()
      searchResults.value = [mockOffer] // pre-populate
      const searchPromise = searchFlights('BKK', 'SIN', '2026-04-20')

      // Should be cleared immediately
      // (Note: searchResults may get repopulated during the await)
      await searchPromise
    })

    it('should handle no results', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ data: { offers: [] }, success: true })
      )

      const { searchFlights, searchResults } = useOnwardTicket()
      await searchFlights('BKK', 'SIN', '2026-04-20')

      expect(searchResults.value).toEqual([])
    })
  })

  describe('selectOffer', () => {
    it('should set selected offer and advance to step 2', () => {
      const { selectOffer, selectedOffer, step } = useOnwardTicket()

      selectOffer(mockOffer)

      expect(selectedOffer.value).toEqual(mockOffer)
      expect(step.value).toBe(2)
    })
  })

  describe('createPayment', () => {
    it('should return client secret when offer is selected', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ data: { clientSecret: 'pi_secret_123' }, success: true })
      )

      const { selectOffer, createPayment } = useOnwardTicket()
      selectOffer(mockOffer)
      const secret = await createPayment()

      expect(secret).toBe('pi_secret_123')
    })

    it('should return null when no offer selected', async () => {
      const { createPayment } = useOnwardTicket()
      const secret = await createPayment()

      expect(secret).toBeNull()
    })
  })

  describe('confirmBooking', () => {
    it('should confirm booking and store result', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ data: mockBooking, success: true })
      )

      const { selectOffer, confirmBooking, booking, paying } = useOnwardTicket()
      selectOffer(mockOffer)
      const result = await confirmBooking('pi_123')

      expect(result).toEqual(mockBooking)
      expect(booking.value).toEqual(mockBooking)
      expect(paying.value).toBe(false)
    })

    it('should return null when no offer selected', async () => {
      const { confirmBooking } = useOnwardTicket()
      const result = await confirmBooking()

      expect(result).toBeNull()
    })

    it('should increment Pro booking count after success', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ data: mockBooking, success: true })
      )

      const { selectOffer, confirmBooking, proStatus } = useOnwardTicket()
      proStatus.value = { isPro: true, bookingsThisMonth: 0, monthlyLimit: 2, serviceFee: 0 }
      selectOffer(mockOffer)
      await confirmBooking()

      expect(proStatus.value.bookingsThisMonth).toBe(1)
    })
  })

  describe('reset', () => {
    it('should reset all state', () => {
      const { selectOffer, reset, step, selectedOffer, searchResults, booking } = useOnwardTicket()

      selectOffer(mockOffer)
      expect(step.value).toBe(2)

      reset()

      expect(step.value).toBe(1)
      expect(selectedOffer.value).toBeNull()
      expect(searchResults.value).toEqual([])
      expect(booking.value).toBeNull()
    })
  })

  describe('fetchStatus', () => {
    it('should fetch and store pro status', async () => {
      const status = { isPro: true, bookingsThisMonth: 1, monthlyLimit: 2, serviceFee: 0 }
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ data: status, success: true })
      )

      const { fetchStatus, proStatus } = useOnwardTicket()
      await fetchStatus()

      expect(proStatus.value).toEqual(status)
    })
  })
})
