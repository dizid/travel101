import { describe, it, expect, beforeEach, vi } from 'vitest'
import './__mocks__/db'
import { setMockQueryResult, clearMockResults, wasQueryMade } from './__mocks__/db'
import { setMockEnv, clearMockEnv, mockFetch, createMockResponse } from './__tests__/setup'
import { createMockRequest, parseResponse } from './__tests__/helpers'

import weatherHandler from './weather.mts'

const mockContext = {
  geo: { city: 'Bangkok' },
  ip: '127.0.0.1',
}

const mockWeatherApiResponse = {
  location: { name: 'Bangkok' },
  current: {
    temp_c: 32,
    condition: { text: 'Sunny', icon: '//cdn.weatherapi.com/weather/64x64/day/113.png' },
    humidity: 65,
    wind_kph: 15,
    uv: 8,
  },
  forecast: {
    forecastday: [
      {
        date: '2025-01-20',
        day: {
          maxtemp_c: 34,
          mintemp_c: 26,
          condition: { text: 'Sunny', icon: '//cdn.weatherapi.com/weather/64x64/day/113.png' },
          daily_chance_of_rain: 10,
        },
      },
      {
        date: '2025-01-21',
        day: {
          maxtemp_c: 33,
          mintemp_c: 25,
          condition: { text: 'Partly Cloudy', icon: '//cdn.weatherapi.com/weather/64x64/day/116.png' },
          daily_chance_of_rain: 20,
        },
      },
    ],
  },
}

