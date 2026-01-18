import type { Context } from '@netlify/functions'
import { neon } from '@neondatabase/serverless'

export default async function handler(req: Request, _context: Context) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { email, source = 'footer', leadMagnet } = await req.json()

    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Invalid email' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
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

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Newsletter signup error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to subscribe' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
