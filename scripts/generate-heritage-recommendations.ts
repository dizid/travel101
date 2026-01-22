/**
 * Generate Nearby Recommendations for Heritage Sites
 *
 * Populates the attraction_recommendations table with AI-generated
 * restaurants, cafes, activities, viewpoints, and shops near heritage sites.
 *
 * Usage:
 *   npx tsx scripts/generate-heritage-recommendations.ts
 *   npx tsx scripts/generate-heritage-recommendations.ts --dry-run
 *   npx tsx scripts/generate-heritage-recommendations.ts --limit 5
 */

import { config } from 'dotenv'
config({ path: '.env' })
config({ path: '.env.local' })

import Anthropic from '@anthropic-ai/sdk'
import postgres from 'postgres'

const DRY_RUN = process.argv.includes('--dry-run')
const LIMIT_ARG = process.argv.find((arg) => arg.startsWith('--limit='))
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1], 10) : undefined

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL && !DRY_RUN) {
  console.error('DATABASE_URL required')
  process.exit(1)
}

const sql = DATABASE_URL ? postgres(DATABASE_URL) : null
const anthropic = new Anthropic()

interface HeritageSite {
  id: string
  slug: string
  name: string
  location: string
  province: string
  description: string
}

interface Recommendation {
  rec_type: 'restaurant' | 'cafe' | 'activity' | 'viewpoint' | 'shop' | 'hotel'
  name: string
  description: string
  why_special: string
  price_range: '$' | '$$' | '$$$' | '$$$$'
  google_maps_url: string | null
  is_pro_only: boolean
  sort_order: number
}

async function fetchHeritageSitesWithoutRecommendations(): Promise<HeritageSite[]> {
  if (!sql) return []

  const query = LIMIT
    ? sql`
        SELECT a.id, a.slug, a.name, a.location, a.province, a.description
        FROM attractions a
        LEFT JOIN attraction_recommendations ar ON a.id = ar.attraction_id
        WHERE a.place_type = 'heritage'
        GROUP BY a.id, a.slug, a.name, a.location, a.province, a.description
        HAVING COUNT(ar.id) = 0
        ORDER BY a.name
        LIMIT ${LIMIT}
      `
    : sql`
        SELECT a.id, a.slug, a.name, a.location, a.province, a.description
        FROM attractions a
        LEFT JOIN attraction_recommendations ar ON a.id = ar.attraction_id
        WHERE a.place_type = 'heritage'
        GROUP BY a.id, a.slug, a.name, a.location, a.province, a.description
        HAVING COUNT(ar.id) = 0
        ORDER BY a.name
      `

  return query as unknown as HeritageSite[]
}

async function generateRecommendations(site: HeritageSite): Promise<Recommendation[]> {
  const prompt = `Generate 5-6 REAL nearby recommendations for visitors to "${site.name}" in ${site.province}, Thailand.

Site context: ${site.description || 'A heritage site in Thailand'}
Location: ${site.location || site.province}

Generate recommendations that would genuinely help someone visiting this heritage site. Include:
- 1-2 restaurants (authentic local food within 5-10 min of the site)
- 1 cafe (good for resting after visiting, ideally with a view or heritage atmosphere)
- 1-2 activities (related experiences, walking tours, nearby attractions)
- 1 viewpoint OR shop (photo spots near the site, or craft/souvenir shops)

Requirements:
- REAL places that actually exist and can be verified
- Focus on places that complement visiting this specific heritage site
- Include specific reasons why each place is good for visitors to THIS site
- Price ranges should reflect actual Thai prices

For each recommendation provide:
- rec_type: "restaurant" | "cafe" | "activity" | "viewpoint" | "shop"
- name: Actual name of the place
- description: 1-2 sentences describing what it offers
- why_special: Why this is specifically good for someone visiting ${site.name}
- price_range: "$" (under 100 THB), "$$" (100-300 THB), "$$$" (300-800 THB), "$$$$" (800+ THB)
- google_maps_url: null (we'll add real URLs later if needed)
- is_pro_only: false for most, true for 1 exceptional recommendation
- sort_order: 1-6 (restaurants first, then cafes, activities, viewpoints/shops)

Return JSON array only:
[
  {
    "rec_type": "restaurant",
    "name": "Restaurant Name",
    "description": "What they serve and atmosphere",
    "why_special": "Why it's perfect after visiting ${site.name}",
    "price_range": "$$",
    "google_maps_url": null,
    "is_pro_only": false,
    "sort_order": 1
  }
]`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  const jsonMatch = content.text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    console.error('Failed to parse:', content.text.substring(0, 500))
    throw new Error('Failed to extract JSON')
  }

  return JSON.parse(jsonMatch[0]) as Recommendation[]
}

async function insertRecommendations(
  siteId: string,
  recommendations: Recommendation[]
): Promise<number> {
  if (!sql) return 0

  let inserted = 0
  for (const rec of recommendations) {
    try {
      await sql`
        INSERT INTO attraction_recommendations (
          attraction_id, rec_type, name, description, why_special,
          price_range, google_maps_url, is_pro_only, sort_order
        ) VALUES (
          ${siteId}, ${rec.rec_type}, ${rec.name}, ${rec.description},
          ${rec.why_special}, ${rec.price_range}, ${rec.google_maps_url},
          ${rec.is_pro_only}, ${rec.sort_order}
        )
      `
      inserted++
    } catch (error) {
      console.error(`    Error inserting ${rec.name}:`, error)
    }
  }
  return inserted
}

async function main() {
  console.log('🏛️ Generating Nearby Recommendations for Heritage Sites')
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  if (LIMIT) console.log(`Limit: ${LIMIT} sites`)
  console.log('')

  // Get heritage sites without recommendations
  const sites = DRY_RUN
    ? [
        {
          id: 'test-id',
          slug: 'ban-chiang',
          name: 'Ban Chiang Archaeological Site',
          location: 'Udon Thani',
          province: 'Udon Thani',
          description: 'UNESCO World Heritage Site with prehistoric artifacts',
        },
      ]
    : await fetchHeritageSitesWithoutRecommendations()

  console.log(`Found ${sites.length} heritage sites without recommendations\n`)

  let totalGenerated = 0
  let totalInserted = 0

  for (const site of sites) {
    console.log(`\n📍 ${site.name} (${site.province})`)

    try {
      const recommendations = await generateRecommendations(site)
      console.log(`   Generated ${recommendations.length} recommendations`)
      totalGenerated += recommendations.length

      if (DRY_RUN) {
        for (const rec of recommendations) {
          const proTag = rec.is_pro_only ? ' [PRO]' : ''
          console.log(`   ${rec.sort_order}. [${rec.rec_type}] ${rec.name} (${rec.price_range})${proTag}`)
          console.log(`      ${rec.why_special}`)
        }
      } else {
        const inserted = await insertRecommendations(site.id, recommendations)
        totalInserted += inserted
        console.log(`   Inserted ${inserted} recommendations`)
      }

      // Rate limiting - wait between API calls
      await new Promise((r) => setTimeout(r, 1500))
    } catch (error) {
      console.error(`   Error processing ${site.name}:`, error)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`Total recommendations generated: ${totalGenerated}`)
  if (!DRY_RUN) {
    console.log(`Total recommendations inserted: ${totalInserted}`)
    await sql?.end()
  }
}

main().catch(console.error)
