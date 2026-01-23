import type { Context, Config } from '@netlify/functions'
import Anthropic from '@anthropic-ai/sdk'
import { getDb } from './lib/db.mts'
import { checkAndIncrementUsage } from './lib/usage.mts'

interface PackingRequest {
  destinations: string[]
  duration: number
  activities: string[]
  weather?: {
    avgTemp: number
    rainChance: number
    isMonsoon: boolean
  }
  travelStyle?: string
  includeTemples?: boolean
}

interface PackingItem {
  item: string
  category: string
  priority: 'essential' | 'recommended' | 'optional'
  reason?: string
}

interface PackingList {
  categories: {
    name: string
    icon: string
    items: PackingItem[]
  }[]
  tips: string[]
  warnings: string[]
}

const PACKING_PROMPT = `You are a Thailand travel packing expert. Generate a personalized packing list based on the trip details provided.

Return a JSON object with this exact structure:
{
  "categories": [
    {
      "name": "Category Name",
      "icon": "emoji",
      "items": [
        {
          "item": "Item name",
          "category": "category",
          "priority": "essential|recommended|optional",
          "reason": "Why this is needed (optional)"
        }
      ]
    }
  ],
  "tips": ["Packing tip 1", "Packing tip 2"],
  "warnings": ["Important warning about Thailand travel"]
}

Categories to include:
- 👕 Clothing (weather-appropriate, temple-appropriate)
- 🩴 Footwear (comfortable walking shoes, flip flops for beaches/temples)
- 🧴 Toiletries (sunscreen, mosquito repellent, medications)
- 📱 Electronics (adapters - Type A/B/C/O used in Thailand)
- 📄 Documents (passport, visa docs, insurance, vaccination records)
- 💰 Money (cash, cards, money belt)
- 🎒 Accessories (daypack, umbrella for monsoon, etc.)
- 🏥 Health (first aid, hand sanitizer, face masks)

Priority guidelines:
- Essential: Cannot travel without it
- Recommended: Will significantly improve trip
- Optional: Nice to have

Thailand-specific tips:
- Modest clothing for temples (cover shoulders & knees)
- Light, breathable fabrics for heat
- Rain gear during monsoon (May-October)
- Mosquito protection for evenings
- Reef-safe sunscreen for islands
- Light jacket for AC in malls/transport

ONLY return valid JSON, no other text.`

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const apiKey = Netlify.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'AI service not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body: PackingRequest = await req.json()
    const { destinations, duration, activities, weather, travelStyle, includeTemples } = body

    if (!destinations?.length || !duration) {
      return new Response(JSON.stringify({ error: 'Destinations and duration are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Check usage limits for authenticated users
    const userId = req.headers.get('x-user-id')
    if (userId) {
      const db = await getDb()
      const usageCheck = await checkAndIncrementUsage(db, userId, 'packing')
      if (!usageCheck.allowed) {
        return new Response(JSON.stringify({
          error: 'Daily packing list limit reached',
          code: 'LIMIT_REACHED',
          usage: {
            current: usageCheck.currentUsage,
            limit: usageCheck.limit,
            remaining: 0,
          },
          upgradeUrl: '/dashboard#pro',
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    const anthropic = new Anthropic({ apiKey })

    // Build the request context
    const tripContext = `
Trip details:
- Destinations: ${destinations.join(', ')}
- Duration: ${duration} days
- Activities: ${activities?.length ? activities.join(', ') : 'General sightseeing'}
- Travel style: ${travelStyle || 'mid-range'}
- Temple visits planned: ${includeTemples !== false ? 'Yes' : 'No'}
${weather ? `
Weather forecast:
- Average temperature: ${weather.avgTemp}°C
- Rain chance: ${weather.rainChance}%
- Monsoon season: ${weather.isMonsoon ? 'Yes - expect afternoon showers' : 'No'}
` : ''}
`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: PACKING_PROMPT,
      messages: [
        { role: 'user', content: `Generate a packing list for this Thailand trip:\n${tripContext}` }
      ],
    })

    const contentBlock = response.content[0]
    const responseText = contentBlock.type === 'text' ? contentBlock.text : ''

    // Parse the JSON response
    let packingList: PackingList
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        packingList = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Failed to parse packing list:', parseError)
      // Return a fallback packing list
      packingList = getDefaultPackingList(includeTemples !== false, weather?.isMonsoon ?? false)
    }

    return new Response(JSON.stringify({
      packingList,
      tripSummary: {
        destinations,
        duration,
        activities,
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Packing AI error:', error)
    return new Response(JSON.stringify({ error: 'Failed to generate packing list' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

function getDefaultPackingList(includeTemples: boolean, isMonsoon: boolean): PackingList {
  return {
    categories: [
      {
        name: 'Clothing',
        icon: '👕',
        items: [
          { item: 'Light, breathable t-shirts (5-7)', category: 'clothing', priority: 'essential' },
          { item: 'Shorts/skirts', category: 'clothing', priority: 'essential' },
          { item: 'Light long pants', category: 'clothing', priority: 'recommended', reason: 'For temples and nice restaurants' },
          ...(includeTemples ? [{ item: 'Sarong or cover-up', category: 'clothing', priority: 'essential', reason: 'Required for temple visits' }] : []),
          { item: 'Swimwear', category: 'clothing', priority: 'recommended' },
          { item: 'Light cardigan/jacket', category: 'clothing', priority: 'recommended', reason: 'For strong AC' },
        ],
      },
      {
        name: 'Footwear',
        icon: '🩴',
        items: [
          { item: 'Comfortable walking shoes', category: 'footwear', priority: 'essential' },
          { item: 'Flip flops/sandals', category: 'footwear', priority: 'essential', reason: 'For beaches and easy temple entry' },
        ],
      },
      {
        name: 'Toiletries',
        icon: '🧴',
        items: [
          { item: 'Sunscreen SPF 50+', category: 'toiletries', priority: 'essential' },
          { item: 'Mosquito repellent (DEET)', category: 'toiletries', priority: 'essential' },
          { item: 'After-sun lotion', category: 'toiletries', priority: 'recommended' },
          { item: 'Hand sanitizer', category: 'toiletries', priority: 'recommended' },
        ],
      },
      {
        name: 'Electronics',
        icon: '📱',
        items: [
          { item: 'Universal power adapter', category: 'electronics', priority: 'essential', reason: 'Thailand uses Type A/B/C/O' },
          { item: 'Phone + charger', category: 'electronics', priority: 'essential' },
          { item: 'Power bank', category: 'electronics', priority: 'recommended' },
        ],
      },
      {
        name: 'Documents',
        icon: '📄',
        items: [
          { item: 'Passport (6+ months validity)', category: 'documents', priority: 'essential' },
          { item: 'Travel insurance documents', category: 'documents', priority: 'essential' },
          { item: 'Copies of important documents', category: 'documents', priority: 'recommended' },
          { item: 'Vaccination records', category: 'documents', priority: 'optional' },
        ],
      },
      {
        name: 'Accessories',
        icon: '🎒',
        items: [
          { item: 'Daypack', category: 'accessories', priority: 'essential' },
          { item: 'Sunglasses', category: 'accessories', priority: 'essential' },
          { item: 'Hat/cap', category: 'accessories', priority: 'recommended' },
          ...(isMonsoon ? [{ item: 'Compact umbrella', category: 'accessories', priority: 'essential', reason: 'Monsoon season - expect daily rain' }] : []),
          { item: 'Reusable water bottle', category: 'accessories', priority: 'recommended' },
        ],
      },
    ],
    tips: [
      'Pack light - you can buy affordable clothes in Thailand',
      'Roll clothes to save space and reduce wrinkles',
      'Keep a small day bag for temple visits with cover-ups',
      ...(isMonsoon ? ['Bring a waterproof bag for electronics during monsoon'] : []),
    ],
    warnings: [
      'Do not pack more than 10 e-cigarettes (vaping is technically illegal in Thailand)',
      'Prescription medications should have documentation',
      'Avoid camouflage clothing (can be mistaken for military)',
    ],
  }
}

export const config: Config = {
  path: '/api/packing',
}
