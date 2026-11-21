import { describe, it, expect } from 'vitest'
import {
  guideRelevance,
  pickAllRelatedGuides,
  pickRelatedGuides,
  type RelatableGuide,
} from '../relatedGuides'

// The 26 published guides as they were live on Nov 21 2026 (slug, category, province, tags).
const LIVE_GUIDES: RelatableGuide[] = [
  { slug: "khao-san-road-guide", category: "neighborhood", province: "Bangkok", tags: ["bangkok", "backpacker", "budget", "nightlife", "khao-san", "banglamphu", "grand-palace"] },
  { slug: "silom-sathorn-guide", category: "neighborhood", province: "Bangkok", tags: ["bangkok", "silom", "sathorn", "lgbtq", "lumphini", "patpong", "indian-food", "business"] },
  { slug: "kata-karon-phuket-guide", category: "neighborhood", province: "Phuket", tags: ["phuket", "kata", "karon", "beach", "family", "surfing", "snorkeling", "quiet"] },
  { slug: "patong-phuket-guide", category: "neighborhood", province: "Phuket", tags: ["phuket", "patong", "beach", "nightlife", "bangla-road", "day-trips", "phi-phi"] },
  { slug: "old-city-chiang-mai-guide", category: "neighborhood", province: "Chiang Mai", tags: ["chiang-mai", "old-city", "temples", "walking-street", "khao-soi", "budget", "culture"] },
  { slug: "nimman-chiang-mai-guide", category: "neighborhood", province: "Chiang Mai", tags: ["chiang-mai", "nimman", "digital-nomad", "cafes", "coworking", "craft-beer", "creative"] },
  { slug: "sukhumvit-guide", category: "neighborhood", province: "Bangkok", tags: ["bangkok", "sukhumvit", "bts", "shopping", "nightlife", "expat", "thonglor"] },
  { slug: "sim-cards-esim-guide", category: "practical", province: null, tags: ["sim-card", "esim", "ais", "truemove", "connectivity", "internet", "airalo", "data", "wifi", "digital-nomad"] },
  { slug: "seasonal-travel-guide", category: "practical", province: null, tags: ["seasons", "planning", "packing", "rainy-season", "hot-season", "cool-season", "health", "weather", "songkran", "dengue"] },
  { slug: "accommodation-guide", category: "practical", province: null, tags: ["accommodation", "hotels", "hostels", "guesthouses", "agoda", "booking", "long-term-rental", "budget", "resort"] },
  { slug: "cultural-etiquette-guide", category: "culture", province: null, tags: ["culture", "etiquette", "temples", "customs", "wai", "monks", "dress-code", "social-norms", "religion"] },
  { slug: "shopping-markets-guide", category: "culture", province: null, tags: ["shopping", "markets", "chatuchak", "floating-market", "bargaining", "night-market", "mall", "handicrafts", "silk"] },
  { slug: "transportation-guide", category: "practical", province: null, tags: ["transport", "trains", "buses", "ferries", "flights", "bts", "mrt", "grab", "tuk-tuk", "songthaew", "motorbike", "airport"] },
  { slug: "thailand-islands-comparison", category: "destination", province: null, tags: ["islands", "koh-samui", "koh-phangan", "koh-tao", "phuket", "koh-lanta", "koh-lipe", "beach", "diving", "comparison"] },
  { slug: "phuket-city-guide", category: "destination", province: "Phuket", tags: ["phuket", "beach", "diving", "snorkeling", "old-town", "phang-nga-bay", "nightlife", "family", "island"] },
  { slug: "chiang-mai-city-guide", category: "destination", province: "Chiang Mai", tags: ["chiang-mai", "city-guide", "temples", "elephants", "cooking-class", "trekking", "digital-nomad", "doi-suthep", "night-bazaar"] },
  { slug: "bangkok-city-guide", category: "destination", province: "Bangkok", tags: ["bangkok", "city-guide", "temples", "transport", "bts", "mrt", "food", "nightlife", "shopping", "itinerary"] },
  { slug: "digital-nomad-thailand", category: "practical", province: null, tags: ["digital-nomad", "remote-work", "dtv-visa", "chiang-mai", "bangkok", "coworking", "cost-of-living", "visa"] },
  { slug: "thailand-safety-guide", category: "practical", province: null, tags: ["safety", "scams", "health", "solo-travel", "road-safety", "hospitals", "insurance"] },
  { slug: "thai-food-guide", category: "food", province: null, tags: ["food", "restaurants", "street-food", "pad-thai", "khao-soi", "markets", "vegetarian"] },
  { slug: "chiang-mai-digital-nomads", category: "destination", province: "Chiang Mai", tags: ["digital-nomads", "chiang-mai", "remote-work", "coworking", "cost-of-living", "visa"] },
  { slug: "island-hopping-guide", category: "destination", province: null, tags: ["islands", "beaches", "south", "koh-samui", "phi-phi", "phuket", "koh-tao", "koh-lipe", "ferries"] },
  { slug: "bangkok-neighborhoods", category: "destination", province: "Bangkok", tags: ["bangkok", "accommodation", "neighborhoods", "hotels", "transport", "sukhumvit", "khao-san"] },
  { slug: "thailand-budget-guide", category: "budget", province: null, tags: ["budget", "money", "backpacking", "costs", "street-food", "hostels"] },
  { slug: "best-time-to-visit", category: "practical", province: null, tags: ["weather", "seasons", "planning", "festivals", "songkran", "loy-krathong"] },
  { slug: "first-time-thailand", category: "practical", province: null, tags: ["beginners", "planning", "tips", "visa", "money", "transport"] },
]

