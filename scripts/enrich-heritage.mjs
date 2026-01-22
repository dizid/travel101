#!/usr/bin/env node

/**
 * Heritage Enrichment Script
 *
 * Enriches heritage sites with:
 * - AI-generated historical timeline events
 * - Enhanced descriptions and metadata
 * - Images from Unsplash API
 *
 * Usage:
 *   node scripts/enrich-heritage.mjs --slug=grand-palace
 *   node scripts/enrich-heritage.mjs --all
 *   node scripts/enrich-heritage.mjs --seed
 *
 * Environment variables:
 *   DATABASE_URL - Neon PostgreSQL connection string
 *   ANTHROPIC_API_KEY - Claude API key
 *   UNSPLASH_ACCESS_KEY - Unsplash API key
 */

import dotenv from 'dotenv'
import { neon } from '@neondatabase/serverless'
import Anthropic from '@anthropic-ai/sdk'

// Load environment variables from .env and .env.local
dotenv.config()
dotenv.config({ path: '.env.local' })

// Load environment variables
const DATABASE_URL = process.env.DATABASE_URL
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required')
  process.exit(1)
}

const db = neon(DATABASE_URL)
const anthropic = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null

// Parse CLI arguments
const args = process.argv.slice(2)
const flags = {}
args.forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=')
    flags[key] = value || true
  }
})

// Thai historical eras for reference
const THAI_ERAS = [
  { name: 'Prehistoric', startYear: -40000, endYear: 500 },
  { name: 'Dvaravati Period', startYear: 500, endYear: 1000 },
  { name: 'Srivijaya Period', startYear: 700, endYear: 1300 },
  { name: 'Khmer Period', startYear: 800, endYear: 1400 },
  { name: 'Sukhothai Period', startYear: 1238, endYear: 1438 },
  { name: 'Ayutthaya Period', startYear: 1351, endYear: 1767 },
  { name: 'Thonburi Period', startYear: 1767, endYear: 1782 },
  { name: 'Rattanakosin Period', startYear: 1782, endYear: 1932 },
  { name: 'Modern', startYear: 1932, endYear: 2100 },
]

