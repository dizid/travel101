/**
 * Picks the "More Travel Guides" links under each guide.
 *
 * Before (T-0636, Nov 21 2026) the box showed "same category first, then newest", so the
 * same few guides were linked everywhere and 3 guides (Bangkok neighborhoods, Sukhumvit,
 * Chiang Mai for digital nomads) had no link from any other guide. Now:
 *   1. Each other guide gets a relevance score: same province, shared tags, same category.
 *   2. The highest scores win (ties: slug order, so the server prerender and the browser
 *      pick the same guides whatever order the list arrives in).
 *   3. A guide no other guide links to is swapped into the last slot of the guide that
 *      fits it best, as long as that doesn't leave another guide without a link.
 *
 * Step 3 needs the whole list, so the picks for every guide are worked out together and
 * the current guide's picks are returned. That is cheap (tens of guides).
 */

/** The guide fields the picker reads (the list API and the prerender both send these). */
export interface RelatableGuide {
  slug: string
  category: string
  province: string | null
  tags: string[] | null
}

// Weights: a shared province is the strongest signal (Sukhumvit -> Bangkok city guide),
// each shared tag counts next, a shared category only breaks near-ties.
const SAME_PROVINCE_POINTS = 4
const SHARED_TAG_POINTS = 2
const SAME_CATEGORY_POINTS = 1

/** How well guide `b` fits under guide `a` (higher is better, 0 = nothing in common). */
export function guideRelevance(a: RelatableGuide, b: RelatableGuide): number {
  let score = 0
  if (a.province && a.province === b.province) score += SAME_PROVINCE_POINTS
  const aTags = new Set(a.tags ?? [])
  for (const tag of new Set(b.tags ?? [])) {
    if (aTags.has(tag)) score += SHARED_TAG_POINTS
  }
  if (a.category === b.category) score += SAME_CATEGORY_POINTS
  return score
}

/** Sort order: best fit first, then slug A-Z so the result never depends on list order. */
function byFit<T extends RelatableGuide>(host: T) {
  return (x: T, y: T) =>
    guideRelevance(host, y) - guideRelevance(host, x) || x.slug.localeCompare(y.slug)
}

/** Works out the related picks for every guide at once (slug -> picked guides). */
export function pickAllRelatedGuides<T extends RelatableGuide>(
  allGuides: T[],
  count = 3,
): Map<string, T[]> {
  // De-duplicate by slug so a repeated row can't link a guide to itself.
  const bySlug = new Map<string, T>()
  for (const guide of allGuides) if (!bySlug.has(guide.slug)) bySlug.set(guide.slug, guide)
  const guides = [...bySlug.values()].sort((x, y) => x.slug.localeCompare(y.slug))

  // Steps 1 + 2: best-fitting guides per guide.
  const picks = new Map<string, T[]>()
  for (const host of guides) {
    const others = guides.filter(g => g.slug !== host.slug).sort(byFit(host))
    picks.set(host.slug, others.slice(0, count))
  }

  // Step 3: give every guide at least one incoming link where that's possible.
  const inbound = new Map<string, number>(guides.map(g => [g.slug, 0]))
  for (const list of picks.values()) {
    for (const g of list) inbound.set(g.slug, (inbound.get(g.slug) ?? 0) + 1)
  }
  const orphans = guides.filter(g => inbound.get(g.slug) === 0)
  for (const orphan of orphans) {
    // Hosts that fit the orphan best come first (byFit from the orphan's side is the same
    // score, because the relevance is symmetric).
    const hosts = guides
      .filter(h => h.slug !== orphan.slug && !picks.get(h.slug)!.some(g => g.slug === orphan.slug))
      .sort(byFit(orphan))
    for (const host of hosts) {
      const list = picks.get(host.slug)!
      const last = list[list.length - 1]
      // Only swap out a guide that is still linked from somewhere else.
      if (!last || (inbound.get(last.slug) ?? 0) < 2) continue
      list[list.length - 1] = orphan
      inbound.set(last.slug, inbound.get(last.slug)! - 1)
      inbound.set(orphan.slug, 1)
      break
    }
  }

  return picks
}

/** The related guides to show under `current` (never `current` itself). */
export function pickRelatedGuides<T extends RelatableGuide>(
  current: RelatableGuide,
  allGuides: T[],
  count = 3,
): T[] {
  // The current guide may be missing from the list (e.g. a list fetch that failed);
  // add it so its picks are still worked out.
  const list = allGuides.some(g => g.slug === current.slug)
    ? allGuides
    : [...allGuides, current as T]
  return pickAllRelatedGuides(list, count).get(current.slug) ?? []
}
