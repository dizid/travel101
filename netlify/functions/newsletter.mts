import type { Context } from '@netlify/functions'
import { neon } from '@neondatabase/serverless'
import { methodNotAllowed, badRequest, serverError, rawJsonResponse } from './lib/responses.mts'

export default async function handler(req: Request, _context: Context) {
  if (req.method !== 'POST') {
    return methodNotAllowed()
  }

  try {
    const { email, source = 'footer', leadMagnet } = await req.json()

    if (!email || !email.includes('@')) {
      return badRequest('Invalid email')
    }

    const sql = neon(process.env.DATABASE_URL!)

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
    console.log(`Newsletter signup: ${email} (source: ${source}, leadMagnet: ${leadMagnet || 'none'})`)

    return rawJsonResponse({ success: true })
  } catch (error) {
    console.error('Newsletter signup error:', error)
    return serverError('Failed to subscribe')
  }
}