/** How many other guides link to each guide. */
function inboundCounts(picks: Map<string, RelatableGuide[]>) {
  const counts = new Map<string, number>()
  for (const list of picks.values()) {
    for (const g of list) counts.set(g.slug, (counts.get(g.slug) ?? 0) + 1)
  }
  return counts
}

describe('guideRelevance', () => {
  it('scores a shared province, each shared tag and a shared category', () => {
    const a = { slug: 'a', category: 'neighborhood', province: 'Bangkok', tags: ['bangkok', 'bts', 'food'] }
    const b = { slug: 'b', category: 'neighborhood', province: 'Bangkok', tags: ['bangkok', 'bts'] }
    expect(guideRelevance(a, b)).toBe(4 + 2 * 2 + 1)
  })

  it('is symmetric and handles missing province/tags', () => {
    const a = { slug: 'a', category: 'practical', province: null, tags: null }
    const b = { slug: 'b', category: 'food', province: null, tags: ['food'] }
    expect(guideRelevance(a, b)).toBe(0)
    expect(guideRelevance(b, a)).toBe(0)
    const live = LIVE_GUIDES
    for (const x of live) for (const y of live) expect(guideRelevance(x, y)).toBe(guideRelevance(y, x))
  })

  it('does not count a tag twice when a guide repeats it', () => {
    const a = { slug: 'a', category: 'x', province: null, tags: ['beach', 'beach'] }
    const b = { slug: 'b', category: 'y', province: null, tags: ['beach'] }
    expect(guideRelevance(a, b)).toBe(2)
  })
})

describe('pickAllRelatedGuides on the live guides', () => {
  const picks = pickAllRelatedGuides(LIVE_GUIDES, 3)

  it('links every guide from at least one other guide', () => {
    const counts = inboundCounts(picks)
    const orphans = LIVE_GUIDES.filter(g => !counts.get(g.slug)).map(g => g.slug)
    expect(orphans).toEqual([])
  })

  it('gives every guide 3 picks, never itself, no repeats', () => {
    for (const g of LIVE_GUIDES) {
      const list = picks.get(g.slug)!
      expect(list).toHaveLength(3)
      expect(list.map(r => r.slug)).not.toContain(g.slug)
      expect(new Set(list.map(r => r.slug)).size).toBe(3)
    }
  })

  it('links the 3 guides that had no inbound link from guides about the same city', () => {
    const linkersOf = (slug: string) =>
      [...picks.entries()].filter(([, list]) => list.some(r => r.slug === slug)).map(([host]) => host)
    expect(linkersOf('sukhumvit-guide')).toContain('bangkok-city-guide')
    expect(linkersOf('bangkok-neighborhoods')).toContain('bangkok-city-guide')
    expect(linkersOf('chiang-mai-digital-nomads')).toContain('chiang-mai-city-guide')
  })

  it('shows neighborhood guides under their own city guide first', () => {
    expect(picks.get('phuket-city-guide')!.map(r => r.slug).slice(0, 2).sort()).toEqual([
      'kata-karon-phuket-guide',
      'patong-phuket-guide',
    ])
  })

  it('gives the same picks whatever order the list arrives in', () => {
    const reversed = pickAllRelatedGuides([...LIVE_GUIDES].reverse(), 3)
    for (const g of LIVE_GUIDES) {
      expect(reversed.get(g.slug)!.map(r => r.slug)).toEqual(picks.get(g.slug)!.map(r => r.slug))
    }
  })
})

describe('pickRelatedGuides', () => {
  it('returns the current guide\'s picks from the full list', () => {
    const current = LIVE_GUIDES.find(g => g.slug === 'sukhumvit-guide')!
    const result = pickRelatedGuides(current, LIVE_GUIDES, 3)
    expect(result.map(r => r.slug)).toEqual(
      pickAllRelatedGuides(LIVE_GUIDES, 3).get('sukhumvit-guide')!.map(r => r.slug),
    )
  })

  it('works when the list is empty or misses the current guide', () => {
    const current = { slug: 'new-guide', category: 'food', province: null, tags: ['food'] }
    expect(pickRelatedGuides(current, [], 3)).toEqual([])
    const result = pickRelatedGuides(current, LIVE_GUIDES, 3)
    expect(result).toHaveLength(3)
    expect(result[0].slug).toBe('thai-food-guide')
  })

  it('ignores a duplicated row instead of linking a guide to itself', () => {
    const doubled = [...LIVE_GUIDES, LIVE_GUIDES[0]]
    const current = LIVE_GUIDES[0]
    const result = pickRelatedGuides(current, doubled, 3)
    expect(result.map(r => r.slug)).not.toContain(current.slug)
  })
})
