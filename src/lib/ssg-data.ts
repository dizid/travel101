/**
 * SSR-safe data provider for vite-ssg pre-rendering.
 *
 * During SSG build: reads from pre-fetched JSON files in .ssg-data/
 * On client: never imported (guarded by import.meta.env.SSR checks in composables)
 *
 * Data is cached in memory after first read — each JSON file is loaded once
 * and shared across all page renders during the SSG build.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DATA_DIR = resolve(process.cwd(), '.ssg-data')

// In-memory cache: load each file once, reuse across all SSG page renders
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache: Record<string, any> = {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadJSON(filename: string): any {
  if (cache[filename] !== undefined) return cache[filename]
  try {
    const data = JSON.parse(readFileSync(resolve(DATA_DIR, filename), 'utf-8'))
    cache[filename] = data
    return data
  } catch {
    cache[filename] = null
    return null
  }
}

// --- Detail lookups (by slug) ---

/**
 * Get a single attraction by slug.
 * Returns raw DB format (snake_case) — countryStore.transformAttractionDetail handles conversion.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSSGAttraction(slug: string): any | null {
  const data = loadJSON('attractions.json')
  return data?.[slug] || null
}

/**
 * Get a single heritage site by slug.
 * Returns mixed format with heritageMetadata, images, timeline already transformed.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSSGHeritage(slug: string): any | null {
  const data = loadJSON('heritage.json')
  return data?.[slug] || null
}

/**
 * Get a single festival by slug.
 * Returns camelCase format matching the API response (UpcomingFestival type).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSSGFestival(slug: string): any | null {
  const data = loadJSON('festivals.json')
  return data?.[slug] || null
}

/**
 * Get a single guide by slug (includes content).
 * Returns camelCase format matching the API response (Guide type).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSSGGuide(slug: string): any | null {
  const data = loadJSON('guides.json')
  return data?.[slug] || null
}

// --- List lookups ---

/**
 * Get all attractions for list page.
 * Returns array of raw DB format (snake_case) — store's transformAttraction handles conversion.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSSGAttractionList(): any[] {
  return loadJSON('attractions-list.json') || []
}

/**
 * Get all heritage sites for list page.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSSGHeritageList(): any[] {
  return loadJSON('heritage-list.json') || []
}

/**
 * Get all festivals for list page.
 * Returns camelCase format.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSSGFestivalList(): any[] {
  return loadJSON('festivals-list.json') || []
}

/**
 * Get all guides for list page (no content field).
 * Returns camelCase format.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSSGGuideList(): any[] {
  return loadJSON('guides-list.json') || []
}
