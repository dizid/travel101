import { describe, it, expect, beforeEach, vi } from 'vitest'
import './__mocks__/db'
import { setMockQueryResult, clearMockResults, wasQueryMade } from './__mocks__/db'
import { setMockEnv, clearMockEnv, mockFetch, createMockResponse } from './__tests__/setup'
import { createMockRequest, parseResponse } from './__tests__/helpers'

import currencyHandler from './currency.mts'

const mockContext = {
  geo: { city: 'Bangkok' },
  ip: '127.0.0.1',
}

const mockExchangeApiResponse = {
  base: 'USD',
  date: '2025-01-20',
  rates: {
    THB: 35.5,
    EUR: 0.92,
    GBP: 0.79,
    AUD: 1.53,
    CAD: 1.36,
    JPY: 149.5,
    CNY: 7.24,
    KRW: 1320,
    SGD: 1.34,
    MYR: 4.47,
    INR: 83.1,
    USD: 1,
  },
}

describe('currency function', () => {
  beforeEach(() => {
    clearMockResults()
    clearMockEnv()
    vi.clearAllMocks()
    mockFetch.mockReset()
    setMockEnv('DATABASE_URL', 'postgresql://test:test@localhost/test')
  })

  describe('basic functionality', () => {
    it('should return exchange rates for USD (default)', async () => {
      setMockQueryResult('SELECT data, created_at FROM ai_cache', [])
      setMockQueryResult('INSERT INTO ai_cache', [])
      mockFetch.mockResolvedValueOnce(createMockResponse(mockExchangeApiResponse))

      const req = createMockRequest('GET', '/api/currency', {
        headers: {},
      })

      const response = await currencyHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.thbRate).toBeDefined()
      expect(data.rates).toBeDefined()
      expect(data.lastUpdated).toBeDefined()
      expect(data.budgetGuide).toBeDefined()
    })

    it('should accept base currency parameter', async () => {
      setMockQueryResult('SELECT data, created_at FROM ai_cache', [])
      setMockQueryResult('INSERT INTO ai_cache', [])
      mockFetch.mockResolvedValueOnce(createMockResponse(mockExchangeApiResponse))

      const req = createMockRequest('GET', '/api/currency?base=EUR', {
        headers: {},
      })

      const response = await currencyHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      // EUR to THB should be different from USD to THB
      expect(data.thbRate).toBeGreaterThan(35) // EUR is worth more than USD
    })

    it('should handle case-insensitive currency codes', async () => {
      setMockQueryResult('SELECT data, created_at FROM ai_cache', [])
      setMockQueryResult('INSERT INTO ai_cache', [])
      mockFetch.mockResolvedValueOnce(createMockResponse(mockExchangeApiResponse))

      const req = createMockRequest('GET', '/api/currency?base=eur', {
        headers: {},
      })

      const response = await currencyHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.thbRate).toBeDefined()
    })

    it('should accept amount parameter', async () => {
      setMockQueryResult('SELECT data, created_at FROM ai_cache', [])
      setMockQueryResult('INSERT INTO ai_cache', [])
      mockFetch.mockResolvedValueOnce(createMockResponse(mockExchangeApiResponse))

      const req = createMockRequest('GET', '/api/currency?base=USD&amount=100', {
        headers: {},
      })

      const response = await currencyHandler(req, mockContext as never)

      expect(response.status).toBe(200)
    })
  })

  describe('caching', () => {
    it('should return cached rates when available', async () => {
      const cachedRates = {
        base: 'USD',
        date: '2025-01-20',
        rates: { THB: 36.0, EUR: 0.93 },
      }
      setMockQueryResult('SELECT data, created_at FROM ai_cache', [
        { data: cachedRates, created_at: new Date() },
      ])

      const req = createMockRequest('GET', '/api/currency', {
        headers: {},
      })

      const response = await currencyHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.thbRate).toBe(36.0) // From cached data
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should cache fetched rates', async () => {
      setMockQueryResult('SELECT data, created_at FROM ai_cache', [])
      setMockQueryResult('INSERT INTO ai_cache', [])
      mockFetch.mockResolvedValueOnce(createMockResponse(mockExchangeApiResponse))

      const req = createMockRequest('GET', '/api/currency', {
        headers: {},
      })

      await currencyHandler(req, mockContext as never)

      expect(wasQueryMade('INSERT INTO ai_cache')).toBe(true)
      expect(wasQueryMade('currency:rates')).toBe(true)
    })
  })

  describe('budget guide', () => {
    it('should include budget categories', async () => {
      setMockQueryResult('SELECT data, created_at FROM ai_cache', [])
      setMockQueryResult('INSERT INTO ai_cache', [])
      mockFetch.mockResolvedValueOnce(createMockResponse(mockExchangeApiResponse))

      const req = createMockRequest('GET', '/api/currency', {
        headers: {},
      })

      const response = await currencyHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(data.budgetGuide.budget).toBeDefined()
      expect(data.budgetGuide.mid).toBeDefined()
      expect(data.budgetGuide.luxury).toBeDefined()
    })

    it('should have min and max for each budget tier', async () => {
      setMockQueryResult('SELECT data, created_at FROM ai_cache', [])
      setMockQueryResult('INSERT INTO ai_cache', [])
      mockFetch.mockResolvedValueOnce(createMockResponse(mockExchangeApiResponse))

      const req = createMockRequest('GET', '/api/currency', {
        headers: {},
      })

      const response = await currencyHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(data.budgetGuide.budget.min).toBeDefined()
      expect(data.budgetGuide.budget.max).toBeDefined()
      expect(data.budgetGuide.budget.description).toBeDefined()
      expect(data.budgetGuide.mid.min).toBeLessThan(data.budgetGuide.mid.max)
    })

    it('should convert budget to user currency', async () => {
      // EUR is worth more than USD, so budget in EUR should be lower numbers
      setMockQueryResult('SELECT data, created_at FROM ai_cache', [])
      setMockQueryResult('INSERT INTO ai_cache', [])
      mockFetch.mockResolvedValueOnce(createMockResponse(mockExchangeApiResponse))

      const reqUsd = createMockRequest('GET', '/api/currency?base=USD', {
        headers: {},
      })
      const responseUsd = await currencyHandler(reqUsd, mockContext as never)
      const dataUsd = await parseResponse(responseUsd)

      // Reset mocks for second request
      mockFetch.mockReset()
      setMockQueryResult('SELECT data, created_at FROM ai_cache', [])
      setMockQueryResult('INSERT INTO ai_cache', [])
      mockFetch.mockResolvedValueOnce(createMockResponse(mockExchangeApiResponse))

      const reqEur = createMockRequest('GET', '/api/currency?base=EUR', {
        headers: {},
      })
      const responseEur = await currencyHandler(reqEur, mockContext as never)
      const dataEur = await parseResponse(responseEur)

      // EUR budget should be lower than USD budget (EUR is stronger)
      expect(dataEur.budgetGuide.budget.min).toBeLessThan(dataUsd.budgetGuide.budget.min)
    })
  })

  describe('error handling', () => {
    it('should return fallback rates when API fails', async () => {
      setMockQueryResult('SELECT data, created_at FROM ai_cache', [])
      setMockQueryResult('INSERT INTO ai_cache', [])
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response)

      const req = createMockRequest('GET', '/api/currency', {
        headers: {},
      })

      const response = await currencyHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.thbRate).toBeDefined()
      // Fallback rate should still work
    })

    it('should handle database errors gracefully', async () => {
      // Don't set any mock query results - will trigger error path
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const req = createMockRequest('GET', '/api/currency', {
        headers: {},
      })

      const response = await currencyHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(response.status).toBe(200) // Should still return fallback
      expect(data.thbRate).toBeDefined()
      expect(data.error).toBe('Using fallback rates')
    })
  })

  describe('supported currencies', () => {
    it('should include rates for common currencies', async () => {
      setMockQueryResult('SELECT data, created_at FROM ai_cache', [])
      setMockQueryResult('INSERT INTO ai_cache', [])
      mockFetch.mockResolvedValueOnce(createMockResponse(mockExchangeApiResponse))

      const req = createMockRequest('GET', '/api/currency', {
        headers: {},
      })

      const response = await currencyHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(data.rates.USD).toBeDefined()
      expect(data.rates.EUR).toBeDefined()
      expect(data.rates.GBP).toBeDefined()
      expect(data.rates.AUD).toBeDefined()
      expect(data.rates.JPY).toBeDefined()
    })
  })

  describe('date handling', () => {
    it('should include last updated date', async () => {
      setMockQueryResult('SELECT data, created_at FROM ai_cache', [])
      setMockQueryResult('INSERT INTO ai_cache', [])
      mockFetch.mockResolvedValueOnce(createMockResponse(mockExchangeApiResponse))

      const req = createMockRequest('GET', '/api/currency', {
        headers: {},
      })

      const response = await currencyHandler(req, mockContext as never)
      const data = await parseResponse(response)

      expect(data.lastUpdated).toBe('2025-01-20')
    })
  })
})
