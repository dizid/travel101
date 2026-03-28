import type { Context, Config } from '@netlify/functions'
import Anthropic from '@anthropic-ai/sdk'
import { getDb } from './lib/db.mts'
import { checkAndIncrementUsage } from './lib/usage.mts'
import { optionalAuth } from './lib/auth.mts'

function requirePro(
  db: ReturnType<typeof getDb> extends Promise<infer U> ? U : never,
  userId: string
): Promise<boolean> {
  return db
    .sql`SELECT is_pro FROM user_profiles WHERE user_id = ${userId}`
    .then((r: { rows: { is_pro: boolean }[] }) => r.rows[0]?.is_pro ?? false)
}

const SYSTEM_PROMPT = `You are a friendly and knowledgeable Thailand travel advisor. You help travelers with:
- Visa requirements and recommendations based on nationality and trip type
- Cultural tips and local customs
- Safety advice and scam awareness
- Destination recommendations
- Itinerary planning

Key facts about Thailand visas (VERIFIED January 2025):

**SHORT-TERM STAYS:**
- Visa Exemption: 60 days for 93 countries (extended from 30 in July 2024), extendable +30 days (1,900 THB)
- Tourist Visa (TR): 60 days single entry, extendable +30 days (1,900 THB)
- Multiple Entry Tourist Visa (METV): 60 days per entry, 6-month validity

**DIGITAL NOMADS:**
- DTV (Destination Thailand Visa): 5-YEAR validity, 180 days per entry, extendable +180 days per entry
  Requires 500,000 THB in bank (3 months) + proof of remote work. Cannot work for Thai companies.

**LONG-TERM/RETIREMENT:**
- Non-Immigrant O (Retirement): 1 YEAR validity (NOT 90 days!), renewable annually
  Age 50+, requires 800,000 THB in Thai bank OR 65,000 THB/month pension
  Health insurance mandatory (400,000 THB inpatient, 40,000 THB outpatient)
- Non-Immigrant O (Marriage): 1 year, 400,000 THB requirement, for those married to Thai nationals
- Thailand Elite/Privilege: 5-20 year membership, 650,000-5,000,000 THB depending on tier

**CRITICAL - BORDER RUN CRACKDOWN (November 2025):**
- Land border entries: MAX 2 per calendar year
- Visa runs: Officers can deny entry after 2 visa-exempt entries per year
- Land entries are NOT eligible for 30-day extension
- 2,900+ foreigners denied entry this year under these rules
- For long-term stays, always recommend proper visas (DTV, Non-O, Elite)

**90-DAY REPORTING (TM.47):**
- Required for all long-stay visas (Non-O, Non-B extended, DTV)
- FREE - just an address check-in, NOT a visa limit
- Filing window: 15 days before to 7 days after due date
- Online: tm47.immigration.go.th (after first in-person report)
- Late fee: 2,000 THB

**DISCONTINUED:**
- Special Tourist Visa (STV): Ended September 2022, do not recommend

**OTHER:**
- TM30: Landlords must file within 24 hours of foreigner's arrival
- Overstay: 500 THB/day, max 20,000 THB, potential entry bans
- TDAC: Required for all arrivals since May 2025

Always provide accurate information and suggest proper long-term visas instead of visa runs.

When recommending specific activities, tours, accommodation, or transport, naturally mention our booking partners where relevant:
- Tours & activities: **Klook** or **GetYourGuide**
- Hotels & accommodation: **Agoda**
- Transport (buses, trains, ferries): **12Go Asia**
- Travel insurance: **SafetyWing**
Keep mentions natural and helpful — only include when genuinely useful to the traveler's question. Do not add a booking section to every response.`

