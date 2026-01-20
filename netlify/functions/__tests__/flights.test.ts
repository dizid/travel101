import { describe, it, expect, beforeEach, vi } from 'vitest'
import '../__mocks__/db'
import { setMockQueryResult, clearMockResults, wasQueryMade } from '../__mocks__/db'
import { setMockEnv, clearMockEnv, mockFetch, createMockResponse } from './setup.js'
import { createMockRequest, parseResponse } from './helpers.js'

import flightsHandler from '../flights.mts'

const mockContext = {
  geo: { city: 'Bangkok' },
  ip: '127.0.0.1',
}

const mockKiwiApiResponse = {
  data: [
    {
      id: 'fl-kiwi-1',
      price: 450,
      currency: 'USD',
      local_departure: '2025-02-01T08:00:00',
      local_arrival: '2025-02-01T14:30:00',
      flyFrom: 'LHR',
      flyTo: 'BKK',
      cityFrom: 'London',
      cityTo: 'Bangkok',
      duration: { total: 39000 },
      route: [
        {
          local_departure: '2025-02-01T08:00:00',
          local_arrival: '2025-02-01T14:30:00',
          airline: 'TG',
          flight_no: '917',
          fly_duration: 39000,
          flyFrom: 'LHR',
          flyTo: 'BKK',
        },
      ],
      deep_link: 'https://kiwi.com/booking/fl-kiwi-1',
    },
  ],
}

