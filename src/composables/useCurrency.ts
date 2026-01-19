import { ref, computed } from 'vue'
import { useApi } from './useApi'

interface BudgetTier {
  min: number
  max: number
  description: string
}

interface CurrencyData {
  thbRate: number
  rates: Record<string, number>
  lastUpdated: string
  budgetGuide: {
    budget: BudgetTier
    mid: BudgetTier
    luxury: BudgetTier
  }
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  AUD: 'A$',
  CAD: 'C$',
  JPY: '¥',
  CNY: '¥',
  KRW: '₩',
  SGD: 'S$',
  MYR: 'RM',
  INR: '₹',
  RUB: '₽',
  CHF: 'CHF',
  NZD: 'NZ$',
  HKD: 'HK$',
  SEK: 'kr',
  NOK: 'kr',
  THB: '฿',
}

const CURRENCY_NAMES: Record<string, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  AUD: 'Australian Dollar',
  CAD: 'Canadian Dollar',
  JPY: 'Japanese Yen',
  CNY: 'Chinese Yuan',
  KRW: 'Korean Won',
  SGD: 'Singapore Dollar',
  MYR: 'Malaysian Ringgit',
  INR: 'Indian Rupee',
  RUB: 'Russian Ruble',
  CHF: 'Swiss Franc',
  NZD: 'New Zealand Dollar',
  HKD: 'Hong Kong Dollar',
  SEK: 'Swedish Krona',
  NOK: 'Norwegian Krone',
  THB: 'Thai Baht',
}

export function useCurrency() {
  const { get, loading, error } = useApi()
  const currencyData = ref<CurrencyData | null>(null)
  const baseCurrency = ref('USD')

  async function fetchRates(currency: string = 'USD') {
    baseCurrency.value = currency
    const data = await get<CurrencyData>(
      `/currency?base=${currency}`,
      { requiresAuth: false }
    )
    if (data) {
      currencyData.value = data
    }
    return data
  }

  function convertToThb(amount: number): number {
    if (!currencyData.value) return amount * 35.5 // Fallback
    return amount * currencyData.value.thbRate
  }

  function convertFromThb(thbAmount: number): number {
    if (!currencyData.value) return thbAmount / 35.5 // Fallback
    return thbAmount / currencyData.value.thbRate
  }

  function formatThb(amount: number): string {
    return `฿${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  }

  function formatCurrency(amount: number, currency?: string): string {
    const curr = currency || baseCurrency.value
    const symbol = CURRENCY_SYMBOLS[curr] || curr
    const decimals = ['JPY', 'KRW'].includes(curr) ? 0 : 2
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
  }

  const thbRate = computed(() => currencyData.value?.thbRate ?? 35.5)
  const budgetGuide = computed(() => currencyData.value?.budgetGuide)
  const lastUpdated = computed(() => currencyData.value?.lastUpdated)

  const currencySymbol = computed(() => CURRENCY_SYMBOLS[baseCurrency.value] || baseCurrency.value)
  const currencyName = computed(() => CURRENCY_NAMES[baseCurrency.value] || baseCurrency.value)

  const availableCurrencies = Object.entries(CURRENCY_NAMES).map(([code, name]) => ({
    code,
    name,
    symbol: CURRENCY_SYMBOLS[code] || code,
  }))

  return {
    loading,
    error,
    currencyData,
    baseCurrency,
    fetchRates,
    convertToThb,
    convertFromThb,
    formatThb,
    formatCurrency,
    thbRate,
    budgetGuide,
    lastUpdated,
    currencySymbol,
    currencyName,
    availableCurrencies,
  }
}
