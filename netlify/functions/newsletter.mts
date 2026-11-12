import type { Context } from '@netlify/functions'
import { neon } from '@neondatabase/serverless'
import { methodNotAllowed, badRequest, serverError, rawJsonResponse, errorResponse } from './lib/responses.mts'
import { checkRateLimit, getClientIp } from './lib/rate-limit.mts'

// Anonymous and public: bounded input and a per-address limit, so a script can't fill the
// table (T-0565). Per instance only, see lib/rate-limit.mts.
const EMAIL_PATTERN = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/
const MAX_SOURCE = 40
const MAX_LEAD_MAGNET = 80

export default async function handler(req: Request, context: Context) {
  if (req.method !== 'POST') {
    return methodNotAllowed()
  }

  try {
    if (!checkRateLimit(`${getClientIp(req, context)}:newsletter`, 5, 3_600_000).allowed) {
      return errorResponse('Too many sign-ups from this connection, please try again later', 429)
    }

    const { email, source = 'footer', leadMagnet } = await req.json()

    if (typeof email !== 'string' || email.length > 254 || !EMAIL_PATTERN.test(email)) {
      return badRequest('Invalid email')
    }
    if (typeof source !== 'string' || source.length > MAX_SOURCE) {
      return badRequest('Invalid source')
    }
    if (leadMagnet != null && (typeof leadMagnet !== 'string' || leadMagnet.length > MAX_LEAD_MAGNET)) {
      return badRequest('Invalid lead magnet')
    }

    const databaseUrl = Netlify.env.get('DATABASE_URL')
    if (!databaseUrl) {
      return serverError('Database not configured')
    }
    const sql = neon(databaseUrl)

    // Store email in database (create table if needed)
    await sql`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        subscribed_at TIMESTAMPTZ DEFAULT now(),
        source TEXT DEFAULT 'footer',
        lead_magnet TEXT
      )
    `

    // Insert email with source and lead magnet
    await sql`
      INSERT INTO newsletter_subscribers (email, source, lead_magnet)
      VALUES (${email}, ${source}, ${leadMagnet || null})
      ON CONFLICT (email) DO UPDATE SET
        source = COALESCE(newsletter_subscribers.source, ${source}),
        lead_magnet = COALESCE(newsletter_subscribers.lead_magnet, ${leadMagnet || null})
    `

    // TODO: Integrate with email service (Resend, Mailchimp, etc.)
    // For now, just store in database
    // No email address in the logs (privacy).

    return rawJsonResponse({ success: true })
  } catch (error) {
    console.error('Newsletter signup error:', error)
    return serverError('Failed to subscribe')
  }
}
