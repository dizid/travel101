/**
 * Fetch dynamic route slugs from Neon DB at build time.
 * Used by vite-ssg to generate static HTML for all content pages.
 *
 * Mirrors the queries in netlify/functions/sitemap.mts.
 */

import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'

// Load .env.local first (Vite convention), then .env as fallback
// Don't override env vars already set in the shell
dotenv.config({ path: '.env.local' })
dotenv.config()

export interface DynamicRoutes {
  attractions: string[]
  heritage: string[]
  festivals: string[]
  guides: string[]
}

export async function fetchDynamicRoutes(): Promise<DynamicRoutes> {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.warn('[fetch-routes] DATABASE_URL not set — skipping dynamic route generation')
    return { attractions: [], heritage: [], festivals: [], guides: [] }
  }

  try {
    const sql = neon(databaseUrl)

    // Attractions and heritage are in the same table, differentiated by place_type
    const [attractions, heritage, festivals, guides] = await Promise.all([
      sql`SELECT slug FROM attractions WHERE verification_status != 'rejected' AND (place_type IS NULL OR place_type != 'heritage')`,
      sql`SELECT slug FROM attractions WHERE place_type = 'heritage'`,
      sql`SELECT slug FROM thai_festivals`,
      sql`SELECT slug FROM travel_guides WHERE is_published = true`,
    ])

    return {
      attractions: attractions.map(r => r.slug as string),
      heritage: heritage.map(r => r.slug as string),
      festivals: festivals.map(r => r.slug as string),
      guides: guides.map(r => r.slug as string),
    }
  } catch (err) {
    console.warn(`[fetch-routes] DB query failed — falling back to static routes only: ${(err as Error).message}`)
    return { attractions: [], heritage: [], festivals: [], guides: [] }
  }
}

/**
 * Generate all prerenderable route paths.
 * Returns static routes + expanded dynamic routes from DB.
 */
export async function getAllRoutes(): Promise<string[]> {
  // Routes to skip during prerendering (auth/pro-only)
  // Only skip auth-required pages — all content pages should be prerendered for SEO
  const skipRoutes = new Set([
    '/dashboard',
    '/profile',
    '/saved',
    '/alerts',
    '/smart-match',
    '/auth/sign-in',
    '/auth/sign-up',
  ])

  // Static routes to always include
  const staticRoutes = [
    '/',
    '/visa',
    '/tdac',
    '/warnings',
    '/attractions',
    '/heritage',
    '/festivals',
    '/guides',
    '/emergency',
    '/phrasebook',
    '/visa-countdown',
    '/about',
    '/people',
    '/privacy',
    '/terms',
    '/contact',
  ]

  // Fetch dynamic slugs from database
  const dynamic = await fetchDynamicRoutes()

  const dynamicRoutes = [
    ...dynamic.attractions.map(slug => `/attractions/${slug}`),
    ...dynamic.heritage.map(slug => `/heritage/${slug}`),
    ...dynamic.festivals.map(slug => `/festivals/${slug}`),
    ...dynamic.guides.map(slug => `/guides/${slug}`),
  ]

  const allRoutes = [...staticRoutes, ...dynamicRoutes]

  console.log(`[fetch-routes] ${staticRoutes.length} static + ${dynamicRoutes.length} dynamic = ${allRoutes.length} total routes`)
  console.log(`[fetch-routes] Attractions: ${dynamic.attractions.length}, Heritage: ${dynamic.heritage.length}, Festivals: ${dynamic.festivals.length}, Guides: ${dynamic.guides.length}`)

  return allRoutes.filter(r => !skipRoutes.has(r))
}
