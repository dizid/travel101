import type { Context, Config } from '@netlify/functions'
import Anthropic from '@anthropic-ai/sdk'
import { getDb } from './lib/db.mts'
import { checkAndIncrementUsage, checkAndIncrementAnonUsage } from './lib/usage.mts'
import { optionalAuth } from './lib/auth.mts'
import { validateAppSecret } from './lib/security.mts'
import { sanitizeHistory, shortText, shortList, MAX_STORED_MESSAGES } from './lib/ai-input.mts'
import { checkRateLimit, getClientIp } from './lib/rate-limit.mts'

// Max length for the user-supplied chat message, enforced before any DB or
// Claude API call to keep an oversized payload from running up token costs.
const MAX_MESSAGE_LENGTH = 4000


// neon() is itself the tagged-template function and returns a plain array of rows:
// it has no .sql property and no .rows (the test mock used to add both, so the chat-history
// queries passed the tests but threw in production).
async function requirePro(db: ReturnType<typeof getDb>, userId: string): Promise<boolean> {
  const rows = await db`SELECT is_pro FROM user_profiles WHERE user_id = ${userId}`
  return rows[0]?.is_pro ?? false
}

const SYSTEM_PROMPT = `You are a friendly and knowledgeable Thailand travel advisor. You help travelers with:
- Visa requirements and recommendations based on nationality and trip type
- Cultural tips and local customs
- Safety advice and scam awareness
- Destination recommendations
- Itinerary planning

Key facts about Thailand visas (VERIFIED 2026-11-11; rules in force from 15 September 2026):

**SHORT-TERM STAYS:**
- Visa Exemption (tourism only): 30 days for 60 countries and territories (incl. UK, US, Canada, Australia, most of the EU, Japan, India, Taiwan); 15 days for Seychelles and Mauritius. The old 60-day exemption for 93 countries ended on 15 September 2026. Do NOT tell users they get 60 days.
- Separate bilateral agreements still apply: 90 days (Argentina, Brazil, Chile, South Korea, Peru), 30 days (China, Hong Kong, Kazakhstan, Laos, Macao, Mongolia, Russia, Timor-Leste, Vietnam), 14 days (Cambodia, Myanmar airports only)
- Visa-exempt entries are generally limited to twice per calendar year (not for Malaysia, Brunei, Indonesia, Singapore)
- Visa on Arrival: only Azerbaijan, Belarus, Serbia - 15 days, 2,000 THB, generally not extendable
- Extensions of stay: possible only at the immigration officer's discretion; never promise one, and tell users to check the current rules and fee
- Tourist Visa (TR): apply at a Thai embassy before travel; the permitted stay and fee depend on the embassy, so tell users to check
- If a nationality is not listed above, tell the user to check with the Thai embassy in their country

**DIGITAL NOMADS:**
- DTV (Destination Thailand Visa): 5-year multiple-entry visa, up to 180 days per entry
  One extension of +180 days per entry at local immigration (usual fee 1,900 THB); after that, leave and re-enter
  Two routes: "workcation" (remote worker/digital nomad/freelancer, employer or clients OUTSIDE Thailand)
  or soft power (Muay Thai, Thai cooking, medical treatment and similar)
  Proof of at least 500,000 THB (bank statements for the last 3 months, or a sponsor letter)
  Since 31 Aug 2026 also: proof of residence in the country where you apply + criminal record certificate
  Apply online at thaievisa.go.th; fee and exact documents differ per embassy - check with the Thai embassy
  Working for a Thai employer or Thai clients needs a work permit; the DTV alone does not allow it

**LONG-TERM/RETIREMENT (VERIFIED 2026-11-11 on Thai embassy and immigration pages):**
- Non-Immigrant O (Retirement), age 50+: the embassy visa is 90 days, single entry (NOT a 1-year visa)
  Then extend for 1 year at local immigration, renewable every year (1,900 THB)
  Money: 800,000 THB in the bank OR 65,000 THB/month income OR a mix totalling 800,000 THB/year
  For the yearly extension the money must be in a Thai bank; how long it must sit there: check with immigration
  Health insurance: most embassies don't require it for the 90-day Non-O, some do - check with the Thai embassy
- Non-Immigrant O-A (Retirement): 1-year visa from the embassy, same 800,000 / 65,000 THB rules
  Needs health insurance of at least 3,000,000 THB (USD 100,000) for the visa application
  Extending an O-A stay in Thailand: Thai health insurance of at least 400,000 THB inpatient / 40,000 THB outpatient
- Non-Immigrant O (Married to a Thai): the embassy visa is 90 days single entry, then a 1-year extension at immigration
  Extension: 400,000 THB in a Thai bank for the past 2 months OR 40,000 THB/month income
- Thailand Privilege (formerly Elite), one-time fee: Bronze 650,000 THB/5 yrs, Gold 900,000/5 yrs,
  Platinum 1,500,000/10 yrs, Diamond 2,500,000/15 yrs, Reserve 5,000,000/20 yrs (invitation only)

**BORDER RUNS / REPEATED VISA-EXEMPT ENTRIES:**
- Land (and sea) border: max 2 visa-exempt entries per calendar year
  (does not apply to nationals of Malaysia, Brunei, Indonesia, Singapore)
- Immigration (Nov 2025): more than 2 visa runs without a good reason can be refused, at airports too
- Entry is always the officer's decision; for long stays recommend a proper visa (DTV, Non-O, O-A, Privilege)
- Extending a visa-exempt stay: apply at local immigration before it ends, officer's discretion, 1,900 THB

**90-DAY REPORTING (TM.47):**
- Required for anyone staying in Thailand more than 90 days in a row, on any visa (Non-O, O-A, Non-B, DTV, Privilege)
- No fee - just an address report, NOT a visa extension
- Window: 15 days before to 7 days after the due date
- Online: tm47.immigration.go.th, only from 15 to 7 days before the due date
  Late reports and the first report after a new passport: in person at immigration
- Late (reported yourself): 2,000 THB fine; caught without reporting: up to 5,000 THB

**DISCONTINUED:**
- Special Tourist Visa (STV): ended 30 September 2022, do not recommend

**OTHER:**
- TM30: the house owner/landlord/hotel must report a foreign guest to immigration within 24 hours of arrival
- Overstay: 500 THB/day, max 20,000 THB
  Ban if you hand yourself in: over 90 days = 1 yr, over 1 yr = 3 yrs, over 3 yrs = 5 yrs, over 5 yrs = 10 yrs
  Ban if arrested: up to 1 yr overstay = 5 yrs, over 1 yr = 10 yrs
- Rules change often and differ per embassy: always tell users to check with the Thai embassy/immigration
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
      const result = await db`
        SELECT id, conversation_type, context_slug, title, messages, created_at, updated_at
        FROM ai_conversations
        WHERE user_id = ${userId}
          AND conversation_type = ${conversationType}
          AND (context_slug = ${contextSlug} OR (context_slug IS NULL AND ${contextSlug}::text IS NULL))
          AND is_archived = false
        ORDER BY updated_at DESC
        LIMIT 1
      `

      const conversation = result[0] || null

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
      await db`
        UPDATE ai_conversations
        SET is_archived = true, updated_at = NOW()
        WHERE user_id = ${userId}
          AND conversation_type = ${conversationType}
          AND (context_slug = ${contextSlug} OR (context_slug IS NULL AND ${contextSlug}::text IS NULL))
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

  // Shared-secret check (cheap, no I/O). See validateAppSecret() for the
  // honest limitation: this stops casual/scripted abuse, not a determined
  // attacker inspecting network requests. Fails open if not configured.
  // Signed-in callers (verified Neon Auth token, T-0555) don't need it: the live build never
  // had VITE_APP_SHARED_SECRET, so every chat answered 401 for everyone (T-0560). They are
  // still bound by the per-user daily quota below; anonymous callers still need the secret.
  if (!userId && !validateAppSecret(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // IP-based rate limit (cheap, no I/O). See lib/rate-limit.mts for the
  // honest limitation: per-instance only, resets on cold start. Second
  // layer on top of the DB-backed quota below, not the sole control.
  const clientIp = getClientIp(req, context)
  const rateLimit = checkRateLimit(`${clientIp}:ai`, 10, 60_000)
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({ error: 'Too many requests, please slow down' }), {
      status: 429,
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

    if (typeof message !== 'string' || message.length > MAX_MESSAGE_LENGTH) {
      return new Response(JSON.stringify({
        error: `Message must be a string under ${MAX_MESSAGE_LENGTH} characters`,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Usage quota check - applies to EVERYONE now, authenticated or not.
    // This is the real fix: previously this whole block only ran `if (userId)`,
    // so anonymous callers (no x-user-id header, no valid JWT) bypassed the
    // quota entirely and got unlimited free Claude API calls. Anonymous
    // callers now get their own (lower) quota tracked by IP.
    try {
      const db = await getDb()
      const usageCheck = userId
        ? await checkAndIncrementUsage(db, userId, 'general_chat')
        : await checkAndIncrementAnonUsage(db, clientIp, 'general_chat')

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
      // Fail closed (T-0560): if the quota can't be checked, no AI call is made. Before,
      // a database hiccup let every request through without any daily limit.
      console.error('Usage check failed:', usageError)
      return new Response(JSON.stringify({ error: 'AI chat is busy, please try again in a minute' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const anthropic = new Anthropic({ apiKey })

    const userContext = userProfile && typeof userProfile === 'object'
      ? `\n\nUser profile:
- Nationality: ${shortText(userProfile.nationality) || 'Not specified'}
- Trip type: ${shortText(userProfile.tripType) || 'holiday'}
- Travel style: ${shortList(userProfile.travelStyle) || 'Not specified'}
- Budget: ${shortText(userProfile.budget) || 'mid'}
- Interests: ${shortList(userProfile.interests) || 'Not specified'}`
      : ''

    // The history comes from the browser, so its size is capped here too (T-0560): before,
    // a caller could send megabytes of 'history' and make each call cost ~100x more.
    const safeHistory = sanitizeHistory(conversationHistory)

    const messages = [
      ...safeHistory,
      { role: 'user' as const, content: message },
    ]

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
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
          // Build updated messages array. The stored copy keeps up to MAX_STORED_MESSAGES
          // turns; only the AI prompt uses the shorter safeHistory (T-0571).
          const storedHistory = sanitizeHistory(conversationHistory, MAX_STORED_MESSAGES)
          const updatedMessages = [
            ...storedHistory.map((msg: { role: string; content: string }) => ({
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
          const existing = await db`
            SELECT id FROM ai_conversations
            WHERE user_id = ${userId}
              AND conversation_type = ${conversationType}
              AND (context_slug = ${contextSlug} OR (context_slug IS NULL AND ${contextSlug}::text IS NULL))
              AND is_archived = false
            LIMIT 1
          `

          if (existing.length > 0) {
            // Update existing conversation
            await db`
              UPDATE ai_conversations
              SET messages = ${JSON.stringify(updatedMessages)}::jsonb, updated_at = NOW()
              WHERE id = ${existing[0].id}
            `
            conversationId = existing[0].id
          } else {
            // Create new conversation
            const result = await db`
              INSERT INTO ai_conversations (user_id, conversation_type, context_slug, title, messages)
              VALUES (${userId}, ${conversationType}, ${contextSlug}, ${title}, ${JSON.stringify(updatedMessages)}::jsonb)
              RETURNING id
            `
            conversationId = result[0]?.id
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

