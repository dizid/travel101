/**
 * Pages that show the same place or festival as another page (T-0636, Nov 20 2026).
 *
 * The database holds some places twice (a hand-made row plus a Google Places or
 * AI-generated copy, or an /attractions/ row next to the curated /heritage/ page), so
 * Google saw pairs like /attractions/phuket and /attractions/phuket-attraction with the
 * same title and had to guess which one to rank. Each key below is the copy; its value
 * is the page we want Google to show. The copy keeps working for visitors, but:
 *   - its canonical and og:url point to the main page (src/utils/seo.ts usePageHead),
 *   - it is left out of the sitemap (netlify/functions/sitemap.mts).
 *
 * Which page is the main one: the curated /heritage/ page beats an /attractions/ copy;
 * otherwise human-verified beats hand-entered beats Google Places beats AI-written;
 * for festivals the first-created row wins. Rows are not changed or deleted here
 * (removing copies from the database is a separate data decision).
 *
 * Paths only, no domain, no trailing slash. A value must never itself be a key.
 */
export const DUPLICATE_PAGE_CANONICALS: Readonly<Record<string, string>> = {
  // Same site as a curated heritage page
  '/attractions/grand-palace-attraction': '/heritage/grand-palace-bangkok',
  '/attractions/the-grand-palace-attraction': '/heritage/grand-palace-bangkok',
  '/attractions/wat-phra-that-doi-suthep-attraction': '/heritage/doi-suthep-chiang-mai',
  '/attractions/wat-rong-khun-white-temple-attraction': '/heritage/white-temple-chiang-rai',
  '/attractions/wat-rong-khun-attraction': '/heritage/white-temple-chiang-rai',
  '/attractions/wat-arun-temple-of-dawn-attraction': '/heritage/wat-arun-bangkok',
  '/attractions/wat-pho-temple-of-the-reclining-buddha-attraction': '/heritage/wat-pho-bangkok',
  '/attractions/ayutthaya-historical-park-attraction': '/heritage/ayutthaya-historical-park',
  '/attractions/ayutthaya-historical-park-tour': '/heritage/ayutthaya-historical-park',
  '/attractions/sukhothai': '/heritage/sukhothai-historical-park',
  '/attractions/the-sanctuary-of-truth-museum-attraction': '/heritage/sanctuary-of-truth-pattaya',
  '/heritage/jim-thompson-house-museum-attraction': '/heritage/jim-thompson-house',

  // Same place twice under /attractions/
  '/attractions/ayutthaya-attraction': '/attractions/ayutthaya',
  '/attractions/doi-inthanon-national-park-attraction': '/attractions/doi-inthanon',
  '/attractions/khao-yai-national-park-attraction': '/attractions/khao-yai',
  '/attractions/koh-phangan-attraction': '/attractions/koh-phangan',
  '/attractions/koh-samui-attraction': '/attractions/koh-samui',
  '/attractions/koh-tao-attraction': '/attractions/koh-tao',
  '/attractions/krabi-attraction': '/attractions/krabi',
  '/attractions/phi-phi-islands-attraction': '/attractions/phi-phi-islands',
  '/attractions/phuket-attraction': '/attractions/phuket',
  '/attractions/similan-islands-activity': '/attractions/similan-islands',
  '/attractions/railay-beach-rock-climbing-activity': '/attractions/krabi-rock-climbing-activity',
  '/attractions/silom-thai-cooking-school-attraction': '/attractions/silom-thai-cooking-school-course',
  '/attractions/asia-scenic-thai-cooking-school-activity': '/attractions/asia-scenic-thai-cooking-school-attraction',
  '/attractions/asia-scenic-thai-cooking-school-course': '/attractions/asia-scenic-thai-cooking-school-attraction',
  '/attractions/blue-elephant-cooking-school-activity': '/attractions/blue-elephant-cooking-school-course',
  '/attractions/damnoen-saduak-floating-market-tour': '/attractions/damnoen-saduak-floating-market-attraction',
  '/attractions/illuzion-phuket-attraction': '/attractions/illuzion-phuket-activity',
  '/attractions/tiger-muay-thai-activity': '/attractions/tiger-muay-thai-attraction',

  // Same festival twice
  '/festivals/bun-bang-fai': '/festivals/rocket-festival',
  '/festivals/ubon-candle-festival': '/festivals/candle-festival',
}

/** The page Google should show for this path: the main page for a copy, else the path itself. */
export function canonicalPathFor(path: string): string {
  return isDuplicatePage(path) ? DUPLICATE_PAGE_CANONICALS[path] : path
}

/** True when this path is a copy of another page (keep it out of the sitemap). */
export function isDuplicatePage(path: string): boolean {
  // Own keys only, so inherited names like "constructor" never count as pages
  return Object.prototype.hasOwnProperty.call(DUPLICATE_PAGE_CANONICALS, path)
}
