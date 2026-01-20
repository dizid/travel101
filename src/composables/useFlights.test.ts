import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFlights, type Flight, type AirportsData, type FlightSearchResponse } from './useFlights'
import { mockFetch, createMockResponse } from '@/test/setup'

describe('useFlights', () => {
  const mockAirportsData: AirportsData = {
    thaiAirports: [
      { code: 'BKK', city: 'Bangkok', airport: 'Suvarnabhumi' },
      { code: 'DMK', city: 'Bangkok', airport: 'Don Mueang' },
      { code: 'CNX', city: 'Chiang Mai', airport: 'Chiang Mai International' },
    ],
    internationalAirports: [
      { code: 'SIN', city: 'Singapore', airport: 'Changi' },
      { code: 'HKG', city: 'Hong Kong', airport: 'Hong Kong International' },
    ],
  }

  const mockFlight: Flight = {
    id: 'flight-1',
    price: 5000,
    currency: 'THB',
    airlines: ['Thai Airways'],
    departureTime: '2024-07-01T08:00:00Z',
    arrivalTime: '2024-07-01T10:30:00Z',
    duration: 150,
    stops: 0,
    origin: { code: 'SIN', city: 'Singapore', airport: 'Changi' },
    destination: { code: 'BKK', city: 'Bangkok', airport: 'Suvarnabhumi' },
    bookingUrl: 'https://booking.example.com/flight-1',
    legs: [
      {
        departure: '2024-07-01T08:00:00Z',
        arrival: '2024-07-01T10:30:00Z',
        airline: 'Thai Airways',
        flightNumber: 'TG404',
        duration: 150,
        origin: 'SIN',
        destination: 'BKK',
      },
    ],
  }

  const mockSearchResponse: FlightSearchResponse = {
    flights: [
      mockFlight,
      { ...mockFlight, id: 'flight-2', price: 3500, duration: 180, stops: 1 },
      { ...mockFlight, id: 'flight-3', price: 8000, duration: 145, stops: 0 },
    ],
    searchId: 'search-123',
    currency: 'THB',
    cheapest: 3500,
    fastest: 145,
    searchParams: {
      origin: 'SIN',
      destination: 'BKK',
      departureDate: '2024-07-01',
    },
  }

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchAirports', () => {
    it('should fetch airport data', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockAirportsData))

      const { fetchAirports, airports } = useFlights()
      await fetchAirports()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/flights'),
        expect.any(Object)
      )
      expect(airports.value).toEqual(mockAirportsData)
    })
  })

  describe('searchFlights', () => {
    it('should search flights and store results', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSearchResponse))

      const { searchFlights, flights, searchId, searchParams } = useFlights()
      const result = await searchFlights({
        origin: 'SIN',
        destination: 'BKK',
        departureDate: '2024-07-01',
      })

      expect(result).toEqual(mockSearchResponse)
      expect(flights.value).toHaveLength(3)
      expect(searchId.value).toBe('search-123')
      expect(searchParams.value?.origin).toBe('SIN')
    })

    it('should search with all parameters', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSearchResponse))

      const { searchFlights } = useFlights()
      await searchFlights({
        origin: 'SIN',
        destination: 'BKK',
        departureDate: '2024-07-01',
        returnDate: '2024-07-10',
        adults: 2,
        children: 1,
        cabinClass: 'business',
        directOnly: true,
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('business'),
        })
      )
    })
  })

  describe('computed airports', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockAirportsData))
    })

    it('should return thaiAirports', async () => {
      const { fetchAirports, thaiAirports } = useFlights()
      await fetchAirports()

      expect(thaiAirports.value).toHaveLength(3)
      expect(thaiAirports.value[0].code).toBe('BKK')
    })

    it('should return internationalAirports', async () => {
      const { fetchAirports, internationalAirports } = useFlights()
      await fetchAirports()

      expect(internationalAirports.value).toHaveLength(2)
      expect(internationalAirports.value[0].code).toBe('SIN')
    })

    it('should return allAirports', async () => {
      const { fetchAirports, allAirports } = useFlights()
      await fetchAirports()

      expect(allAirports.value).toHaveLength(5)
    })
  })

  describe('computed flight results', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSearchResponse))
    })

    it('should return cheapestFlight', async () => {
      const { searchFlights, cheapestFlight } = useFlights()
      await searchFlights({
        origin: 'SIN',
        destination: 'BKK',
        departureDate: '2024-07-01',
      })

      expect(cheapestFlight.value?.price).toBe(3500)
    })

    it('should return fastestFlight', async () => {
      const { searchFlights, fastestFlight } = useFlights()
      await searchFlights({
        origin: 'SIN',
        destination: 'BKK',
        departureDate: '2024-07-01',
      })

      expect(fastestFlight.value?.duration).toBe(145)
    })

    it('should return directFlights', async () => {
      const { searchFlights, directFlights } = useFlights()
      await searchFlights({
        origin: 'SIN',
        destination: 'BKK',
        departureDate: '2024-07-01',
      })

      expect(directFlights.value).toHaveLength(2)
      expect(directFlights.value.every(f => f.stops === 0)).toBe(true)
    })

    it('should return oneStopFlights', async () => {
      const { searchFlights, oneStopFlights } = useFlights()
      await searchFlights({
        origin: 'SIN',
        destination: 'BKK',
        departureDate: '2024-07-01',
      })

      expect(oneStopFlights.value).toHaveLength(1)
      expect(oneStopFlights.value[0].stops).toBe(1)
    })

    it('should return null for cheapest/fastest when no flights', () => {
      const { cheapestFlight, fastestFlight } = useFlights()

      expect(cheapestFlight.value).toBeNull()
      expect(fastestFlight.value).toBeNull()
    })
  })

  describe('formatDuration', () => {
    it('should format hours and minutes', () => {
      const { formatDuration } = useFlights()

      expect(formatDuration(150)).toBe('2h 30m')
      expect(formatDuration(120)).toBe('2h 0m')
      expect(formatDuration(90)).toBe('1h 30m')
    })

    it('should format minutes only when less than an hour', () => {
      const { formatDuration } = useFlights()

      expect(formatDuration(45)).toBe('45m')
      expect(formatDuration(30)).toBe('30m')
    })
  })

  describe('formatTime', () => {
    it('should format ISO time to HH:MM', () => {
      const { formatTime } = useFlights()

      expect(formatTime('2024-07-01T08:30:00Z')).toMatch(/\d{2}:\d{2}/)
    })
  })

  describe('formatDate', () => {
    it('should format ISO date to readable format', () => {
      const { formatDate } = useFlights()

      const result = formatDate('2024-07-01T08:00:00Z')
      // Should contain weekday, month, and day
      expect(result).toMatch(/\w+,?\s+\w+\s+\d+/)
    })
  })

  describe('getAirportByCode', () => {
    it('should find airport by code', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockAirportsData))

      const { fetchAirports, getAirportByCode } = useFlights()
      await fetchAirports()

      const airport = getAirportByCode('BKK')
      expect(airport).toEqual({
        code: 'BKK',
        city: 'Bangkok',
        airport: 'Suvarnabhumi',
      })
    })

    it('should return undefined for unknown code', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockAirportsData))

      const { fetchAirports, getAirportByCode } = useFlights()
      await fetchAirports()

      expect(getAirportByCode('XXX')).toBeUndefined()
    })
  })

  describe('sortByPrice', () => {
    it('should sort flights by price ascending', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSearchResponse))

      const { searchFlights, flights, sortByPrice } = useFlights()
      await searchFlights({
        origin: 'SIN',
        destination: 'BKK',
        departureDate: '2024-07-01',
      })

      sortByPrice(true)

      expect(flights.value[0].price).toBe(3500)
      expect(flights.value[1].price).toBe(5000)
      expect(flights.value[2].price).toBe(8000)
    })

    it('should sort flights by price descending', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSearchResponse))

      const { searchFlights, flights, sortByPrice } = useFlights()
      await searchFlights({
        origin: 'SIN',
        destination: 'BKK',
        departureDate: '2024-07-01',
      })

      sortByPrice(false)

      expect(flights.value[0].price).toBe(8000)
      expect(flights.value[2].price).toBe(3500)
    })
  })

  describe('sortByDuration', () => {
    it('should sort flights by duration ascending', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSearchResponse))

      const { searchFlights, flights, sortByDuration } = useFlights()
      await searchFlights({
        origin: 'SIN',
        destination: 'BKK',
        departureDate: '2024-07-01',
      })

      sortByDuration(true)

      expect(flights.value[0].duration).toBe(145)
      expect(flights.value[1].duration).toBe(150)
      expect(flights.value[2].duration).toBe(180)
    })

    it('should sort flights by duration descending', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSearchResponse))

      const { searchFlights, flights, sortByDuration } = useFlights()
      await searchFlights({
        origin: 'SIN',
        destination: 'BKK',
        departureDate: '2024-07-01',
      })

      sortByDuration(false)

      expect(flights.value[0].duration).toBe(180)
    })
  })

  describe('sortByDeparture', () => {
    it('should sort flights by departure time', async () => {
      const responseWithTimes: FlightSearchResponse = {
        ...mockSearchResponse,
        flights: [
          { ...mockFlight, id: 'f1', departureTime: '2024-07-01T14:00:00Z' },
          { ...mockFlight, id: 'f2', departureTime: '2024-07-01T08:00:00Z' },
          { ...mockFlight, id: 'f3', departureTime: '2024-07-01T20:00:00Z' },
        ],
      }
      mockFetch.mockResolvedValueOnce(createMockResponse(responseWithTimes))

      const { searchFlights, flights, sortByDeparture } = useFlights()
      await searchFlights({
        origin: 'SIN',
        destination: 'BKK',
        departureDate: '2024-07-01',
      })

      sortByDeparture(true)

      expect(flights.value[0].id).toBe('f2') // 08:00
      expect(flights.value[1].id).toBe('f1') // 14:00
      expect(flights.value[2].id).toBe('f3') // 20:00
    })
  })

  describe('filterByStops', () => {
    it('should filter flights by max stops', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSearchResponse))

      const { searchFlights, filterByStops } = useFlights()
      await searchFlights({
        origin: 'SIN',
        destination: 'BKK',
        departureDate: '2024-07-01',
      })

      const direct = filterByStops(0)
      expect(direct).toHaveLength(2)

      const oneStop = filterByStops(1)
      expect(oneStop).toHaveLength(3)
    })
  })

  describe('filterByPrice', () => {
    it('should filter flights by max price', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSearchResponse))

      const { searchFlights, filterByPrice } = useFlights()
      await searchFlights({
        origin: 'SIN',
        destination: 'BKK',
        departureDate: '2024-07-01',
      })

      const cheap = filterByPrice(4000)
      expect(cheap).toHaveLength(1)
      expect(cheap[0].price).toBe(3500)

      const mid = filterByPrice(6000)
      expect(mid).toHaveLength(2)
    })
  })
})
