/**
 * AI Place Generation Script
 *
 * Generates Thailand travel places using Claude AI.
 * Cost estimate: ~$5 for 200 places
 *
 * Usage:
 *   npx tsx scripts/generate-places.ts
 *
 * Or dry-run (output SQL without inserting):
 *   npx tsx scripts/generate-places.ts --dry-run
 */

import { config } from 'dotenv'
// Load both .env and .env.local
config({ path: '.env' })
config({ path: '.env.local' })

import Anthropic from '@anthropic-ai/sdk'
import postgres from 'postgres'

// Configuration
const DRY_RUN = process.argv.includes('--dry-run')
const BATCH_SIZE = 10 // Generate 10 places per API call
const TOTAL_PLACES = 200

// Database connection
const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL && !DRY_RUN) {
  console.error('DATABASE_URL environment variable required')
  process.exit(1)
}

const sql = DATABASE_URL ? postgres(DATABASE_URL) : null

// Anthropic client
const anthropic = new Anthropic()

// Place categories to generate
const GENERATION_PLAN = [
  { category: 'temples', province: 'Bangkok', count: 8, placeType: 'attraction' },
  { category: 'temples', province: 'Chiang Mai', count: 6, placeType: 'attraction' },
  { category: 'temples', province: 'Ayutthaya', count: 5, placeType: 'attraction' },
  { category: 'beaches', province: 'Phuket', count: 8, placeType: 'attraction' },
  { category: 'beaches', province: 'Krabi', count: 6, placeType: 'attraction' },
  { category: 'beaches', province: 'Koh Samui', count: 5, placeType: 'attraction' },
  { category: 'beaches', province: 'Koh Phangan', count: 4, placeType: 'attraction' },
  { category: 'islands', province: 'Surat Thani', count: 6, placeType: 'attraction' },
  { category: 'nature', province: 'Chiang Mai', count: 8, placeType: 'attraction' },
  { category: 'nature', province: 'Kanchanaburi', count: 5, placeType: 'attraction' },
  { category: 'nature', province: 'Khao Yai', count: 4, placeType: 'attraction' },
  { category: 'markets', province: 'Bangkok', count: 6, placeType: 'attraction' },
  { category: 'nightlife', province: 'Bangkok', count: 5, placeType: 'attraction' },
  { category: 'nightlife', province: 'Phuket', count: 4, placeType: 'attraction' },
  { category: 'nightlife', province: 'Pattaya', count: 3, placeType: 'attraction' },
  { category: 'food_experiences', province: 'Bangkok', count: 8, placeType: 'activity' },
  { category: 'food_experiences', province: 'Chiang Mai', count: 5, placeType: 'activity' },
  { category: 'cooking_classes', province: 'Bangkok', count: 4, placeType: 'course' },
  { category: 'cooking_classes', province: 'Chiang Mai', count: 4, placeType: 'course' },
  { category: 'diving', province: 'Koh Tao', count: 5, placeType: 'activity' },
  { category: 'diving', province: 'Phuket', count: 3, placeType: 'activity' },
  { category: 'muay_thai', province: 'Bangkok', count: 3, placeType: 'activity' },
  { category: 'muay_thai', province: 'Phuket', count: 2, placeType: 'activity' },
  { category: 'wellness', province: 'Koh Phangan', count: 5, placeType: 'activity' },
  { category: 'wellness', province: 'Chiang Mai', count: 4, placeType: 'activity' },
  { category: 'day_tours', province: 'Bangkok', count: 6, placeType: 'tour' },
  { category: 'day_tours', province: 'Chiang Mai', count: 5, placeType: 'tour' },
  { category: 'day_tours', province: 'Phuket', count: 5, placeType: 'tour' },
  { category: 'adventure', province: 'Chiang Mai', count: 5, placeType: 'activity' },
  { category: 'adventure', province: 'Krabi', count: 4, placeType: 'activity' },
  { category: 'coworking', province: 'Bangkok', count: 5, placeType: 'coworking' },
  { category: 'coworking', province: 'Chiang Mai', count: 5, placeType: 'coworking' },
  { category: 'coworking', province: 'Koh Lanta', count: 2, placeType: 'coworking' },
  { category: 'hidden_gems', province: 'various', count: 15, placeType: 'attraction' },
]

