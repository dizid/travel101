import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCurrency } from './useCurrency'
import { mockFetch, createMockResponse } from '@/test/setup'

describe('useCurrency', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const mockCurrencyData = {
    thbRate: 35.5,
    rates: { USD: 1, EUR: 0.92, GBP: 0.79, JPY: 150.5 },
    lastUpdated: '2024-01-15T10:00:00Z',
    budgetGuide: {
      budget: { min: 1000, max: 2000, description: 'Budget traveler' },
      mid: { min: 2000, max: 5000, description: 'Mid-range' },
      luxury: { min: 5000, max: 10000, description: 'Luxury' },
    },
  }

  describe('fetchRates', () => {
    it('should fetch currency rates for default USD', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockCurrencyData))

      const { fetchRates, currencyData, baseCurrency } = useCurrency()
      const result = await fetchRates()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/currency?base=USD'),
        expect.any(Object)
      )
      expect(result).toEqual(mockCurrencyData)
      expect(currencyData.value).toEqual(mockCurrencyData)
      expect(baseCurrency.value).toBe('USD')
    })

    it('should fetch rates for specified currency', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockCurrencyData))

      const { fetchRates, baseCurrency } = useCurrency()
      await fetchRates('EUR')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/currency?base=EUR'),
        expect.any(Object)
      )
      expect(baseCurrency.value).toBe('EUR')
    })
  })

  describe('convertToThb', () => {
    it('should convert amount to THB using fetched rate', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockCurrencyData))

      const { fetchRates, convertToThb } = useCurrency()
      await fetchRates()

      const result = convertToThb(100)
      expect(result).toBe(3550) // 100 * 35.5
    })

    it('should use fallback rate when no data fetched', () => {
      const { convertToThb } = useCurrency()
      const result = convertToThb(100)
      expect(result).toBe(3550) // 100 * 35.5 (fallback)
    })
  })

  describe('convertFromThb', () => {
    it('should convert THB to base currency using fetched rate', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockCurrencyData))

      const { fetchRates, convertFromThb } = useCurrency()
      await fetchRates()

      const result = convertFromThb(3550)
      expect(result).toBe(100) // 3550 / 35.5
    })

    it('should use fallback rate when no data fetched', () => {
      const { convertFromThb } = useCurrency()
      const result = convertFromThb(3550)
      expect(result).toBe(100) // 3550 / 35.5 (fallback)
    })
  })

  describe('formatThb', () => {
    it('should format THB with symbol and no decimals', () => {
      const { formatThb } = useCurrency()

      expect(formatThb(1000)).toBe('฿1,000')
      expect(formatThb(1234567)).toBe('฿1,234,567')
      expect(formatThb(99.99)).toBe('฿100')
    })
  })

  describe('formatCurrency', () => {
    it('should format with correct symbol for USD', () => {
      const { formatCurrency } = useCurrency()
      expect(formatCurrency(1000, 'USD')).toBe('$1,000.00')
    })

    it('should format with correct symbol for EUR', () => {
      const { formatCurrency } = useCurrency()
      expect(formatCurrency(1000, 'EUR')).toBe('€1,000.00')
    })

    it('should format with correct symbol for GBP', () => {
      const { formatCurrency } = useCurrency()
      expect(formatCurrency(1000, 'GBP')).toBe('£1,000.00')
    })

    it('should format JPY with 0 decimals', () => {
      const { formatCurrency } = useCurrency()
      expect(formatCurrency(1000, 'JPY')).toBe('¥1,000')
      expect(formatCurrency(1000.99, 'JPY')).toBe('¥1,001')
    })

    it('should format KRW with 0 decimals', () => {
      const { formatCurrency } = useCurrency()
      expect(formatCurrency(10000, 'KRW')).toBe('₩10,000')
    })

    it('should use base currency when none specified', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockCurrencyData))

      const { fetchRates, formatCurrency, baseCurrency } = useCurrency()
      await fetchRates('GBP')

      expect(baseCurrency.value).toBe('GBP')
      expect(formatCurrency(100)).toBe('£100.00')
    })

    it('should use currency code as fallback symbol', () => {
      const { formatCurrency } = useCurrency()
      // XYZ is not in the symbol map
      expect(formatCurrency(100, 'XYZ')).toBe('XYZ100.00')
    })
  })

  describe('computed properties', () => {
    it('should return thbRate from data or fallback', async () => {
      const { thbRate } = useCurrency()
      expect(thbRate.value).toBe(35.5) // fallback

      mockFetch.mockResolvedValueOnce(createMockResponse({ ...mockCurrencyData, thbRate: 36.0 }))
      const currency = useCurrency()
      await currency.fetchRates()
      expect(currency.thbRate.value).toBe(36.0)
    })

    it('should return budgetGuide from data', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockCurrencyData))

      const { fetchRates, budgetGuide } = useCurrency()
      await fetchRates()

      expect(budgetGuide.value).toEqual(mockCurrencyData.budgetGuide)
    })

    it('should return lastUpdated from data', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockCurrencyData))

      const { fetchRates, lastUpdated } = useCurrency()
      await fetchRates()

      expect(lastUpdated.value).toBe('2024-01-15T10:00:00Z')
    })

    it('should return correct currencySymbol', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockCurrencyData))

      const { fetchRates, currencySymbol } = useCurrency()
      expect(currencySymbol.value).toBe('$') // Default USD

      await fetchRates('EUR')
      expect(currencySymbol.value).toBe('€')
    })

    it('should return correct currencyName', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockCurrencyData))

      const { fetchRates, currencyName } = useCurrency()
      expect(currencyName.value).toBe('US Dollar') // Default USD

      await fetchRates('GBP')
      expect(currencyName.value).toBe('British Pound')
    })
  })

  describe('availableCurrencies', () => {
    it('should return list of all available currencies', () => {
      const { availableCurrencies } = useCurrency()

      expect(availableCurrencies.length).toBeGreaterThan(0)
      expect(availableCurrencies).toContainEqual({
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
      })
      expect(availableCurrencies).toContainEqual({
        code: 'THB',
        name: 'Thai Baht',
        symbol: '฿',
      })
    })
  })
})
