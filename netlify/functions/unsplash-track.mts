import type { Context, Config } from '@netlify/functions'

/**
 * Tracks Unsplash photo downloads for API compliance.
 * Unsplash requires triggering this endpoint when users view/use photos.
 */
export default async (req: Request, _context: Context) => {
  const url = new URL(req.url)
  const photoId = url.searchParams.get('id')

  if (!photoId) {
    return new Response(JSON.stringify({ error: 'Missing photo id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const accessKey = Netlify.env.get('UNSPLASH_ACCESS_KEY')
  if (!accessKey) {
    console.warn('UNSPLASH_ACCESS_KEY not configured')
    return new Response(JSON.stringify({ error: 'Unsplash not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    // Trigger Unsplash download tracking endpoint
    const response = await fetch(
      `https://api.unsplash.com/photos/${photoId}/download`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      }
    )

    if (!response.ok) {
      console.error('Unsplash tracking failed:', response.status, await response.text())
      return new Response(JSON.stringify({ error: 'Tracking failed' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Unsplash tracking error:', error)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const config: Config = {
  path: '/api/unsplash-track',
}
