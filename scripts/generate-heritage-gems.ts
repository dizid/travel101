/**
 * Generate Heritage Hotels & More Hidden Gems
 *
 * Adds heritage hotels (with Agoda affiliate focus) and more unique experiences
 *
 * Usage:
 *   npx tsx scripts/generate-heritage-gems.ts
 *   npx tsx scripts/generate-heritage-gems.ts --dry-run
 */

import { config } from 'dotenv'
config({ path: '.env' })
config({ path: '.env.local' })

import Anthropic from '@anthropic-ai/sdk'
import postgres from 'postgres'

const DRY_RUN = process.argv.includes('--dry-run')
const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL && !DRY_RUN) {
  console.error('DATABASE_URL required')
  process.exit(1)
}

const sql = DATABASE_URL ? postgres(DATABASE_URL) : null
const anthropic = new Anthropic()

const GENERATION_PLAN = [
  // Heritage Hotels - great for Agoda affiliate
  { category: 'heritage_hotels', province: 'Bangkok', count: 8, placeType: 'heritage', description: 'Historic and heritage hotels in Bangkok - colonial mansions, renovated shophouses, historic properties' },
  { category: 'heritage_hotels', province: 'Chiang Mai', count: 6, placeType: 'heritage', description: 'Heritage hotels and boutique stays in Chiang Mai - Lanna architecture, converted temples, historic properties' },
  { category: 'heritage_hotels', province: 'Ayutthaya', count: 4, placeType: 'heritage', description: 'Heritage hotels near Ayutthaya ruins - river resorts, historic properties' },
  { category: 'heritage_hotels', province: 'Phuket', count: 5, placeType: 'heritage', description: 'Heritage hotels in Phuket Old Town - Sino-Portuguese mansions, historic shophouses' },
  { category: 'heritage_hotels', province: 'Hua Hin', count: 4, placeType: 'heritage', description: 'Historic beach resorts and royal retreat hotels in Hua Hin' },
  { category: 'heritage_hotels', province: 'various', count: 8, placeType: 'heritage', description: 'Unique heritage stays across Thailand - converted rice barns, traditional Thai houses, historic villas' },

  // More Hidden Gems
  { category: 'local_festivals', province: 'various', count: 8, placeType: 'attraction', description: 'Unique local festivals and celebrations worth timing a trip around' },
  { category: 'artisan_villages', province: 'various', count: 8, placeType: 'attraction', description: 'Traditional craft villages - silk weaving, pottery, woodcarving, silverwork' },
  { category: 'offbeat_temples', province: 'various', count: 10, placeType: 'attraction', description: 'Unusual and quirky temples most tourists never see' },
  { category: 'local_experiences', province: 'various', count: 10, placeType: 'activity', description: 'Authentic local experiences - rice farming, fishing villages, local ceremonies' },
  { category: 'secret_beaches', province: 'various', count: 8, placeType: 'attraction', description: 'Hidden beaches without crowds - locals only spots' },
  { category: 'mountain_retreats', province: 'various', count: 6, placeType: 'attraction', description: 'Remote mountain villages and hill tribe experiences' },
  { category: 'food_markets_local', province: 'various', count: 8, placeType: 'attraction', description: 'Local food markets that tourists rarely visit - morning markets, village markets' },
  { category: 'wildlife_encounters', province: 'various', count: 6, placeType: 'activity', description: 'Ethical wildlife experiences - bird watching, marine life, conservation projects' },
  { category: 'historic_sites', province: 'various', count: 8, placeType: 'attraction', description: 'Lesser-known historical sites - ancient cities, archaeological sites, war memorials' },
  { category: 'river_experiences', province: 'various', count: 6, placeType: 'activity', description: 'River and canal experiences - homestays, boat trips, floating communities' },
]

const CATEGORIES = [
  'beach', 'nightlife', 'culture', 'food', 'nature', 'wellness', 'adventure',
  'party', 'relaxation', 'romantic', 'family', 'budget', 'luxury', 'nomad',
  'authentic', 'temples', 'history', 'photography', 'trekking',
  'skill_building', 'certification', 'creative', 'physical',
  'guided', 'day_trip', 'small_group', 'street_food', 'vegetarian',
  'fast_wifi', 'community', 'heritage'
]

interface GeneratedPlace {
  name: string
  slug: string
  description: string
  about: string
  category: string
  location: string
  province: string
  place_type: string
  is_hidden_gem: boolean
  categories: Record<string, number>
  metadata: Record<string, unknown>
}

