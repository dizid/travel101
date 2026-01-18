import type { Context } from '@netlify/functions'
import { neon } from '@neondatabase/serverless'

const BASE_URL = 'https://happyroam.travel'

export default async function handler(_req: Request, _context: Context) {
  const sql = neon(process.env.DATABASE_URL!)

  // Get all attractions
  const attractions = await sql`
    SELECT slug, updated_at
    FROM attractions
    WHERE verification_status != 'rejected'
    ORDER BY updated_at DESC
  `

  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/visa', priority: '0.9', changefreq: 'weekly' },
    { url: '/attractions', priority: '0.9', changefreq: 'daily' },
    { url: '/tdac', priority: '0.8', changefreq: 'monthly' },
    { url: '/warnings', priority: '0.8', changefreq: 'weekly' },
    { url: '/itinerary', priority: '0.7', changefreq: 'weekly' },
    { url: '/profile', priority: '0.5', changefreq: 'monthly' },
    { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
    { url: '/terms', priority: '0.3', changefreq: 'yearly' },
    { url: '/contact', priority: '0.4', changefreq: 'yearly' },
  ]

  const today = new Date().toISOString().split('T')[0]

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`

  // Add static pages
  for (const page of staticPages) {
    xml += `  <url>
    <loc>${BASE_URL}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`
  }

  // Add all attractions
  for (const attraction of attractions) {
    const lastmod = attraction.updated_at
      ? new Date(attraction.updated_at).toISOString().split('T')[0]
      : today
    xml += `  <url>
    <loc>${BASE_URL}/attractions/${attraction.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`
  }

  xml += `</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
