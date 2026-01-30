import type { Context, Config } from '@netlify/functions'
import { getDb } from './lib/db.mts'

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

async function requirePro(db: ReturnType<typeof getDb>, userId: string) {
  const result = await db`SELECT is_pro FROM user_profiles WHERE user_id = ${userId}`
  if (result.length === 0 || !result[0].is_pro) {
    throw new Error('Pro subscription required')
  }
}

export default async (req: Request, context: Context) => {
  const db = await getDb()
  const userId = req.headers.get('x-user-id')

  if (!userId) {
    return json({ error: 'Unauthorized' }, 401)
  }

  try {
    await requirePro(db, userId)

    const url = new URL(req.url)
    const attractionSlug = url.searchParams.get('slug')

    switch (req.method) {
      case 'GET': {
        // Get all saved matches for user
        const matches = await db`
          SELECT
            sm.*,
            a.name as attraction_name,
            a.province,
            a.category,
            a.is_hidden_gem
          FROM saved_matches sm
          JOIN attractions a ON sm.attraction_slug = a.slug
          WHERE sm.user_id = ${userId}
          ORDER BY sm.created_at DESC
        `

        return json({
          matches,
          slugs: matches.map((m) => m.attraction_slug)
        })
      }

      case 'POST': {
        // Save a match
        const body = await req.json()
        const slug = body.slug || attractionSlug

        if (!slug) {
          return json({ error: 'Attraction slug required' }, 400)
        }

        // Check if attraction exists
        const attraction = await db`SELECT slug FROM attractions WHERE slug = ${slug}`
        if (attraction.length === 0) {
          return json({ error: 'Attraction not found' }, 404)
        }

        // Check if already saved
        const existing = await db`
          SELECT id FROM saved_matches
          WHERE user_id = ${userId} AND attraction_slug = ${slug}
        `
        if (existing.length > 0) {
          return json({ message: 'Already saved', id: existing[0].id })
        }

        // Save the match
        const [saved] = await db`
          INSERT INTO saved_matches (user_id, attraction_slug, match_score, match_reason, notes)
          VALUES (
            ${userId},
            ${slug},
            ${body.matchScore || null},
            ${body.matchReason || null},
            ${body.notes || null}
          )
          RETURNING *
        `

        return json({ match: saved }, 201)
      }

      case 'DELETE': {
        // Remove a saved match
        const body = await req.json().catch(() => ({}))
        const slug = body.slug || attractionSlug

        if (!slug) {
          return json({ error: 'Attraction slug required' }, 400)
        }

        const deleted = await db`
          DELETE FROM saved_matches
          WHERE user_id = ${userId} AND attraction_slug = ${slug}
          RETURNING id
        `

        if (deleted.length === 0) {
          return json({ error: 'Match not found' }, 404)
        }

        return json({ success: true })
      }

      default:
        return json({ error: 'Method not allowed' }, 405)
    }
  } catch (error) {
    console.error('Matches error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message.includes('Pro subscription') ? 403 : 500
    return json({ error: message }, status)
  }
}

