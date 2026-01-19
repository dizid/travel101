import type { Context, Config } from '@netlify/functions'
import { getDb } from './lib/db.mts'

interface TravelAdvisory {
  source: string
  level: number // 1-4 (1=exercise normal precautions, 4=do not travel)
  title: string
  summary: string
  details: string[]
  lastUpdated: string
  url: string
}

interface AdvisoriesResponse {
  country: string
  overallLevel: number
  advisories: TravelAdvisory[]
  regionalAlerts: {
    province: string
    alert: string
    level: number
  }[]
  lastChecked: string
}

// Thailand-specific advisory data (would be fetched from APIs in production)
const THAILAND_ADVISORIES: TravelAdvisory[] = [
  {
    source: 'US State Department',
    level: 1,
    title: 'Exercise Normal Precautions',
    summary: 'Exercise normal precautions when traveling to Thailand.',
    details: [
      'Be aware of your surroundings and security conditions',
      'Follow local news and have contingency plans',
      'Register with the Smart Traveler Enrollment Program (STEP)',
    ],
    lastUpdated: '2026-01-15',
    url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/thailand-travel-advisory.html',
  },
  {
    source: 'UK Foreign Office',
    level: 1,
    title: 'See Our Travel Advice',
    summary: 'Most visits to Thailand are trouble-free. Be vigilant in crowded areas.',
    details: [
      'Petty crime including bag snatching can occur',
      'Take care when swimming - strong currents are common',
      'Avoid demonstrations and large gatherings',
      'Be cautious in border areas with Myanmar, Cambodia, and Malaysia',
    ],
    lastUpdated: '2026-01-10',
    url: 'https://www.gov.uk/foreign-travel-advice/thailand',
  },
  {
    source: 'Australian DFAT',
    level: 2,
    title: 'Exercise a High Degree of Caution',
    summary: 'Exercise a high degree of caution in Thailand due to the risk of civil unrest.',
    details: [
      'Avoid protests and large public gatherings',
      'Monitor local media for updates',
      'Follow advice of local authorities',
    ],
    lastUpdated: '2026-01-12',
    url: 'https://www.smartraveller.gov.au/destinations/asia/thailand',
  },
]

const REGIONAL_ALERTS = [
  {
    province: 'Yala',
    alert: 'Do not travel - active insurgency in deep south provinces',
    level: 4,
  },
  {
    province: 'Pattani',
    alert: 'Do not travel - active insurgency in deep south provinces',
    level: 4,
  },
  {
    province: 'Narathiwat',
    alert: 'Do not travel - active insurgency in deep south provinces',
    level: 4,
  },
  {
    province: 'Songkhla',
    alert: 'Reconsider travel to border areas with Malaysia',
    level: 3,
  },
]

const ADVISORY_LEVELS = {
  1: { label: 'Exercise Normal Precautions', color: 'green', icon: '✅' },
  2: { label: 'Exercise Increased Caution', color: 'yellow', icon: '⚠️' },
  3: { label: 'Reconsider Travel', color: 'orange', icon: '🔶' },
  4: { label: 'Do Not Travel', color: 'red', icon: '🛑' },
}

export default async (req: Request, context: Context) => {
  const db = getDb()
  const url = new URL(req.url)

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const province = url.searchParams.get('province')

    // Check cache first (24 hour TTL for advisories)
    const cacheKey = `advisories_thailand_${province || 'all'}`
    const cached = await db`
      SELECT response_data FROM ai_cache
      WHERE cache_key = ${cacheKey}
      AND created_at > NOW() - INTERVAL '24 hours'
      LIMIT 1
    `

    if (cached.length > 0) {
      return new Response(JSON.stringify(cached[0].response_data), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Build response
    let regionalAlerts = REGIONAL_ALERTS
    if (province) {
      regionalAlerts = REGIONAL_ALERTS.filter(a =>
        a.province.toLowerCase() === province.toLowerCase()
      )
    }

    // Get province safety data if available
    let provinceSafety = null
    if (province) {
      const safety = await db`
        SELECT * FROM province_safety WHERE province = ${province}
      `
      if (safety.length > 0) {
        provinceSafety = safety[0]
      }
    }

    // Calculate overall level (max of all advisories, excluding regional restrictions)
    const overallLevel = Math.max(...THAILAND_ADVISORIES.map(a => a.level))

    const response: AdvisoriesResponse = {
      country: 'Thailand',
      overallLevel,
      advisories: THAILAND_ADVISORIES,
      regionalAlerts,
      lastChecked: new Date().toISOString(),
    }

    // Cache the response
    await db`
      INSERT INTO ai_cache (cache_key, response_data)
      VALUES (${cacheKey}, ${JSON.stringify(response)})
      ON CONFLICT (cache_key) DO UPDATE SET
        response_data = EXCLUDED.response_data,
        created_at = NOW()
    `

    return new Response(JSON.stringify({
      ...response,
      advisoryLevels: ADVISORY_LEVELS,
      provinceSafety,
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Advisories function error:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch advisories' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const config: Config = {
  path: '/api/advisories',
}