// Seed data for initial heritage sites
const HERITAGE_SITES = [
  {
    name: 'Historic City of Ayutthaya',
    slug: 'ayutthaya-historical-park',
    province: 'Ayutthaya',
    description: 'UNESCO World Heritage Site featuring the majestic ruins of the former capital of the Kingdom of Siam.',
    metadata: {
      constructionDate: '1351',
      constructionEra: 'Ayutthaya Period',
      architecturalStyles: ['Khmer', 'Thai', 'Sukhothai'],
      unescoStatus: 'world_heritage_site',
      unescoInscriptionYear: 1991,
      unescoCriteria: ['iii'],
      kingdomDynasty: 'Ayutthaya Kingdom',
      entryFeeTHB: 50,
      entryFeeForeignerTHB: 50,
      openingHours: '08:00-18:00',
      dressCode: 'Casual, comfortable shoes recommended',
      heritageType: 'historical_park',
      historicalSignificance: 'Former capital of Siam for 417 years, showcasing the golden age of Thai civilization.',
    },
  },
  {
    name: 'Historic Town of Sukhothai',
    slug: 'sukhothai-historical-park',
    province: 'Sukhothai',
    description: 'The birthplace of Thai civilization, featuring ancient temples and Buddha statues from the first Thai kingdom.',
    metadata: {
      constructionDate: '1238',
      constructionEra: 'Sukhothai Period',
      architecturalStyles: ['Sukhothai', 'Khmer', 'Sri Lankan'],
      unescoStatus: 'world_heritage_site',
      unescoInscriptionYear: 1991,
      unescoCriteria: ['i', 'iii'],
      kingdomDynasty: 'Sukhothai Kingdom',
      entryFeeTHB: 40,
      entryFeeForeignerTHB: 100,
      openingHours: '06:00-21:00',
      heritageType: 'historical_park',
      historicalSignificance: 'First unified Thai kingdom and origin of Thai script, art, and culture.',
    },
  },
  {
    name: 'Grand Palace',
    slug: 'grand-palace-bangkok',
    province: 'Bangkok',
    description: 'The most sacred and spectacular royal complex in Thailand, home to Wat Phra Kaew and the Emerald Buddha.',
    metadata: {
      constructionDate: '1782',
      constructionEra: 'Rattanakosin Period',
      architecturalStyles: ['Rattanakosin', 'Thai', 'European'],
      kingdomDynasty: 'Chakri Dynasty',
      religiousSignificance: 'Houses the most sacred Buddha image in Thailand',
      entryFeeTHB: 0,
      entryFeeForeignerTHB: 500,
      openingHours: '08:30-15:30',
      dressCode: 'Shoulders and knees covered, no sandals',
      heritageType: 'palace',
      historicalSignificance: 'Official residence of the Kings of Siam since 1782.',
    },
  },
  {
    name: 'Wat Pho',
    slug: 'wat-pho-bangkok',
    province: 'Bangkok',
    description: 'Temple of the Reclining Buddha, one of the oldest and largest temples in Bangkok.',
    metadata: {
      constructionDate: '1688',
      constructionEra: 'Ayutthaya Period',
      architecturalStyles: ['Ayutthaya', 'Rattanakosin'],
      religiousSignificance: 'Houses the 46-meter reclining Buddha and birthplace of Thai massage',
      entryFeeTHB: 0,
      entryFeeForeignerTHB: 300,
      openingHours: '08:00-18:30',
      dressCode: 'Shoulders and knees covered',
      heritageType: 'temple',
      historicalSignificance: 'First public university in Thailand and center of traditional medicine.',
    },
  },
  {
    name: 'Wat Arun',
    slug: 'wat-arun-bangkok',
    province: 'Bangkok',
    description: 'The Temple of Dawn, famous for its stunning riverside location and porcelain-encrusted spires.',
    metadata: {
      constructionDate: '1768',
      constructionEra: 'Thonburi Period',
      architecturalStyles: ['Khmer', 'Thai'],
      religiousSignificance: 'Named after Aruna, the Hindu god of dawn',
      entryFeeTHB: 0,
      entryFeeForeignerTHB: 100,
      openingHours: '08:00-18:00',
      dressCode: 'Shoulders and knees covered',
      heritageType: 'temple',
      historicalSignificance: 'Royal temple during the Thonburi period, symbol of Bangkok.',
    },
  },
  {
    name: 'Wat Phra That Doi Suthep',
    slug: 'doi-suthep-chiang-mai',
    province: 'Chiang Mai',
    description: 'Sacred temple overlooking Chiang Mai, one of northern Thailand\'s most important pilgrimage sites.',
    metadata: {
      constructionDate: '1383',
      constructionEra: 'Sukhothai Period',
      architecturalStyles: ['Lanna', 'Sukhothai'],
      religiousSignificance: 'Contains a relic of the Buddha',
      entryFeeTHB: 30,
      entryFeeForeignerTHB: 30,
      openingHours: '06:00-18:00',
      dressCode: 'Shoulders and knees covered',
      heritageType: 'temple',
      historicalSignificance: 'Founded by the legendary white elephant that chose the temple site.',
    },
  },
  {
    name: 'Ban Chiang Archaeological Site',
    slug: 'ban-chiang',
    province: 'Udon Thani',
    description: 'UNESCO World Heritage prehistoric settlement revealing Southeast Asia\'s earliest bronze age culture.',
    metadata: {
      constructionDate: '-3600',
      constructionEra: 'Prehistoric',
      unescoStatus: 'world_heritage_site',
      unescoInscriptionYear: 1992,
      unescoCriteria: ['iii'],
      entryFeeTHB: 30,
      entryFeeForeignerTHB: 150,
      openingHours: '09:00-16:00',
      heritageType: 'archaeological',
      historicalSignificance: 'Evidence of the earliest known Bronze Age civilization in Southeast Asia.',
    },
  },
  {
    name: 'Phimai Historical Park',
    slug: 'phimai-historical-park',
    province: 'Nakhon Ratchasima',
    description: 'The largest Khmer temple complex in Thailand, predating Angkor Wat.',
    metadata: {
      constructionDate: '1108',
      constructionEra: 'Khmer Period',
      architecturalStyles: ['Khmer', 'Baphuon'],
      kingdomDynasty: 'Khmer Empire',
      entryFeeTHB: 40,
      entryFeeForeignerTHB: 100,
      openingHours: '07:30-18:00',
      heritageType: 'ruins',
      historicalSignificance: 'Connected to Angkor by ancient Khmer highway, older than Angkor Wat.',
    },
  },
  {
    name: 'Phra Pathom Chedi',
    slug: 'phra-pathom-chedi',
    province: 'Nakhon Pathom',
    description: 'The tallest stupa in the world and one of the oldest Buddhist structures in Thailand.',
    metadata: {
      constructionDate: '300',
      constructionEra: 'Dvaravati Period',
      architecturalStyles: ['Dvaravati', 'Rattanakosin'],
      religiousSignificance: 'Marks the spot where Buddhism first arrived in Thailand',
      entryFeeTHB: 0,
      entryFeeForeignerTHB: 40,
      openingHours: '06:00-18:00',
      dressCode: 'Modest clothing',
      heritageType: 'monument',
      historicalSignificance: 'At 120m, the tallest stupa in the world.',
    },
  },
  {
    name: 'Wat Rong Khun (White Temple)',
    slug: 'white-temple-chiang-rai',
    province: 'Chiang Rai',
    description: 'A contemporary Buddhist temple known for its striking white exterior and surreal sculptures.',
    metadata: {
      constructionDate: '1997',
      constructionEra: 'Modern',
      architecturalStyles: ['Contemporary Thai', 'Buddhist'],
      religiousSignificance: 'Represents Buddhist purity and enlightenment',
      entryFeeTHB: 0,
      entryFeeForeignerTHB: 100,
      openingHours: '08:00-17:00',
      dressCode: 'Shoulders and knees covered',
      heritageType: 'temple',
      historicalSignificance: 'Modern masterpiece by artist Chalermchai Kositpipat, still under construction.',
    },
  },
  {
    name: 'Sanctuary of Truth',
    slug: 'sanctuary-of-truth-pattaya',
    province: 'Chonburi',
    description: 'A massive wooden structure showcasing traditional Thai craftsmanship and Buddhist-Hindu philosophy.',
    metadata: {
      constructionDate: '1981',
      constructionEra: 'Modern',
      architecturalStyles: ['Khmer', 'Thai', 'Lanna', 'Ayutthaya'],
      religiousSignificance: 'Represents ancient philosophy and Buddhist-Hindu beliefs',
      entryFeeTHB: 450,
      entryFeeForeignerTHB: 500,
      openingHours: '08:00-18:00',
      heritageType: 'temple',
      historicalSignificance: 'Largest wooden structure in the world, built entirely without nails.',
    },
  },
  {
    name: 'Jim Thompson House',
    slug: 'jim-thompson-house',
    province: 'Bangkok',
    description: 'A museum showcasing traditional Thai architecture and the legacy of the American silk entrepreneur.',
    metadata: {
      constructionDate: '1959',
      constructionEra: 'Modern',
      architecturalStyles: ['Traditional Thai'],
      entryFeeTHB: 150,
      entryFeeForeignerTHB: 200,
      openingHours: '10:00-18:00',
      heritageType: 'museum',
      historicalSignificance: 'Home of Jim Thompson who revived the Thai silk industry.',
    },
  },
]