export default async (req: Request, context: Context) => {
  const userId = await optionalAuth(req)
  const url = new URL(req.url)
  const conversationType = url.searchParams.get('type') || 'general'
  const contextSlug = url.searchParams.get('context') || null

  // GET: Load conversation history
  if (req.method === 'GET') {
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    try {
      const db = await getDb()
      const isPro = await requirePro(db, userId)

      if (!isPro) {
        return new Response(JSON.stringify({ error: 'Pro subscription required' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // Load the most recent non-archived conversation for this type/context
      const result = await db.sql`
        SELECT id, conversation_type, context_slug, title, messages, created_at, updated_at
        FROM ai_conversations
        WHERE user_id = ${userId}
          AND conversation_type = ${conversationType}
          AND (context_slug = ${contextSlug} OR (context_slug IS NULL AND ${contextSlug} IS NULL))
          AND is_archived = false
        ORDER BY updated_at DESC
        LIMIT 1
      `

      const conversation = result.rows[0] || null

      return new Response(JSON.stringify({ conversation }), {
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      console.error('Load conversation error:', error)
      return new Response(JSON.stringify({ error: 'Failed to load conversation' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  // DELETE: Archive (clear) conversation
  if (req.method === 'DELETE') {
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    try {
      const db = await getDb()
      const isPro = await requirePro(db, userId)

      if (!isPro) {
        return new Response(JSON.stringify({ error: 'Pro subscription required' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // Archive the conversation instead of deleting
      await db.sql`
        UPDATE ai_conversations
        SET is_archived = true, updated_at = NOW()
        WHERE user_id = ${userId}
          AND conversation_type = ${conversationType}
          AND (context_slug = ${contextSlug} OR (context_slug IS NULL AND ${contextSlug} IS NULL))
          AND is_archived = false
      `

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      console.error('Archive conversation error:', error)
      return new Response(JSON.stringify({ error: 'Failed to archive conversation' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

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
    const body = await req.json()
    const { message, userProfile, conversationHistory = [], saveToDb = false } = body

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Check usage limits for authenticated users
    if (userId) {
      try {
        const db = await getDb()
        const usageCheck = await checkAndIncrementUsage(db, userId, 'general_chat')
        if (!usageCheck.allowed) {
          return new Response(JSON.stringify({
            error: 'Daily AI chat limit reached',
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
      } catch (usageError) {
        // Log error but continue with request - fail open for better UX
        console.error('Usage check failed:', usageError)
      }
    }

    const anthropic = new Anthropic({ apiKey })

    const userContext = userProfile
      ? `\n\nUser profile:
- Nationality: ${userProfile.nationality || 'Not specified'}
- Trip type: ${userProfile.tripType || 'holiday'}
- Travel style: ${userProfile.travelStyle?.join(', ') || 'Not specified'}
- Budget: ${userProfile.budget || 'mid'}
- Interests: ${userProfile.interests?.join(', ') || 'Not specified'}`
      : ''

    const messages = [
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: message },
    ]

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT + userContext,
      messages,
    })

    const contentBlock = response.content[0]
    const assistantMessage = contentBlock.type === 'text' ? contentBlock.text : ''

    // Save to database if Pro user requested persistence
    let conversationId = null
    if (saveToDb && userId) {
      try {
        const db = await getDb()
        const isPro = await requirePro(db, userId)

        if (isPro) {
          // Build updated messages array
          const updatedMessages = [
            ...conversationHistory.map((msg: { role: string; content: string }) => ({
              role: msg.role,
              content: msg.content,
              timestamp: new Date().toISOString(),
            })),
            { role: 'user', content: message, timestamp: new Date().toISOString() },
            { role: 'assistant', content: assistantMessage, timestamp: new Date().toISOString() },
          ]

          // Generate title from first message if needed
          const title = message.slice(0, 100) + (message.length > 100 ? '...' : '')

          // Find existing active conversation or create new
          const existing = await db.sql`
            SELECT id FROM ai_conversations
            WHERE user_id = ${userId}
              AND conversation_type = ${conversationType}
              AND (context_slug = ${contextSlug} OR (context_slug IS NULL AND ${contextSlug} IS NULL))
              AND is_archived = false
            LIMIT 1
          `

          if (existing.rows.length > 0) {
            // Update existing conversation
            await db.sql`
              UPDATE ai_conversations
              SET messages = ${JSON.stringify(updatedMessages)}::jsonb, updated_at = NOW()
              WHERE id = ${existing.rows[0].id}
            `
            conversationId = existing.rows[0].id
          } else {
            // Create new conversation
            const result = await db.sql`
              INSERT INTO ai_conversations (user_id, conversation_type, context_slug, title, messages)
              VALUES (${userId}, ${conversationType}, ${contextSlug}, ${title}, ${JSON.stringify(updatedMessages)}::jsonb)
              RETURNING id
            `
            conversationId = result.rows[0]?.id
          }
        }
      } catch (dbError) {
        console.error('Failed to save conversation:', dbError)
        // Don't fail the request, just log the error
      }
    }

    return new Response(
      JSON.stringify({
        response: assistantMessage,
        conversationId,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('AI function error:', error)
    return new Response(JSON.stringify({ error: 'Failed to process AI request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

