/**
 * Generate More Interesting Places
 *
 * Focused on unique, lesser-known, and exceptional places in Thailand
 *
 * Usage:
 *   npx tsx scripts/generate-interesting-places.ts
 *   npx tsx scripts/generate-interesting-places.ts --dry-run
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

// Focus on interesting, unique places
const GENERATION_PLAN = [
  // Unique cultural experiences
  { category: 'floating_villages', province: 'various', count: 6, placeType: 'attraction', description: 'Authentic floating villages and waterside communities' },
  { category: 'cave_temples', province: 'various', count: 8, placeType: 'attraction', description: 'Stunning cave temples with unique features' },
  { category: 'viewpoints', province: 'various', count: 10, placeType: 'attraction', description: 'Spectacular viewpoints and lookouts' },
  { category: 'hot_springs', province: 'various', count: 5, placeType: 'attraction', description: 'Natural hot springs and geothermal areas' },

  // Off-beat islands
  { category: 'secret_islands', province: 'various', count: 10, placeType: 'attraction', description: 'Lesser-known beautiful islands without crowds' },

  // Unique activities
  { category: 'elephant_sanctuaries', province: 'various', count: 5, placeType: 'activity', description: 'Ethical elephant sanctuaries' },
  { category: 'night_markets', province: 'various', count: 8, placeType: 'attraction', description: 'Best and most unique night markets' },
  { category: 'street_art', province: 'various', count: 5, placeType: 'attraction', description: 'Areas famous for street art and murals' },

  // Photography spots
  { category: 'sunrise_spots', province: 'various', count: 6, placeType: 'attraction', description: 'Best sunrise viewing locations' },
  { category: 'sunset_spots', province: 'various', count: 6, placeType: 'attraction', description: 'Best sunset viewing locations' },

  // Unique food experiences
  { category: 'michelin_street_food', province: 'Bangkok', count: 8, placeType: 'activity', description: 'Michelin-recognized street food stalls and local gems' },
  { category: 'regional_cuisine', province: 'Isaan', count: 6, placeType: 'activity', description: 'Authentic Isaan food experiences' },

  // Adventure
  { category: 'canyons_gorges', province: 'various', count: 5, placeType: 'attraction', description: 'Dramatic canyons and gorges for hiking' },
  { category: 'waterfalls_secret', province: 'various', count: 8, placeType: 'attraction', description: 'Hidden waterfalls off the tourist trail' },

  // Nomad-friendly
  { category: 'beach_cafes', province: 'various', count: 6, placeType: 'coworking', description: 'Beachside cafes with wifi perfect for remote work' },

  // Unique stays
  { category: 'treehouse_stays', province: 'various', count: 5, placeType: 'attraction', description: 'Treehouse accommodations and jungle stays' },
  { category: 'floating_hotels', province: 'various', count: 4, placeType: 'attraction', description: 'Floating bungalows and overwater stays' },
]

const CATEGORIES = [
  'beach', 'nightlife', 'culture', 'food', 'nature', 'wellness', 'adventure',
  'party', 'relaxation', 'romantic', 'family', 'budget', 'luxury', 'nomad',
  'authentic', 'temples', 'history', 'photography', 'trekking',
  'skill_building', 'certification', 'creative', 'physical',
  'guided', 'day_trip', 'small_group', 'street_food', 'vegetarian',
  'fast_wifi', 'community'
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
  const prompt = `Generate ${count} UNIQUE, INTERESTING places in Thailand for: "${description}"
${province !== 'various' ? `Focus on ${province} area.` : 'Include places from different provinces.'}

Requirements:
- REAL places that actually exist
- Focus on places that are UNIQUE, SPECIAL, or LESSER-KNOWN
- Avoid overly touristy/generic spots (unless they're truly exceptional)
- Include specific insider tips in the "about" field
- Mark truly hidden gems as is_hidden_gem: true

For each place provide:
- name: The actual name
- description: 1-2 sentence engaging hook
- about: 2-3 sentences with specific insider tips (best time to visit, what to bring, local secrets)
- location: Specific area/address
- province: The Thai province
- is_hidden_gem: true if lesser-known but excellent
- categories: Score relevant categories 0.0-1.0 (only include scores > 0.3)

Categories to score: ${CATEGORIES.join(', ')}

Return JSON array only:
[
  {
    "name": "Place Name",
    "description": "Short engaging description",
    "about": "Detailed description with insider tips",
    "location": "Specific location",
    "province": "Province Name",
    "is_hidden_gem": true,
    "categories": { "nature": 0.9, "photography": 0.85 }
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
        batch: 'interesting_places_v2',
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
  console.log('🌟 Generating Interesting Places')
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}\n`)

  let totalGenerated = 0
  let totalInserted = 0

  for (const plan of GENERATION_PLAN) {
    console.log(`\n📍 ${plan.description} (${plan.count} places)...`)

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
