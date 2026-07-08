import type { Context, Config } from '@netlify/functions'
import Anthropic from '@anthropic-ai/sdk'
import { getDb } from './lib/db.mts'
import { validateAdminKey } from './lib/security.mts'
import { checkRateLimit, getClientIp } from './lib/rate-limit.mts'

// Max length for the placeId field, enforced before any DB or Claude API
// call. This endpoint is admin-key gated, but the cap still protects
// against a misbehaving caller (or a leaked key) running up costs via an
// oversized/malformed payload.
const MAX_PLACE_ID_LENGTH = 200

// All category dimensions for scoring
const ALL_CATEGORIES = [
  // Experience type
  'beach', 'nightlife', 'culture', 'food', 'nature', 'wellness', 'adventure', 'party', 'relaxation',
  // Social/budget
  'romantic', 'family', 'budget', 'mid_range', 'luxury', 'nomad', 'authentic',
  // Specific interests
  'temples', 'history', 'photography', 'trekking',
  // Course-specific
  'skill_building', 'certification', 'creative', 'physical',
  // Tour-specific
  'guided', 'day_trip', 'small_group', 'private_tour',
  // Restaurant-specific
  'fine_dining', 'street_food', 'vegetarian', 'local_cuisine',
  // Co-working-specific
  'fast_wifi', 'community', 'twentyfour_hour_access',
] as const

type CategoryKey = typeof ALL_CATEGORIES[number]

interface CategoryScores {
  [key: string]: number
}

interface EnrichmentResult {
  categories: CategoryScores
  primary_category: string
  confidence: number
  reasoning: string
  cost_tier: 'free' | 'budget' | 'mid_range' | 'luxury'
}

interface Place {
  id: string
  slug: string
  name: string
  description: string
  about: string | null
  category: string
  location: string | null
  province: string | null
  place_type: string
  metadata: Record<string, unknown>
}

interface RequestBody {
  action: 'enrich_single' | 'enrich_batch' | 'get_pending'
  placeId?: string
  limit?: number
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// Build the scoring prompt for Claude
function buildScoringPrompt(place: Place): string {
  const relevantCategories = getRelevantCategories(place.place_type)

  return `You are a travel categorization expert for Thailand. Score this place against travel categories.

SCORING RULES:
- Score each category from 0.0 to 1.0
- 0.0 = Not applicable at all
- 0.3-0.4 = Slightly relevant
- 0.5-0.6 = Moderately relevant
- 0.7-0.8 = Strong fit
- 0.9-1.0 = Perfect fit (primary characteristic)
- A place should have 1-3 scores of 0.8+ and many 0.0s
- Be conservative - only score high if clearly evident from the description

CATEGORIES TO SCORE:
${relevantCategories.map(cat => `- ${cat}`).join('\n')}

PLACE DETAILS:
Type: ${place.place_type}
Name: ${place.name}
Location: ${place.location || 'Thailand'}, ${place.province || ''}
Description: ${place.description}
${place.about ? `About: ${place.about}` : ''}
${place.metadata && Object.keys(place.metadata).length > 0 ? `Additional info: ${JSON.stringify(place.metadata)}` : ''}

COST TIER (assign one):
- "free" - temples, parks, beaches, viewpoints, street markets
- "budget" - under 500 THB (cheap eats, local tours, budget activities)
- "mid_range" - 500-2000 THB (day tours, cooking classes, spa treatments)
- "luxury" - over 2000 THB (fine dining, private tours, premium experiences)

OUTPUT FORMAT (JSON only, no markdown):
{
  "categories": {
    "beach": 0.0,
    "culture": 0.9,
    ...
  },
  "primary_category": "culture",
  "cost_tier": "free",
  "confidence": 0.85,
  "reasoning": "Brief 1-2 sentence explanation of top scores and cost tier"
}`
}

// Get relevant categories based on place type
function getRelevantCategories(placeType: string): string[] {
  const base = ['beach', 'nightlife', 'culture', 'food', 'nature', 'wellness', 'adventure',
                'party', 'relaxation', 'romantic', 'family', 'budget', 'luxury', 'nomad', 'authentic']

  switch (placeType) {
    case 'course':
      return [...base, 'skill_building', 'certification', 'creative', 'physical']
    case 'tour':
      return [...base, 'guided', 'day_trip', 'small_group', 'private_tour']
    case 'restaurant':
      return [...base, 'fine_dining', 'street_food', 'vegetarian', 'local_cuisine']
    case 'coworking':
      return [...base, 'fast_wifi', 'community', 'twentyfour_hour_access']
    default:
      return [...base, 'temples', 'history', 'photography', 'trekking']
  }
}

// Validate AI-generated scores
function validateScores(place: Place, scores: CategoryScores): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check score ranges
  for (const [category, score] of Object.entries(scores)) {
    if (typeof score !== 'number' || score < 0 || score > 1) {
      errors.push(`Invalid score for ${category}: ${score}`)
    }
  }

