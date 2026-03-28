import type { Context } from '@netlify/functions'
import { neon } from '@neondatabase/serverless'

const BASE_URL = 'https://happyroam.travel'

export default async function handler(_req: Request, _context: Context) {
  const databaseUrl = Netlify.env.get('DATABASE_URL')
  if (!databaseUrl) {
    return new Response('Database not configured', { status: 500 })
  }
  const sql = neon(databaseUrl)

  // Get all attractions
  const attractions = await sql`
    SELECT slug, updated_at
    FROM attractions
    WHERE verification_status != 'rejected'
    ORDER BY updated_at DESC
  `

  // Get all heritage sites (stored in attractions table with place_type = 'heritage')
  const heritageSites = await sql`
    SELECT slug, updated_at
    FROM attractions
    WHERE place_type = 'heritage'
    ORDER BY updated_at DESC
  `

  // Get all festivals
  const festivals = await sql`
    SELECT slug, updated_at
    FROM thai_festivals
    ORDER BY updated_at DESC
  `

  // Get all published travel guides
  const guides = await sql`
    SELECT slug, updated_at
    FROM travel_guides
    WHERE is_published = true
    ORDER BY updated_at DESC
  `

  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/visa', priority: '0.9', changefreq: 'weekly' },
    { url: '/attractions', priority: '0.9', changefreq: 'daily' },
    { url: '/heritage', priority: '0.8', changefreq: 'weekly' },
    { url: '/festivals', priority: '0.8', changefreq: 'weekly' },
    { url: '/guides', priority: '0.8', changefreq: 'daily' },
    { url: '/tdac', priority: '0.8', changefreq: 'monthly' },
    { url: '/warnings', priority: '0.8', changefreq: 'weekly' },
    { url: '/safety', priority: '0.7', changefreq: 'monthly' },
    { url: '/itinerary', priority: '0.7', changefreq: 'weekly' },
    { url: '/smart-match', priority: '0.7', changefreq: 'weekly' },
    { url: '/setup-guide', priority: '0.7', changefreq: 'monthly' },
    { url: '/cost-calculator', priority: '0.7', changefreq: 'monthly' },
    { url: '/packing', priority: '0.7', changefreq: 'monthly' },
    { url: '/90-day', priority: '0.7', changefreq: 'monthly' },
    { url: '/onward-ticket', priority: '0.7', changefreq: 'monthly' },
    { url: '/medical', priority: '0.6', changefreq: 'monthly' },
    { url: '/about', priority: '0.6', changefreq: 'monthly' },
    { url: '/people', priority: '0.5', changefreq: 'monthly' },
    // /profile intentionally excluded — authenticated user-only page
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

  // Add heritage site pages
  for (const site of heritageSites) {
    const lastmod = site.updated_at
      ? new Date(site.updated_at).toISOString().split('T')[0]
      : today
    xml += `  <url>
    <loc>${BASE_URL}/heritage/${site.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`
  }

  // Add festival pages
  for (const festival of festivals) {
    const lastmod = festival.updated_at
      ? new Date(festival.updated_at).toISOString().split('T')[0]
      : today
    xml += `  <url>
    <loc>${BASE_URL}/festivals/${festival.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`
  }

  // Add guide pages
  for (const guide of guides) {
    const lastmod = guide.updated_at
      ? new Date(guide.updated_at).toISOString().split('T')[0]
      : today
    xml += `  <url>
    <loc>${BASE_URL}/guides/${guide.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
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
