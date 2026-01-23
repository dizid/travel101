import type { Context, Config } from '@netlify/functions'
import { getDb, type DbUserProfile } from './lib/db.mts'

export default async (req: Request, context: Context) => {
  const db = await getDb()
  const userId = req.headers.get('x-user-id')

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    switch (req.method) {
      case 'GET': {
        const result = await db`
          SELECT * FROM user_profiles WHERE user_id = ${userId}
        `
        if (result.length === 0) {
          return new Response(JSON.stringify({ error: 'User not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        return new Response(JSON.stringify(result[0]), {
          headers: { 'Content-Type': 'application/json' },
        })
      }

      case 'POST': {
        const body = await req.json()
        const { prefs } = body

        const result = await db`
          INSERT INTO user_profiles (user_id, prefs, is_pro)
          VALUES (${userId}, ${JSON.stringify(prefs || {})}, false)
          ON CONFLICT (user_id) DO UPDATE SET
            prefs = EXCLUDED.prefs,
            updated_at = NOW()
          RETURNING *
        `
        return new Response(JSON.stringify(result[0]), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      case 'PUT': {
        const body = await req.json()
        const { prefs } = body

        const result = await db`
          UPDATE user_profiles
          SET prefs = ${JSON.stringify(prefs)}, updated_at = NOW()
          WHERE user_id = ${userId}
          RETURNING *
        `
        if (result.length === 0) {
          return new Response(JSON.stringify({ error: 'User not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        return new Response(JSON.stringify(result[0]), {
          headers: { 'Content-Type': 'application/json' },
        })
      }

      case 'DELETE': {
        await db`DELETE FROM user_profiles WHERE user_id = ${userId}`
        return new Response(null, { status: 204 })
      }

      default:
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json' },
        })
    }
  } catch (error) {
    console.error('User function error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const config: Config = {
  path: '/api/user',
}