  // Type-specific validations
  if (place.place_type === 'coworking') {
    if ((scores.nomad || 0) < 0.6) {
      errors.push('Co-working space should have nomad score >= 0.6')
    }
  }

  if (place.place_type === 'restaurant') {
    if ((scores.food || 0) < 0.5) {
      errors.push('Restaurant should have food score >= 0.5')
    }
  }

  // Budget and luxury are generally mutually exclusive
  if ((scores.budget || 0) > 0.7 && (scores.luxury || 0) > 0.7) {
    errors.push('Cannot be both strongly budget and luxury')
  }

  // Beach locations should have some beach score
  const beachProvinces = ['phuket', 'krabi', 'surat thani', 'trat', 'rayong', 'chonburi']
  if (place.province && beachProvinces.includes(place.province.toLowerCase()) && (scores.beach || 0) < 0.2) {
    // Just a warning, not an error - inland places exist in coastal provinces
  }

  return { valid: errors.length === 0, errors }
}

// Derive cost tier from place data and category scores
function deriveCostTier(place: Place, scores: CategoryScores): 'free' | 'budget' | 'mid_range' | 'luxury' {
  // Check metadata for explicit price
  const meta = place.metadata as Record<string, unknown>
  if (meta?.priceTHB) {
    const price = Number(meta.priceTHB)
    if (price === 0) return 'free'
    if (price < 500) return 'budget'
    if (price < 2000) return 'mid_range'
    return 'luxury'
  }

  // Check for priceRange string
  if (meta?.priceRange) {
    const range = String(meta.priceRange)
    if (range === '$') return 'budget'
    if (range === '$$') return 'mid_range'
    if (range === '$$$' || range === '$$$$') return 'luxury'
  }

  // Infer from place type
  const freeTypes = ['temple', 'beach', 'viewpoint', 'park', 'market', 'monument']
  if (freeTypes.some(t => place.place_type.includes(t) || place.category.includes(t))) {
    return 'free'
  }

  // Infer from category scores
  if ((scores.luxury || 0) > 0.7) return 'luxury'
  if ((scores.budget || 0) > 0.7) return 'budget'

  // Default based on place type
  if (place.place_type === 'tour') return 'mid_range'
  if (place.place_type === 'course') return 'mid_range'
  if (place.place_type === 'coworking') return 'mid_range'
  if (place.place_type === 'restaurant' && (scores.fine_dining || 0) > 0.5) return 'luxury'
  if (place.place_type === 'restaurant') return 'budget'

  // Default for attractions (temples, monuments, parks are often free)
  if ((scores.temples || 0) > 0.5 || (scores.nature || 0) > 0.7) return 'free'

  return 'budget'
}

// Call Claude to score a place
async function scorePlace(anthropic: Anthropic, place: Place): Promise<EnrichmentResult> {
  const prompt = buildScoringPrompt(place)

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  })

  const contentBlock = response.content[0]
  const text = contentBlock.type === 'text' ? contentBlock.text : ''

  // Parse JSON response
  try {
    // Remove any markdown code blocks if present
    const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const result = JSON.parse(jsonText) as EnrichmentResult
    return result
  } catch (e) {
    console.error('Failed to parse AI response:', text)
    throw new Error('Failed to parse AI scoring response')
  }
}

// Enrich a single place
async function enrichSinglePlace(db: ReturnType<typeof getDb>, anthropic: Anthropic, placeId: string) {
  // Fetch place
  const places: Place[] = await db`
    SELECT id, slug, name, description, about, category, location, province, place_type, metadata
    FROM attractions WHERE id = ${placeId}
  `

  if (places.length === 0) {
    return { error: 'Place not found' }
  }

  const place = places[0]

  // Score with AI
  const result = await scorePlace(anthropic, place)

  // Validate
  const validation = validateScores(place, result.categories)
  const status = validation.valid && result.confidence >= 0.7 ? 'ai_scored' : 'needs_review'

  // Derive cost_tier from AI result or infer from scores
  const costTier = result.cost_tier || deriveCostTier(place, result.categories)

  // Update database
  await db`
    UPDATE attractions SET
      categories = ${JSON.stringify(result.categories)},
      cost_tier = ${costTier},
      ai_enriched_at = NOW(),
      verification_status = ${status},
      metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{ai_confidence}',
        ${JSON.stringify(result.confidence)}
      )
    WHERE id = ${placeId}
  `

  return {
    placeId,
    slug: place.slug,
    categories: result.categories,
    primary_category: result.primary_category,
    cost_tier: costTier,
    confidence: result.confidence,
    reasoning: result.reasoning,
    validation,
    status,
  }
}