/**
 * Fetch images from Unsplash API for a heritage site
 */
async function fetchUnsplashImages(siteName, province, count = 6) {
  if (!UNSPLASH_ACCESS_KEY) {
    console.log('⚠️  UNSPLASH_ACCESS_KEY not set, skipping image fetch')
    return []
  }

  const queries = [
    `${siteName} Thailand`,
    `${siteName}`,
    `${province} Thailand temple`,
  ]

  const images = []

  for (const query of queries) {
    if (images.length >= count) break

    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
        {
          headers: {
            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          },
        }
      )

      if (!response.ok) {
        console.error(`Unsplash API error: ${response.status}`)
        continue
      }

      const data = await response.json()

      for (const photo of data.results) {
        if (images.length >= count) break
        if (images.some(img => img.id === photo.id)) continue

        images.push({
          id: photo.id,
          imageUrl: photo.urls.regular,
          thumbnailUrl: photo.urls.small,
          altText: photo.alt_description || `${siteName} - ${province}, Thailand`,
          caption: photo.description || null,
          source: 'unsplash',
          sourceUrl: photo.links.html,
          photographer: photo.user.name,
          photographerUrl: photo.user.links.html,
          license: 'unsplash',
          width: photo.width,
          height: photo.height,
          blurHash: photo.blur_hash,
        })
      }
    } catch (error) {
      console.error(`Failed to fetch images for query "${query}":`, error.message)
    }
  }

  return images
}

/**
 * Generate historical timeline using Claude AI
 */
