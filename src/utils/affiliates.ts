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
      // 12Go uses destination-based URLs
      const slug = destination.toLowerCase().replace(/\s+/g, '-')
      const params = affiliateId ? `?affiliate_id=${affiliateId}` : ''
      return `https://12go.asia/en/travel/${slug}${params}`
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