// Process batch of pending places
async function enrichBatch(db: ReturnType<typeof getDb>, anthropic: Anthropic, limit: number) {
  // Get pending places
  const pending: Place[] = await db`
    SELECT id, slug, name, description, about, category, location, province, place_type, metadata
    FROM attractions
    WHERE verification_status = 'pending' AND ai_enriched_at IS NULL
    ORDER BY created_at
    LIMIT ${limit}
  `

  const results = []

  for (const place of pending) {
    try {
      const result = await scorePlace(anthropic, place)
      const validation = validateScores(place, result.categories)
      const status = validation.valid && result.confidence >= 0.7 ? 'ai_scored' : 'needs_review'
      const costTier = result.cost_tier || deriveCostTier(place, result.categories)

      await db`
        UPDATE attractions SET
          categories = ${JSON.stringify(result.categories)},
          cost_tier = ${costTier},
          ai_enriched_at = NOW(),
          verification_status = ${status},
          metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{ai_confidence}',
            ${JSON.stringify(result.confidence)}
          )
        WHERE id = ${place.id}
      `

      results.push({
        placeId: place.id,
        slug: place.slug,
        status,
        cost_tier: costTier,
        confidence: result.confidence,
        errors: validation.errors,
      })
    } catch (error) {
      console.error(`Failed to enrich ${place.slug}:`, error)
      results.push({
        placeId: place.id,
        slug: place.slug,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return {
    processed: results.length,
    results,
  }
}

// Get list of pending places
async function getPending(db: ReturnType<typeof getDb>, limit: number) {
  const pending = await db`
    SELECT id, slug, name, place_type, verification_status, ai_enriched_at
    FROM attractions
    WHERE verification_status IN ('pending', 'needs_review')
    ORDER BY
      CASE verification_status WHEN 'pending' THEN 0 ELSE 1 END,
      created_at
    LIMIT ${limit}
  `

  const counts = await db`
    SELECT verification_status, COUNT(*) as count
    FROM attractions
    GROUP BY verification_status
  `

  return {
    pending,
    counts: counts.reduce((acc, row) => {
      acc[row.verification_status] = parseInt(row.count)
      return acc
    }, {} as Record<string, number>),
  }
}

export default async (req: Request, context: Context) => {
  // Only allow POST
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  // Admin-only authentication with timing-safe comparison. This is already
  // a stronger gate than the shared-secret check used on the public AI
  // endpoints, so we don't layer validateAppSecret() on top here.
  if (!validateAdminKey(req)) {
    return json({ error: 'Unauthorized' }, 401)
  }

  // IP-based rate limit (cheap, no I/O). Defense-in-depth even behind the
  // admin key (e.g. a leaked key or a buggy automated caller). Per-instance
  // only, see lib/rate-limit.mts for the honest limitation.
  const clientIp = getClientIp(req, context)
  const rateLimit = checkRateLimit(`${clientIp}:enrich-place`, 10, 60_000)
  if (!rateLimit.allowed) {
    return json({ error: 'Too many requests, please slow down' }, 429)
  }

  const apiKey = Netlify.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) {
    return json({ error: 'AI service not configured' }, 500)
  }

  try {
    const body: RequestBody = await req.json()
    const { action, placeId, limit = 10 } = body

    if (placeId !== undefined && (typeof placeId !== 'string' || placeId.length > MAX_PLACE_ID_LENGTH)) {
      return json({ error: `placeId must be a string under ${MAX_PLACE_ID_LENGTH} characters` }, 400)
    }

    const db = await getDb()
    const anthropic = new Anthropic({ apiKey })

    switch (action) {
      case 'enrich_single':
        if (!placeId) {
          return json({ error: 'placeId required for enrich_single' }, 400)
        }
        const singleResult = await enrichSinglePlace(db, anthropic, placeId)
        return json(singleResult)

      case 'enrich_batch':
        const batchResult = await enrichBatch(db, anthropic, Math.min(limit, 50))
        return json(batchResult)

      case 'get_pending':
        const pendingResult = await getPending(db, Math.min(limit, 100))
        return json(pendingResult)

      default:
        return json({ error: 'Invalid action. Use: enrich_single, enrich_batch, get_pending' }, 400)
    }
  } catch (error) {
    console.error('Enrich place error:', error)
    return json({ error: 'Failed to process enrichment request' }, 500)
  }
}