async function generateTimeline(site) {
  if (!anthropic) {
    console.log('⚠️  ANTHROPIC_API_KEY not set, skipping AI enrichment')
    return []
  }

  const prompt = `Generate a historical timeline of 5-8 significant events for this Thai heritage site:

Name: ${site.name}
Location: ${site.province}, Thailand
Era: ${site.metadata?.constructionEra || 'Unknown'}
Construction Date: ${site.metadata?.constructionDate || 'Unknown'}
Description: ${site.description}

Return a JSON array of events. Each event should have:
- eventYear: number (the year, use negative for BCE)
- eventYearEnd: number or null (for date ranges)
- eventEra: string (one of: Prehistoric, Dvaravati Period, Srivijaya Period, Khmer Period, Sukhothai Period, Ayutthaya Period, Thonburi Period, Rattanakosin Period, Modern)
- title: string (short event title, max 100 chars)
- description: string (2-3 sentences describing the event)
- eventType: string (one of: construction, destruction, restoration, designation, event, discovery)
- isApproximate: boolean (true if the date is not precisely known)

Focus on historically accurate events. Include:
1. Original construction/founding
2. Major expansions or renovations
3. Any destruction or damage events
4. Significant restorations
5. UNESCO designation if applicable
6. Important historical events that occurred there

Return ONLY the JSON array, no other text.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = response.content[0].text
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('No JSON array found in response')
    }

    const events = JSON.parse(jsonMatch[0])
    return events.map((event, index) => ({
      ...event,
      sortOrder: index,
    }))
  } catch (error) {
    console.error('Failed to generate timeline:', error.message)
    return []
  }
}

/**
 * Generate enhanced description using Claude AI
 */
async function generateEnhancedDescription(site) {
  if (!anthropic) {
    return { about: site.description, historicalSignificance: null }
  }

  const prompt = `Write an engaging, detailed description for this Thai heritage site for a travel website:

Name: ${site.name}
Location: ${site.province}, Thailand
Current Description: ${site.description}
Era: ${site.metadata?.constructionEra || 'Unknown'}

Provide a JSON object with:
1. "about": A 3-4 paragraph detailed description that covers:
   - What visitors will see
   - The atmosphere and experience
   - Key highlights and must-sees
   - What makes it special

2. "historicalSignificance": A 2-3 paragraph explanation of the historical importance, including:
   - Role in Thai history
   - Cultural and religious importance
   - Impact on Thai art, architecture, or society

Keep the tone informative but engaging. Write for intelligent travelers who want to understand the significance of what they're seeing.

Return ONLY the JSON object, no other text.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = response.content[0].text
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON object found in response')
    }

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Failed to generate description:', error.message)
    return { about: site.description, historicalSignificance: null }
  }
}

/**
 * Insert or update a heritage site in the database
 */
async function upsertHeritageSite(site) {
  // Check if site exists
  const existing = await db`
    SELECT id FROM attractions WHERE slug = ${site.slug}
  `

  let attractionId

  if (existing.length > 0) {
    attractionId = existing[0].id
    // Update existing site
    await db`
      UPDATE attractions SET
        name = ${site.name},
        description = ${site.description},
        about = ${site.about || site.description},
        province = ${site.province},
        place_type = 'heritage',
        metadata = ${JSON.stringify(site.metadata)},
        category = 'culture',
        updated_at = NOW()
      WHERE id = ${attractionId}
    `
    console.log(`✅ Updated: ${site.name}`)
  } else {
    // Insert new site
    const result = await db`
      INSERT INTO attractions (
        slug, name, description, about, province, place_type, metadata, category, is_hidden_gem, verification_status
      ) VALUES (
        ${site.slug},
        ${site.name},
        ${site.description},
        ${site.about || site.description},
        ${site.province},
        'heritage',
        ${JSON.stringify(site.metadata)},
        'culture',
        false,
        'human_verified'
      )
      RETURNING id
    `
    attractionId = result[0].id
    console.log(`✅ Created: ${site.name}`)
  }

  return attractionId
}

/**
 * Insert images for a heritage site
 */
async function insertImages(attractionId, images) {
  if (images.length === 0) return

  // Delete existing images for this attraction
  await db`DELETE FROM heritage_images WHERE attraction_id = ${attractionId}`

  for (let i = 0; i < images.length; i++) {
    const img = images[i]
    await db`
      INSERT INTO heritage_images (
        attraction_id, image_url, thumbnail_url, alt_text, caption,
        source, source_url, photographer, photographer_url, license,
        is_primary, display_order, width, height, blur_hash
      ) VALUES (
        ${attractionId},
        ${img.imageUrl},
        ${img.thumbnailUrl},
        ${img.altText},
        ${img.caption},
        ${img.source},
        ${img.sourceUrl},
        ${img.photographer},
        ${img.photographerUrl},
        ${img.license},
        ${i === 0},
        ${i},
        ${img.width},
        ${img.height},
        ${img.blurHash}
      )
    `
  }

  console.log(`   📷 Added ${images.length} images`)
}