describe('flights function', () => {
  beforeEach(() => {
    clearMockResults()
    clearMockEnv()
    vi.clearAllMocks()
    mockFetch.mockReset()
    setMockEnv('DATABASE_URL', 'postgresql://test:test@localhost/test')
  })

  describe('GET /api/flights - airports list', () => {
    it('should return list of Thai and international airports', async () => {
      const req = createMockRequest('GET', '/api/flights', {
        headers: {},
      })

      const response = await flightsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.thaiAirports).toBeDefined()
      expect(data.internationalAirports).toBeDefined()
      expect(Array.isArray(data.thaiAirports)).toBe(true)
      expect(Array.isArray(data.internationalAirports)).toBe(true)
    })

    it('should include BKK airport', async () => {
      const req = createMockRequest('GET', '/api/flights', {
        headers: {},
      })

      const response = await flightsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      const bkk = data.thaiAirports.find((a: { code: string }) => a.code === 'BKK')
      expect(bkk).toBeDefined()
      expect(bkk.city).toBe('Bangkok')
      expect(bkk.airport).toBe('Suvarnabhumi Airport')
    })

    it('should include CNX (Chiang Mai) airport', async () => {
      const req = createMockRequest('GET', '/api/flights', {
        headers: {},
      })

      const response = await flightsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      const cnx = data.thaiAirports.find((a: { code: string }) => a.code === 'CNX')
      expect(cnx).toBeDefined()
      expect(cnx.city).toBe('Chiang Mai')
    })

    it('should include major international airports', async () => {
      const req = createMockRequest('GET', '/api/flights', {
        headers: {},
      })

      const response = await flightsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      const codes = data.internationalAirports.map((a: { code: string }) => a.code)
      expect(codes).toContain('LHR')
      expect(codes).toContain('JFK')
      expect(codes).toContain('SIN')
      expect(codes).toContain('NRT')
    })
  })

  describe('POST /api/flights - flight search', () => {
    it('should return 400 when origin is missing', async () => {
      const req = createMockRequest('POST', '/api/flights', {
        headers: {},
        body: { destination: 'BKK', departureDate: '2025-02-01' },
      })

      const response = await flightsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.error).toContain('origin')
    })

    it('should return 400 when destination is missing', async () => {
      const req = createMockRequest('POST', '/api/flights', {
        headers: {},
        body: { origin: 'LHR', departureDate: '2025-02-01' },
      })

      const response = await flightsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.error).toContain('destination')
    })

    it('should return 400 when departureDate is missing', async () => {
      const req = createMockRequest('POST', '/api/flights', {
        headers: {},
        body: { origin: 'LHR', destination: 'BKK' },
      })

      const response = await flightsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.error).toContain('departureDate')
    })

    it('should return cached results when available', async () => {
      const cachedResponse = {
        flights: [{ id: 'cached-flight', price: 500 }],
        searchId: 'cached-search',
        currency: 'USD',
        cheapest: 500,
        fastest: 600,
      }
      setMockQueryResult('SELECT response_data FROM ai_cache', [{ response_data: cachedResponse }])

      const req = createMockRequest('POST', '/api/flights', {
        headers: {},
        body: {
          origin: 'LHR',
          destination: 'BKK',
          departureDate: '2025-02-01',
        },
      })

      const response = await flightsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.flights[0].id).toBe('cached-flight')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should generate mock flights when no API key is configured', async () => {
      setMockQueryResult('SELECT response_data FROM ai_cache', [])
      setMockQueryResult('INSERT INTO ai_cache', [])

      const req = createMockRequest('POST', '/api/flights', {
        headers: {},
        body: {
          origin: 'LHR',
          destination: 'BKK',
          departureDate: '2025-02-01',
        },
      })

      const response = await flightsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.flights).toBeDefined()
      expect(data.flights.length).toBeGreaterThan(0)
      expect(data.searchId).toBeDefined()
      expect(data.cheapest).toBeDefined()
      expect(data.fastest).toBeDefined()
    })

    it('should use Kiwi API when key is configured', async () => {
      setMockEnv('KIWI_API_KEY', 'test-kiwi-key')
      setMockQueryResult('SELECT response_data FROM ai_cache', [])
      setMockQueryResult('INSERT INTO ai_cache', [])
      mockFetch.mockResolvedValueOnce(createMockResponse(mockKiwiApiResponse))

      const req = createMockRequest('POST', '/api/flights', {
        headers: {},
        body: {
          origin: 'LHR',
          destination: 'BKK',
          departureDate: '2025-02-01',
        },
      })

      const response = await flightsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('tequila.kiwi.com'),
        expect.objectContaining({
          headers: expect.objectContaining({
            apikey: 'test-kiwi-key',
          }),
        })
      )
      expect(data.flights[0].price).toBe(450)
    })

    it('should fall back to mock data when Kiwi API fails', async () => {
      setMockEnv('KIWI_API_KEY', 'test-kiwi-key')
      setMockQueryResult('SELECT response_data FROM ai_cache', [])
      setMockQueryResult('INSERT INTO ai_cache', [])
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('API Error'),
      } as Response)

      const req = createMockRequest('POST', '/api/flights', {
        headers: {},
        body: {
          origin: 'LHR',
          destination: 'BKK',
          departureDate: '2025-02-01',
        },
      })

      const response = await flightsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.flights.length).toBeGreaterThan(0)
    })

    it('should cache search results', async () => {
      setMockQueryResult('SELECT response_data FROM ai_cache', [])
      setMockQueryResult('INSERT INTO ai_cache', [])

      const req = createMockRequest('POST', '/api/flights', {
        headers: {},
        body: {
          origin: 'LHR',
          destination: 'BKK',
          departureDate: '2025-02-01',
        },
      })

      await flightsHandler(req, mockContext as never)

      expect(wasQueryMade('INSERT INTO ai_cache')).toBe(true)
      expect(wasQueryMade('flights_LHR_BKK_2025-02-01_oneway_1_economy')).toBe(true)
    })

    it('should return search params in response', async () => {
      setMockQueryResult('SELECT response_data FROM ai_cache', [])
      setMockQueryResult('INSERT INTO ai_cache', [])

      const searchParams = {
        origin: 'LHR',
        destination: 'BKK',
        departureDate: '2025-02-01',
        adults: 2,
        cabinClass: 'business',
      }

      const req = createMockRequest('POST', '/api/flights', {
        headers: {},
        body: searchParams,
      })

      const response = await flightsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(data.searchParams.origin).toBe('LHR')
      expect(data.searchParams.destination).toBe('BKK')
      expect(data.searchParams.adults).toBe(2)
    })

    it('should include airport info for known airports', async () => {
      setMockQueryResult('SELECT response_data FROM ai_cache', [])
      setMockQueryResult('INSERT INTO ai_cache', [])

      const req = createMockRequest('POST', '/api/flights', {
        headers: {},
        body: {
          origin: 'LHR',
          destination: 'BKK',
          departureDate: '2025-02-01',
        },
      })

      const response = await flightsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      const flight = data.flights[0]
      expect(flight.origin.city).toBe('London')
      expect(flight.destination.city).toBe('Bangkok')
    })

    it('should handle return flights', async () => {
      setMockQueryResult('SELECT response_data FROM ai_cache', [])
      setMockQueryResult('INSERT INTO ai_cache', [])

      const req = createMockRequest('POST', '/api/flights', {
        headers: {},
        body: {
          origin: 'LHR',
          destination: 'BKK',
          departureDate: '2025-02-01',
          returnDate: '2025-02-15',
        },
      })

      const response = await flightsHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.flights).toBeDefined()
    })
  })

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      // No mock result set - will fail

      const req = createMockRequest('POST', '/api/flights', {
        headers: {},
        body: {
          origin: 'LHR',
          destination: 'BKK',
          departureDate: '2025-02-01',
        },
      })

      const response = await flightsHandler(req, mockContext as never)
      // Should still return 200 with mock data or 500 on error

      expect([200, 500]).toContain(response.status)
    })
  })
})
