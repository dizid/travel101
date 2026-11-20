import type { Context } from '@netlify/functions'
import { neon } from '@neondatabase/serverless'
import { isDuplicatePage } from '../../src/data/duplicatePages.ts'

const BASE_URL = 'https://happyroam.travel'

export default async function handler(_req: Request, _context: Context) {
  const databaseUrl = Netlify.env.get('DATABASE_URL')
  if (!databaseUrl) {
    return new Response('Database not configured', { status: 500 })
  }
  const sql = neon(databaseUrl)

  // Get all attractions. Heritage sites live in the same table but have their own
  // pages at /heritage/<slug> (below); only those are pre-built, so listing them under
  // /attractions/ too sent crawlers to the home page HTML. Same filter as
  // scripts/fetch-routes.ts.
  const attractions = await sql`
    SELECT slug, updated_at
    FROM attractions
    WHERE verification_status != 'rejected'
      AND (place_type IS NULL OR place_type != 'heritage')
      AND NOT (COALESCE(data_source, '') = 'ai_generated' AND is_hidden_gem IS TRUE AND metadata->>'factCheckedAt' IS NULL) AND verification_status IS DISTINCT FROM 'rejected' -- AI-written 'hidden gem' places are held until fact-checked (T-0553)
    ORDER BY updated_at DESC
  `

  // Get all heritage sites (stored in attractions table with place_type = 'heritage').
  // Same hold as above: an AI-written 'hidden gem' isn't pre-built until fact-checked
  // (scripts/prefetch-ssg-data.ts), so listing it sent crawlers to the home page's HTML
  // (baan-chinpracha, T-0636).
  const heritageSites = await sql`
    SELECT slug, updated_at
    FROM attractions
    WHERE place_type = 'heritage'
      AND NOT (COALESCE(data_source, '') = 'ai_generated' AND is_hidden_gem IS TRUE AND metadata->>'factCheckedAt' IS NULL)
      AND verification_status IS DISTINCT FROM 'rejected'
    ORDER BY updated_at DESC
  `

  // Get all festivals (thai_festivals uses created_at, not updated_at)
  const festivals = await sql`
    SELECT slug, created_at as updated_at
    FROM thai_festivals
    ORDER BY created_at DESC
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
    { url: '/ai-trip-planner-app-thailand', priority: '0.8', changefreq: 'monthly' },
    { url: '/setup-guide', priority: '0.7', changefreq: 'monthly' },
    { url: '/cost-calculator', priority: '0.7', changefreq: 'monthly' },
    { url: '/packing', priority: '0.7', changefreq: 'monthly' },
    { url: '/90-day', priority: '0.7', changefreq: 'monthly' },
    { url: '/onward-ticket', priority: '0.7', changefreq: 'monthly' },
    { url: '/medical', priority: '0.6', changefreq: 'monthly' },
    { url: '/about', priority: '0.6', changefreq: 'monthly' },
    { url: '/people', priority: '0.5', changefreq: 'monthly' },
    // Pre-built content pages that were missing from the sitemap (T-0636)
    { url: '/phrasebook', priority: '0.7', changefreq: 'monthly' },
    { url: '/emergency', priority: '0.6', changefreq: 'monthly' },
    { url: '/visa-countdown', priority: '0.5', changefreq: 'monthly' },
    // /profile intentionally excluded — authenticated user-only page
    // /smart-match excluded too: Pro-only screen, not prerendered (vite.config.ts skipRoutes),
    // so its URL serves the home page's HTML and canonical (T-0388)
    { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
    { url: '/terms', priority: '0.3', changefreq: 'yearly' },
    { url: '/contact', priority: '0.4', changefreq: 'yearly' },
  ]

  const today = new Date().toISOString().split('T')[0]

  // Pages that show the same place as another page (src/data/duplicatePages.ts) are left
  // out below; their canonical names the main page, which stays listed.
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
    if (isDuplicatePage(`/attractions/${attraction.slug}`)) continue
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
    if (isDuplicatePage(`/heritage/${site.slug}`)) continue
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
    if (isDuplicatePage(`/festivals/${festival.slug}`)) continue
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
    if (isDuplicatePage(`/guides/${guide.slug}`)) continue
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