/**
 * Retry wrapper for database operations
 */
async function withRetry(operation, maxRetries = 3, delay = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      if (attempt === maxRetries || !error.message?.includes('fetch failed')) {
        throw error
      }
      console.log(`   ⏳ Connection failed, retrying (${attempt}/${maxRetries})...`)
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }
}

/**
 * Insert timeline events for a heritage site
 */
async function insertTimeline(attractionId, events) {
  if (events.length === 0) return

  // Delete existing events for this attraction
  await withRetry(() => db`DELETE FROM heritage_events WHERE attraction_id = ${attractionId}`)

  for (const event of events) {
    await withRetry(() => db`
      INSERT INTO heritage_events (
        attraction_id, event_year, event_year_end, event_era,
        title, description, event_type, is_approximate, sort_order
      ) VALUES (
        ${attractionId},
        ${event.eventYear},
        ${event.eventYearEnd || null},
        ${event.eventEra},
        ${event.title},
        ${event.description},
        ${event.eventType},
        ${event.isApproximate || false},
        ${event.sortOrder}
      )
    `)
  }

  console.log(`   📜 Added ${events.length} timeline events`)
}

/**
 * Enrich a single heritage site
 */
async function enrichSite(site) {
  console.log(`\n🏛️  Enriching: ${site.name}`)

  // Generate enhanced description
  const { about, historicalSignificance } = await generateEnhancedDescription(site)
  site.about = about
  if (historicalSignificance) {
    site.metadata.historicalSignificance = historicalSignificance
  }

  // Upsert the site
  const attractionId = await upsertHeritageSite(site)

  // Fetch and insert images
  const images = await fetchUnsplashImages(site.name, site.province)
  await insertImages(attractionId, images)

  // Generate and insert timeline
  const events = await generateTimeline(site)
  await insertTimeline(attractionId, events)

  return attractionId
}

/**
 * Main function
 */
async function main() {
  console.log('🏛️  Heritage Enrichment Script')
  console.log('================================\n')

  if (flags.seed) {
    // Seed all predefined heritage sites
    console.log('Seeding all heritage sites...\n')

    let completed = 0
    let errors = []

    for (const site of HERITAGE_SITES) {
      try {
        await enrichSite(site)
        completed++
      } catch (error) {
        console.error(`❌ Failed to enrich ${site.name}: ${error.message}`)
        errors.push(site.name)
      }
      // Rate limiting - longer delay to avoid connection issues
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    console.log('\n✅ Seeding complete!')
    console.log(`   Completed: ${completed}/${HERITAGE_SITES.length}`)
    if (errors.length > 0) {
      console.log(`   Failed: ${errors.join(', ')}`)
    }
  } else if (flags.slug) {
    // Enrich a specific site by slug
    const existing = await db`
      SELECT * FROM attractions WHERE slug = ${flags.slug} AND place_type = 'heritage'
    `

    if (existing.length === 0) {
      console.error(`❌ Heritage site not found: ${flags.slug}`)
      process.exit(1)
    }

    const rawMetadata = existing[0].metadata
    const site = {
      ...existing[0],
      metadata: typeof rawMetadata === 'string' ? JSON.parse(rawMetadata) : (rawMetadata || {}),
    }

    await enrichSite(site)
    console.log('\n✅ Enrichment complete!')
  } else if (flags.all) {
    // Enrich all heritage sites
    const sites = await db`
      SELECT * FROM attractions WHERE place_type = 'heritage'
    `

    console.log(`Found ${sites.length} heritage sites to enrich\n`)

    for (const siteRow of sites) {
      const rawMetadata = siteRow.metadata
      await enrichSite({
        ...siteRow,
        metadata: typeof rawMetadata === 'string' ? JSON.parse(rawMetadata) : (rawMetadata || {}),
      })
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log('\n✅ All sites enriched!')
  } else {
    console.log('Usage:')
    console.log('  --seed         Seed all predefined heritage sites')
    console.log('  --slug=<slug>  Enrich a specific site by slug')
    console.log('  --all          Enrich all existing heritage sites')
  }
}

main().catch(console.error)
