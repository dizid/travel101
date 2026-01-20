import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWeather } from './useWeather'
import { mockFetch, createMockResponse } from '@/test/setup'
import { mockWeatherData } from '@/test/fixtures'

describe('useWeather', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('fetchWeather', () => {
    it('should fetch weather data for location', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockWeatherData))

      const { fetchWeather, weatherData } = useWeather()
      await fetchWeather('Bangkok')

      expect(weatherData.value).toEqual(mockWeatherData)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('location=Bangkok'),
        expect.any(Object)
      )
    })

    it('should use default location Bangkok', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockWeatherData))

      const { fetchWeather } = useWeather()
      await fetchWeather()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('location=Bangkok'),
        expect.any(Object)
      )
    })

    it('should pass days parameter', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockWeatherData))

      const { fetchWeather } = useWeather()
      await fetchWeather('Phuket', 14)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('days=14'),
        expect.any(Object)
      )
    })

    it('should not require auth', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockWeatherData))

      const { fetchWeather } = useWeather()
      await fetchWeather()

      // Check that the call includes requiresAuth: false (no x-user-id header)
      const callArgs = mockFetch.mock.calls[0][1]
      expect(callArgs.headers).not.toHaveProperty('x-user-id')
    })

    it('should URL encode location', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockWeatherData))

      const { fetchWeather } = useWeather()
      await fetchWeather('Chiang Mai')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('location=Chiang%20Mai'),
        expect.any(Object)
      )
    })
  })

  describe('currentTemp computed', () => {
    it('should return current temperature', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockWeatherData))

      const { fetchWeather, currentTemp } = useWeather()
      await fetchWeather()

      expect(currentTemp.value).toBe(32)
    })

    it('should return null before fetch', () => {
      const { currentTemp } = useWeather()

      expect(currentTemp.value).toBeNull()
    })
  })

  describe('currentCondition computed', () => {
    it('should return current condition', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockWeatherData))

      const { fetchWeather, currentCondition } = useWeather()
      await fetchWeather()

      expect(currentCondition.value).toBe('Sunny')
    })

    it('should return empty string before fetch', () => {
      const { currentCondition } = useWeather()

      expect(currentCondition.value).toBe('')
    })
  })

  describe('isMonsoon computed', () => {
    it('should reflect monsoon status', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ...mockWeatherData,
          isMonsoon: true,
        })
      )

      const { fetchWeather, isMonsoon } = useWeather()
      await fetchWeather()

      expect(isMonsoon.value).toBe(true)
    })

    it('should default to false', () => {
      const { isMonsoon } = useWeather()

      expect(isMonsoon.value).toBe(false)
    })
  })

  describe('packingTips computed', () => {
    it('should return packing tips', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockWeatherData))

      const { fetchWeather, packingTips } = useWeather()
      await fetchWeather()

      expect(packingTips.value).toEqual(['Sunscreen', 'Light clothes', 'Sunglasses'])
    })

    it('should return empty array before fetch', () => {
      const { packingTips } = useWeather()

      expect(packingTips.value).toEqual([])
    })
  })

  describe('weatherIcon computed', () => {
    const testCases = [
      { condition: 'Heavy rain', expected: '🌧️' },
      { condition: 'Light drizzle', expected: '🌧️' },
      { condition: 'Thunderstorm', expected: '⛈️' },
      { condition: 'Storm warning', expected: '⛈️' },
      { condition: 'Cloudy', expected: '☁️' },
      { condition: 'Overcast', expected: '☁️' },
      { condition: 'Partly cloudy', expected: '☁️' },
      { condition: 'Mist', expected: '🌫️' },
      { condition: 'Fog', expected: '🌫️' },
      { condition: 'Sunny', expected: '☀️' },
      { condition: 'Clear', expected: '☀️' },
    ]

    testCases.forEach(({ condition, expected }) => {
      it(`should return ${expected} for ${condition}`, async () => {
        mockFetch.mockResolvedValueOnce(
          createMockResponse({
            ...mockWeatherData,
            current: {
              ...mockWeatherData.current,
              condition,
            },
          })
        )

        const { fetchWeather, weatherIcon } = useWeather()
        await fetchWeather()

        expect(weatherIcon.value).toBe(expected)
      })
    })

    it('should default to ☀️ before fetch', () => {
      const { weatherIcon } = useWeather()

      expect(weatherIcon.value).toBe('☀️')
    })
  })

  describe('uvLevel computed', () => {
    const uvTestCases = [
      { uv: 0, level: 'Low', color: 'text-green-500' },
      { uv: 2, level: 'Low', color: 'text-green-500' },
      { uv: 3, level: 'Moderate', color: 'text-yellow-500' },
      { uv: 5, level: 'Moderate', color: 'text-yellow-500' },
      { uv: 6, level: 'High', color: 'text-orange-500' },
      { uv: 7, level: 'High', color: 'text-orange-500' },
      { uv: 8, level: 'Very High', color: 'text-red-600' },
      { uv: 10, level: 'Very High', color: 'text-red-600' },
      { uv: 11, level: 'Extreme', color: 'text-purple-600' },
      { uv: 15, level: 'Extreme', color: 'text-purple-600' },
    ]

    uvTestCases.forEach(({ uv, level, color }) => {
      it(`should return ${level} for UV index ${uv}`, async () => {
        mockFetch.mockResolvedValueOnce(
          createMockResponse({
            ...mockWeatherData,
            current: {
              ...mockWeatherData.current,
              uv,
            },
          })
        )

        const { fetchWeather, uvLevel } = useWeather()
        await fetchWeather()

        expect(uvLevel.value.level).toBe(level)
        expect(uvLevel.value.color).toBe(color)
      })
    })

    it('should include advice', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockWeatherData))

      const { fetchWeather, uvLevel } = useWeather()
      await fetchWeather()

      expect(uvLevel.value.advice).toBeDefined()
      expect(uvLevel.value.advice.length).toBeGreaterThan(0)
    })
  })

  describe('rainChanceToday computed', () => {
    it('should return rain chance from first forecast day', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockWeatherData))

      const { fetchWeather, rainChanceToday } = useWeather()
      await fetchWeather()

      expect(rainChanceToday.value).toBe(10)
    })

    it('should return 0 when no forecast', () => {
      const { rainChanceToday } = useWeather()

      expect(rainChanceToday.value).toBe(0)
    })
  })

  describe('forecast computed', () => {
    it('should return forecast array', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockWeatherData))

      const { fetchWeather, forecast } = useWeather()
      await fetchWeather()

      expect(forecast.value).toHaveLength(2)
      expect(forecast.value[0].date).toBe('2024-02-01')
    })

    it('should return empty array before fetch', () => {
      const { forecast } = useWeather()

      expect(forecast.value).toEqual([])
    })
  })
})