async function generatePlaces(
  genCategory: string,
  province: string,
  count: number,
  placeType: string,
  description: string
): Promise<GeneratedPlace[]> {
  const isHeritage = placeType === 'heritage'

  const prompt = `Generate ${count} REAL, SPECIFIC places in Thailand for: "${description}"
${province !== 'various' ? `Focus on ${province} area.` : 'Include places from different provinces across Thailand.'}

Requirements:
- REAL places that actually exist (can be verified)
- Focus on places that are UNIQUE, AUTHENTIC, or LESSER-KNOWN
- Include specific insider tips and booking advice
- ${isHeritage ? 'For heritage hotels: include room rate range, best room types, and what makes them special historically' : ''}

For each place provide:
- name: The actual/official name
- description: 1-2 sentence engaging hook
- about: 2-3 sentences with specific insider tips${isHeritage ? ', room recommendations, and price range (THB/night)' : ''}
- location: Specific area/address
- province: The Thai province
- is_hidden_gem: true if lesser-known
- categories: Score relevant categories 0.0-1.0 (only scores > 0.3)
${isHeritage ? '- Include "heritage": 0.9+ and "luxury" or "romantic" scores as appropriate' : ''}

Categories: ${CATEGORIES.join(', ')}

Return JSON array only:
[
  {
    "name": "Place Name",
    "description": "Short engaging description",
    "about": "Detailed description with tips${isHeritage ? ', price range ~2,500-8,000 THB/night' : ''}",
    "location": "Specific location",
    "province": "Province Name",
    "is_hidden_gem": true,
    "categories": { "heritage": 0.95, "romantic": 0.8, "history": 0.9 }
  }
]`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  const jsonMatch = content.text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    console.error('Failed to parse:', content.text.substring(0, 500))
    throw new Error('Failed to extract JSON')
  }

  const places = JSON.parse(jsonMatch[0])

  return places.map((p: any) => {
    const slug = `${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${placeType}`
    const topCategory = Object.entries(p.categories || {})
      .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || 'culture'

    return {
      name: p.name,
      slug,
      description: p.description || '',
      about: p.about || '',
      category: topCategory,
      location: p.location || '',
      province: p.province || 'Thailand',
      place_type: placeType,
      is_hidden_gem: p.is_hidden_gem || false,
      categories: p.categories || {},
      metadata: {
        aiGenerated: true,
        generatedAt: new Date().toISOString(),
        sourceCategory: genCategory,
        batch: 'heritage_gems_v1',
        ...(isHeritage && { affiliatePartner: 'agoda', bookingType: 'hotel' }),
      },
    }
  })
}

async function insertPlace(place: GeneratedPlace): Promise<boolean> {
  if (!sql) return false
  try {
    const existing = await sql`SELECT id FROM attractions WHERE slug = ${place.slug}`
    if (existing.length > 0) {
      console.log(`  Skipping ${place.name} (exists)`)
      return false
    }

    await sql`
      INSERT INTO attractions (
        slug, name, description, about, category, location, province,
        place_type, is_hidden_gem, is_pro_only, categories, metadata,
        external_ids, data_source, verification_status
      ) VALUES (
        ${place.slug}, ${place.name}, ${place.description}, ${place.about},
        ${place.category}, ${place.location}, ${place.province},
        ${place.place_type}, ${place.is_hidden_gem}, false,
        ${JSON.stringify(place.categories)}, ${JSON.stringify(place.metadata)},
        '{}', 'ai_generated', 'ai_scored'
      )
    `
    return true
  } catch (error) {
    console.error(`  Error inserting ${place.name}:`, error)
    return false
  }
}

async function main() {
  console.log('🏛️ Generating Heritage Hotels & Hidden Gems')
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}\n`)

  let totalGenerated = 0
  let totalInserted = 0

  for (const plan of GENERATION_PLAN) {
    const emoji = plan.placeType === 'heritage' ? '🏨' : '💎'
    console.log(`\n${emoji} ${plan.description} (${plan.count} places)...`)

    try {
      const places = await generatePlaces(
        plan.category,
        plan.province,
        plan.count,
        plan.placeType,
        plan.description
      )

      console.log(`  Generated ${places.length} places`)
      totalGenerated += places.length

      for (const place of places) {
        if (DRY_RUN) {
          console.log(`  + ${place.name} ${place.is_hidden_gem ? '💎' : ''}`)
        } else {
          const inserted = await insertPlace(place)
          if (inserted) {
            totalInserted++
            console.log(`  ✓ ${place.name} ${place.is_hidden_gem ? '💎' : ''}`)
          }
        }
      }

      await new Promise(r => setTimeout(r, 1000))
    } catch (error) {
      console.error(`  Error:`, error)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`Total generated: ${totalGenerated}`)
  if (!DRY_RUN) {
    console.log(`Total inserted: ${totalInserted}`)
    await sql?.end()
  }
}

main().catch(console.error)
