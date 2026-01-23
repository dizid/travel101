import type { Context, Config } from '@netlify/functions'
import { getDb } from './lib/db.mts'
import { getUsageStatus, FREE_LIMITS } from './lib/usage.mts'

export default async (req: Request, context: Context) => {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const userId = req.headers.get('x-user-id')

  // Unauthenticated users get default limits
  if (!userId) {
    return new Response(JSON.stringify({
      usage: Object.fromEntries(
        Object.entries(FREE_LIMITS).map(([k, v]) => [k, { used: 0, limit: v, remaining: v }])
      ),
      isPro: false,
      limits: FREE_LIMITS,
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const db = await getDb()
    const { usage, isPro } = await getUsageStatus(db, userId)

    return new Response(JSON.stringify({
      usage,
      isPro,
      limits: FREE_LIMITS,
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Usage endpoint error:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch usage' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const config: Config = {
  path: '/api/usage',
}