// Category scoring dimensions
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
  placeType: string
): Promise<GeneratedPlace[]> {
  const prompt = `Generate ${count} real, specific Thailand travel places for the category "${genCategory}" in/near ${province}.

For each place, provide:
- name: The actual name of the place (real places preferred)
- description: 1-2 sentence engaging description
- about: 2-3 sentence detailed description with insider tips
- location: Specific location/area within the province
- is_hidden_gem: true if it's lesser-known but excellent
- categories: Score each relevant category 0.0-1.0 (only include scores > 0.3)

Categories to score: ${CATEGORIES.join(', ')}

Return as JSON array:
[
  {
    "name": "Place Name",
    "description": "Short engaging description",
    "about": "Detailed description with tips",
    "location": "Specific area",
    "is_hidden_gem": false,
    "categories": {
      "culture": 0.9,
      "temples": 0.95,
      "photography": 0.8
    }
  }
]

Focus on REAL places that exist in Thailand. Be specific and accurate. Include a mix of popular and lesser-known spots.`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type')
  }

  // Extract JSON from response
  const jsonMatch = content.text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    console.error('Failed to parse response:', content.text.substring(0, 500))
    throw new Error('Failed to extract JSON from response')
  }

  const places: Array<{
    name: string
    description: string
    about: string
    location: string
    is_hidden_gem: boolean
    categories: Record<string, number>
  }> = JSON.parse(jsonMatch[0])

  // Map to our format
  return places.map(p => {
    const slug = `${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${placeType}`

    // Determine primary category from scores
    const topCategory = Object.entries(p.categories)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'culture'

    return {
      name: p.name,
      slug,
      description: p.description,
      about: p.about,
      category: topCategory,
      location: p.location,
      province: province === 'various' ? 'Thailand' : province,
      place_type: placeType,
      is_hidden_gem: p.is_hidden_gem,
      categories: p.categories,
      metadata: {
        aiGenerated: true,
        generatedAt: new Date().toISOString(),
        sourceCategory: genCategory,
      },
    }
  })
}

async function insertPlace(place: GeneratedPlace): Promise<boolean> {
  if (!sql) return false

  try {
    // Check for existing slug
    const existing = await sql`
      SELECT id FROM attractions WHERE slug = ${place.slug}
    `
    if (existing.length > 0) {
      console.log(`  Skipping ${place.name} (slug exists)`)
      return false
    }

    await sql`
      INSERT INTO attractions (
        slug, name, description, about, category, location, province,
        place_type, is_hidden_gem, is_pro_only, categories, metadata,
        external_ids, data_source, verification_status
      ) VALUES (
        ${place.slug},
        ${place.name},
        ${place.description},
        ${place.about},
        ${place.category},
        ${place.location},
        ${place.province},
        ${place.place_type},
        ${place.is_hidden_gem},
        false,
        ${JSON.stringify(place.categories)},
        ${JSON.stringify(place.metadata)},
        '{}',
        'ai_generated',
        'ai_scored'
      )
    `
    return true
  } catch (error) {
    console.error(`  Error inserting ${place.name}:`, error)
    return false
  }
}

function generateSQL(place: GeneratedPlace): string {
  const escapedName = place.name.replace(/'/g, "''")
  const escapedDesc = place.description.replace(/'/g, "''")
  const escapedAbout = place.about.replace(/'/g, "''")
  const escapedLocation = place.location.replace(/'/g, "''")

  return `INSERT INTO attractions (slug, name, description, about, category, location, province, place_type, is_hidden_gem, is_pro_only, categories, metadata, external_ids, data_source, verification_status)
VALUES ('${place.slug}', '${escapedName}', '${escapedDesc}', '${escapedAbout}', '${place.category}', '${escapedLocation}', '${place.province}', '${place.place_type}', ${place.is_hidden_gem}, false, '${JSON.stringify(place.categories)}', '${JSON.stringify(place.metadata)}', '{}', 'ai_generated', 'ai_scored')
ON CONFLICT (slug) DO NOTHING;`
}

async function main() {
  console.log('🏝️ Thailand Place Generator')
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (SQL output only)' : 'LIVE (inserting to database)'}`)
  console.log('')

  let totalGenerated = 0
  let totalInserted = 0
  const allSQL: string[] = []

  for (const plan of GENERATION_PLAN) {
    console.log(`\n📍 Generating ${plan.count} ${plan.category} in ${plan.province}...`)

    try {
      const places = await generatePlaces(
        plan.category,
        plan.province,
        plan.count,
        plan.placeType
      )

      console.log(`  Generated ${places.length} places`)
      totalGenerated += places.length

      for (const place of places) {
        if (DRY_RUN) {
          allSQL.push(generateSQL(place))
          console.log(`  + ${place.name} (${place.place_type})`)
        } else {
          const inserted = await insertPlace(place)
          if (inserted) {
            totalInserted++
            console.log(`  ✓ ${place.name}`)
          }
        }
      }

      // Rate limiting - wait between batches
      await new Promise(r => setTimeout(r, 1000))

    } catch (error) {
      console.error(`  Error generating ${plan.category}:`, error)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`Total generated: ${totalGenerated}`)

  if (DRY_RUN) {
    console.log('\n-- SQL OUTPUT --\n')
    console.log(allSQL.join('\n\n'))
  } else {
    console.log(`Total inserted: ${totalInserted}`)
    await sql?.end()
  }
}

main().catch(console.error)