describe('weather function', () => {
  beforeEach(() => {
    clearMockResults()
    clearMockEnv()
    vi.clearAllMocks()
    mockFetch.mockReset()
    setMockEnv('DATABASE_URL', 'postgresql://test:test@localhost/test')
  })

  describe('fallback behavior (no API key)', () => {
    it('should return fallback weather data when API key is not configured', async () => {
      // No WEATHERAPI_KEY set

      const req = createMockRequest('GET', '/api/weather?location=bangkok', {
        headers: {},
      })

      const response = await weatherHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(response.headers.get('X-Weather-Source')).toBe('fallback')
      expect(data.location).toBe('Bangkok')
      expect(data.current).toBeTruthy()
      expect(data.forecast).toBeTruthy()
      expect(data.packingTips).toBeTruthy()
    })

    it('should map slugs to city names in fallback', async () => {
      const req = createMockRequest('GET', '/api/weather?location=chiang-mai', {
        headers: {},
      })

      const response = await weatherHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(data.location).toBe('Chiang Mai')
    })

    it('should use location directly if not in mapping', async () => {
      const req = createMockRequest('GET', '/api/weather?location=CustomPlace', {
        headers: {},
      })

      const response = await weatherHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(data.location).toBe('CustomPlace')
    })

    it('should default to Bangkok when no location specified', async () => {
      const req = createMockRequest('GET', '/api/weather', {
        headers: {},
      })

      const response = await weatherHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(data.location).toBe('Bangkok')
    })

    it('should limit days to maximum of 7', async () => {
      const req = createMockRequest('GET', '/api/weather?location=bangkok&days=14', {
        headers: {},
      })

      const response = await weatherHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(data.forecast.length).toBeLessThanOrEqual(7)
    })
  })

  describe('API integration', () => {
    beforeEach(() => {
      setMockEnv('WEATHERAPI_KEY', 'test-api-key-123')
    })

    it('should fetch weather from API when key is configured', async () => {
      setMockQueryResult('SELECT data, created_at FROM ai_cache', [])
      setMockQueryResult('INSERT INTO ai_cache', [])
      mockFetch.mockResolvedValueOnce(createMockResponse(mockWeatherApiResponse))

      const req = createMockRequest('GET', '/api/weather?location=bangkok', {
        headers: {},
      })

      const response = await weatherHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(response.headers.get('X-Cache')).toBe('MISS')
      expect(data.location).toBe('Bangkok')
      expect(data.current.temp_c).toBe(32)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('weatherapi.com')
      )
    })

    it('should return cached data when available', async () => {
      const cachedData = {
        location: 'Bangkok',
        current: { temp_c: 30, condition: 'Sunny', humidity: 60 },
        forecast: [],
        isMonsoon: false,
        packingTips: [],
      }
      setMockQueryResult('SELECT data, created_at FROM ai_cache', [
        { data: cachedData, created_at: new Date() },
      ])

      const req = createMockRequest('GET', '/api/weather?location=bangkok', {
        headers: {},
      })

      const response = await weatherHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(response.headers.get('X-Cache')).toBe('HIT')
      expect(data.current.temp_c).toBe(30)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should cache fetched data', async () => {
      setMockQueryResult('SELECT data, created_at FROM ai_cache', [])
      setMockQueryResult('INSERT INTO ai_cache', [])
      mockFetch.mockResolvedValueOnce(createMockResponse(mockWeatherApiResponse))

      const req = createMockRequest('GET', '/api/weather?location=phuket', {
        headers: {},
      })

      await weatherHandler(req, mockContext as never)

      expect(wasQueryMade('INSERT INTO ai_cache')).toBe(true)
      expect(wasQueryMade('weather:phuket:7')).toBe(true)
    })

    it('should handle API errors gracefully', async () => {
      setMockQueryResult('SELECT data, created_at FROM ai_cache', [])
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response)

      const req = createMockRequest('GET', '/api/weather?location=bangkok', {
        headers: {},
      })

      const response = await weatherHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch weather data')
    })
  })

  describe('city mapping', () => {
    it('should map chiang_mai to Chiang Mai', async () => {
      setMockEnv('WEATHERAPI_KEY', 'test-key')
      setMockQueryResult('SELECT data, created_at FROM ai_cache', [])
      setMockQueryResult('INSERT INTO ai_cache', [])
      mockFetch.mockResolvedValueOnce(createMockResponse(mockWeatherApiResponse))

      const req = createMockRequest('GET', '/api/weather?location=chiang_mai', {
        headers: {},
      })

      await weatherHandler(req, mockContext as never)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('Chiang%20Mai')
      )
    })

    it('should map koh-samui to Koh Samui', async () => {
      const req = createMockRequest('GET', '/api/weather?location=koh-samui', {
        headers: {},
      })

      const response = await weatherHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(data.location).toBe('Koh Samui')
    })

    it('should map hua-hin to Hua Hin', async () => {
      const req = createMockRequest('GET', '/api/weather?location=hua-hin', {
        headers: {},
      })

      const response = await weatherHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(data.location).toBe('Hua Hin')
    })
  })

  describe('packing tips', () => {
    it('should include temple dress code tip', async () => {
      const req = createMockRequest('GET', '/api/weather?location=bangkok', {
        headers: {},
      })

      const response = await weatherHandler(req, mockContext as never)
      const data = await parseResponse(response)

      const hasDressCodeTip = data.packingTips.some(
        (tip: string) => tip.toLowerCase().includes('temple') || tip.toLowerCase().includes('shoulders')
      )
      expect(hasDressCodeTip).toBe(true)
    })

    it('should limit packing tips to 5', async () => {
      const req = createMockRequest('GET', '/api/weather?location=bangkok', {
        headers: {},
      })

      const response = await weatherHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(data.packingTips.length).toBeLessThanOrEqual(5)
    })
  })

  describe('monsoon detection', () => {
    it('should include monsoon status', async () => {
      const req = createMockRequest('GET', '/api/weather?location=bangkok', {
        headers: {},
      })

      const response = await weatherHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(typeof data.isMonsoon).toBe('boolean')
    })
  })

  describe('forecast days', () => {
    it('should return requested number of days', async () => {
      const req = createMockRequest('GET', '/api/weather?location=bangkok&days=3', {
        headers: {},
      })

      const response = await weatherHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(data.forecast.length).toBe(3)
    })

    it('should default to 7 days', async () => {
      const req = createMockRequest('GET', '/api/weather?location=bangkok', {
        headers: {},
      })

      const response = await weatherHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(data.forecast.length).toBe(7)
    })
  })
})
