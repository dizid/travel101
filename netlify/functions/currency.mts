import type { Context, Config } from '@netlify/functions'
import { getDb } from './lib/db.mts'

interface ExchangeRates {
  base: string
  date: string
  rates: Record<string, number>
}

interface CurrencyResponse {
  thbRate: number
  rates: Record<string, number>
  lastUpdated: string
  budgetGuide: {
    budget: { min: number; max: number; description: string }
    mid: { min: number; max: number; description: string }
    luxury: { min: number; max: number; description: string }
  }
}

// Common currencies for travelers. Rates are the European Central Bank's reference rates via
// Frankfurter (free, no key). The ECB has published no RUB rate since March 2022, so RUB isn't
// offered (better than showing a made-up rate).
const SUPPORTED_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY', 'CNY', 'KRW',
  'SGD', 'MYR', 'INR', 'CHF', 'NZD', 'HKD', 'SEK', 'NOK', 'THB'
]

const RATES_URL = 'https://api.frankfurter.dev/v1/latest?base=USD'

// Last-resort rates if the rate API and the cache both fail: ECB reference rates of
// 2026-11-11 (per 1 USD). Only used when nothing fresher is available.
const FALLBACK_RATES: ExchangeRates = {
  base: 'USD',
  date: '2026-11-11',
  rates: {
    USD: 1, THB: 33.69, EUR: 0.89871, GBP: 0.75149, AUD: 1.4579, CAD: 1.4235, JPY: 159.23,
    CNY: 6.6707, KRW: 1336.9, SGD: 1.2826, MYR: 4.0735, INR: 93.69, CHF: 0.82987,
    NZD: 1.791, HKD: 7.8456, SEK: 9.9317, NOK: 9.5394,
  },
}

/** Fresh USD-based rates, or null when the API fails or answers with something else. */
async function fetchUsdRates(): Promise<ExchangeRates | null> {
  try {
    const response = await fetch(RATES_URL, { headers: { Accept: 'application/json' } })
    if (!response.ok) return null
    const data = await response.json()
    if (typeof data?.rates?.THB !== 'number') return null
    return { base: 'USD', date: String(data.date || ''), rates: { ...data.rates, USD: 1 } }
  } catch {
    // e.g. the old exchangerate.host URL now redirects to an HTML page: .json() throws
    return null
  }
}

// Daily budget guide in THB (approximate)
const BUDGET_GUIDE = {
  budget: {
    min: 800,
    max: 1500,
    description: 'Hostels, street food, local transport'
  },
  mid: {
    min: 1500,
    max: 4000,
    description: 'Hotels, restaurants, some tours'
  },
  luxury: {
    min: 4000,
    max: 15000,
    description: 'Resorts, fine dining, private tours'
  },
}

function convert(rates: ExchangeRates, baseCurrency: string): CurrencyResponse {
  const usdToThb = rates.rates.THB
  const baseToThb = usdToThb / rates.rates[baseCurrency]
  const tier = (t: { min: number; max: number; description: string }) => ({
    min: Math.round(t.min / baseToThb),
    max: Math.round(t.max / baseToThb),
    description: t.description,
  })
  return {
    thbRate: baseToThb,
    rates: Object.fromEntries(
      SUPPORTED_CURRENCIES.map((currency) => [
        currency,
        rates.rates[currency] ? usdToThb / rates.rates[currency] : 0,
      ])
    ),
    lastUpdated: rates.date,
    // Budget guide converted to the user's currency
    budgetGuide: {
      budget: tier(BUDGET_GUIDE.budget),
      mid: tier(BUDGET_GUIDE.mid),
      luxury: tier(BUDGET_GUIDE.luxury),
    },
  }
}

const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })

export default async (req: Request, _context: Context) => {
  const url = new URL(req.url)
  const baseCurrency = url.searchParams.get('base')?.toUpperCase() || 'USD'

  if (!SUPPORTED_CURRENCIES.includes(baseCurrency)) {
    return jsonResponse({ error: `Currency not supported: ${baseCurrency}` }, 400)
  }

  const cacheKey = 'currency:rates'
  let db: ReturnType<typeof getDb> | null = null
  let cachedRates: ExchangeRates | null = null
  let cacheIsFresh = false

  // Cache read (rates update once a working day; fresh for 6 hours). A DB problem must not
  // stop the calculator, so it only means "no cache".
  try {
    db = await getDb()
    const cached = await db`
      SELECT data, created_at FROM ai_cache
      WHERE cache_key = ${cacheKey}
      LIMIT 1
    `
    if (cached.length > 0 && typeof cached[0].data?.rates?.THB === 'number') {
      const data = cached[0].data as ExchangeRates
      cachedRates = { ...data, rates: { ...data.rates, USD: 1 } } // base is USD
      cacheIsFresh = Date.now() - new Date(cached[0].created_at).getTime() < 6 * 60 * 60 * 1000
    }
  } catch (error) {
    console.error('Currency cache read failed:', error)
  }

  let rates: ExchangeRates
  let approximate = false
  if (cachedRates && cacheIsFresh) {
    rates = cachedRates
  } else {
    const fresh = await fetchUsdRates()
    if (fresh) {
      rates = fresh
      if (db) {
        try {
          await db`
            INSERT INTO ai_cache (cache_key, data, created_at)
            VALUES (${cacheKey}, ${JSON.stringify(fresh)}, NOW())
            ON CONFLICT (cache_key) DO UPDATE SET
              data = EXCLUDED.data,
              created_at = NOW()
          `
        } catch (error) {
          console.error('Currency cache write failed:', error)
        }
      }
    } else {
      // API down: an older cached copy, else the dated fallback table (per-currency rates,
      // never one rate for every currency)
      rates = cachedRates || FALLBACK_RATES
      approximate = true
    }
  }

  if (!rates.rates[baseCurrency] || !rates.rates.THB) {
    rates = FALLBACK_RATES
    approximate = true
  }

  const body = convert(rates, baseCurrency)
  return jsonResponse(approximate ? { ...body, error: 'Using fallback rates' } : body)
}
