/**
 * Affiliate URL generators for travel partners
 *
 * Sign up for affiliate programs:
 * - Klook: https://affiliate.klook.com
 * - Agoda: https://partners.agoda.com
 * - 12Go Asia: https://12go.asia/affiliate
 */

export type AffiliatePartner = 'klook' | 'agoda' | '12go' | 'getyourguide'

interface AffiliateConfig {
  baseUrl: string
  buildUrl: (destination: string, attractionName?: string, affiliateId?: string) => string
}

const affiliateConfigs: Record<AffiliatePartner, AffiliateConfig> = {
  klook: {
    baseUrl: 'https://www.klook.com',
    buildUrl: (destination, attractionName, affiliateId) => {
      const query = attractionName
        ? `${attractionName} ${destination}`
        : destination
      const params = new URLSearchParams({
        query,
        ...(affiliateId && { aid: affiliateId }),
      })
      return `https://www.klook.com/search/?${params.toString()}`
    },
  },
  agoda: {
    baseUrl: 'https://www.agoda.com',
    buildUrl: (destination, _attractionName, affiliateId) => {
      const params = new URLSearchParams({
        city: destination,
        ...(affiliateId && { cid: affiliateId }),
        pcs: '1',
      })
      return `https://www.agoda.com/partners/partnersearch.aspx?${params.toString()}`
    },
  },
  '12go': {
    baseUrl: 'https://12go.asia',
    buildUrl: (destination, _attractionName, affiliateId) => {
      // 12Go booking URLs with referer tracking
      const slug = destination.toLowerCase().replace(/\s+/g, '-')
      const params = affiliateId ? `?referer=${affiliateId}` : ''
      return `https://12go.asia/en/travel/thailand/${slug}${params}`
    },
  },
  getyourguide: {
    baseUrl: 'https://www.getyourguide.com',
    buildUrl: (destination, attractionName, affiliateId) => {
      const query = attractionName
        ? `${attractionName} ${destination}`
        : destination
      const params = new URLSearchParams({
        q: query,
        ...(affiliateId && { partner_id: affiliateId }),
      })
      return `https://www.getyourguide.com/s/?${params.toString()}`
    },
  },
}

/**
 * Generate affiliate URL for a partner
 */
export function generateAffiliateUrl(
  partner: AffiliatePartner,
  destination: string,
  attractionName?: string
): string {
  // Get affiliate ID from environment (if available)
  const envKey = `VITE_${partner.toUpperCase()}_AFFILIATE_ID`
  const affiliateId = typeof import.meta !== 'undefined'
    ? (import.meta.env?.[envKey] as string | undefined)
    : undefined

  const config = affiliateConfigs[partner]
  return config.buildUrl(destination, attractionName, affiliateId)
}

/**
 * Generate all affiliate links for a destination
 */
export function generateAllAffiliateLinks(
  destination: string,
  attractionName?: string
): Record<AffiliatePartner, string> {
  return {
    klook: generateAffiliateUrl('klook', destination, attractionName),
    agoda: generateAffiliateUrl('agoda', destination),
    '12go': generateAffiliateUrl('12go', destination),
    getyourguide: generateAffiliateUrl('getyourguide', destination, attractionName),
  }
}

/**
 * Track affiliate click (for analytics)
 */
export function trackAffiliateClick(
  partner: AffiliatePartner,
  destination: string,
  attractionSlug?: string
): void {
  // Send to analytics if available
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'affiliate_click', {
      partner,
      destination,
      attraction: attractionSlug,
    })
  }
}

/**
 * Generate heritage hotel booking URL (Agoda with hotel name)
 */
export function generateHeritageHotelUrl(
  hotelName: string,
  province: string
): string {
  const affiliateId = typeof import.meta !== 'undefined'
    ? (import.meta.env?.VITE_AGODA_AFFILIATE_ID as string | undefined)
    : undefined

  const params = new URLSearchParams({
    textToSearch: `${hotelName} ${province} Thailand`,
    ...(affiliateId && { cid: affiliateId }),
    pcs: '1',
  })
  return `https://www.agoda.com/partners/partnersearch.aspx?${params.toString()}`
}

/**
 * Generate transport booking URL (12Go)
 */
export function generateTransportUrl(
  from: string,
  to: string
): string {
  const affiliateId = typeof import.meta !== 'undefined'
    ? (import.meta.env?.VITE_12GO_AFFILIATE_ID as string | undefined)
    : undefined

  const fromSlug = from.toLowerCase().replace(/\s+/g, '-')
  const toSlug = to.toLowerCase().replace(/\s+/g, '-')
  const params = affiliateId ? `?referer=${affiliateId}` : ''
  return `https://12go.asia/en/travel/${fromSlug}/${toSlug}${params}`
}

/**
 * Affiliate link contexts - where to show which partners
 */
export const affiliateContexts = {
  // Attraction detail pages
  attractionDetail: ['klook', 'agoda'] as AffiliatePartner[],

  // Heritage hotels - prioritize Agoda
  heritageHotel: ['agoda'] as AffiliatePartner[],

  // Activities/tours pages
  activities: ['klook', 'getyourguide'] as AffiliatePartner[],

  // Transport between cities
  transport: ['12go'] as AffiliatePartner[],

  // Destination overview
  destination: ['klook', 'agoda', '12go', 'getyourguide'] as AffiliatePartner[],

  // Itinerary pages
  itinerary: ['klook', 'agoda', '12go'] as AffiliatePartner[],

  // Dashboard recommendations
  dashboard: ['klook', 'agoda'] as AffiliatePartner[],
}

/**
 * Get affiliate links for a specific context
 */
export function getContextAffiliateLinks(
  context: keyof typeof affiliateContexts,
  destination: string,
  attractionName?: string
): Partial<Record<AffiliatePartner, string>> {
  const partners = affiliateContexts[context]
  const links: Partial<Record<AffiliatePartner, string>> = {}

  for (const partner of partners) {
    links[partner] = generateAffiliateUrl(partner, destination, attractionName)
  }

  return links
}
