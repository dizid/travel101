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

// Common currencies for travelers
const SUPPORTED_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY', 'CNY', 'KRW',
  'SGD', 'MYR', 'INR', 'RUB', 'CHF', 'NZD', 'HKD', 'SEK', 'NOK'
]

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

export default async (req: Request, context: Context) => {
  const url = new URL(req.url)
  const baseCurrency = url.searchParams.get('base')?.toUpperCase() || 'USD'
  const amount = parseFloat(url.searchParams.get('amount') || '1')

  try {
    const db = getDb()

    // Check cache (rates update daily, cache for 6 hours)
    const cacheKey = 'currency:rates'
    const cached = await db`
      SELECT data, created_at FROM ai_cache
      WHERE cache_key = ${cacheKey}
      AND created_at > NOW() - INTERVAL '6 hours'
      LIMIT 1
    `

    let rates: ExchangeRates

    if (cached.length > 0) {
      rates = cached[0].data as ExchangeRates
    } else {
      // Fetch fresh rates from exchangerate.host (free, no API key required)
      const apiUrl = `https://api.exchangerate.host/latest?base=USD&symbols=${SUPPORTED_CURRENCIES.join(',')},THB`
      const response = await fetch(apiUrl)

      if (!response.ok) {
        // Fallback to approximate rates if API fails
        rates = {
          base: 'USD',
          date: new Date().toISOString().split('T')[0],
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
            RUB: 92.5,
            CHF: 0.88,
            NZD: 1.64,
            HKD: 7.82,
            SEK: 10.5,
            NOK: 10.8,
            USD: 1,
          }
        }
      } else {
        const data = await response.json()
        rates = {
          base: data.base || 'USD',
          date: data.date || new Date().toISOString().split('T')[0],
          rates: data.rates || {}
        }
      }

      // Cache the rates
      await db`
        INSERT INTO ai_cache (cache_key, data, created_at)
        VALUES (${cacheKey}, ${JSON.stringify(rates)}, NOW())
        ON CONFLICT (cache_key) DO UPDATE SET
          data = EXCLUDED.data,
          created_at = NOW()
      `
    }

    // Calculate THB rate for requested base currency
    const usdToThb = rates.rates.THB || 35.5
    const usdToBase = rates.rates[baseCurrency] || 1
    const baseToThb = usdToThb / usdToBase

    // Convert budget guide to user's currency
    const budgetGuide = {
      budget: {
        min: Math.round(BUDGET_GUIDE.budget.min / baseToThb),
        max: Math.round(BUDGET_GUIDE.budget.max / baseToThb),
        description: BUDGET_GUIDE.budget.description,
      },
      mid: {
        min: Math.round(BUDGET_GUIDE.mid.min / baseToThb),
        max: Math.round(BUDGET_GUIDE.mid.max / baseToThb),
        description: BUDGET_GUIDE.mid.description,
      },
      luxury: {
        min: Math.round(BUDGET_GUIDE.luxury.min / baseToThb),
        max: Math.round(BUDGET_GUIDE.luxury.max / baseToThb),
        description: BUDGET_GUIDE.luxury.description,
      },
    }

    const response_data: CurrencyResponse = {
      thbRate: baseToThb,
      rates: Object.fromEntries(
        SUPPORTED_CURRENCIES.map(currency => [
          currency,
          rates.rates[currency] ? usdToThb / rates.rates[currency] : 0
        ])
      ),
      lastUpdated: rates.date,
      budgetGuide,
    }

    return new Response(JSON.stringify(response_data), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Currency API error:', error)

    // Return fallback rates on error
    const fallbackRate = 35.5 // Approximate USD to THB
    return new Response(JSON.stringify({
      thbRate: fallbackRate,
      rates: { USD: fallbackRate },
      lastUpdated: new Date().toISOString().split('T')[0],
      budgetGuide: BUDGET_GUIDE,
      error: 'Using fallback rates',
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const config: Config = {
  path: '/api/currency',
}
