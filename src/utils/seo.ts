/**
 * SEO utilities for dynamic meta tags and structured data
 */

export interface PageMeta {
  title: string
  description: string
  image?: string
  url?: string
  type?: 'website' | 'article' | 'place'
}

export interface AttractionSchema {
  name: string
  description: string
  image?: string
  address: string
  province: string
  slug: string
  categories?: Record<string, number>
  isHiddenGem?: boolean
}

const BASE_URL = 'https://happyroam.travel'
const DEFAULT_IMAGE = `${BASE_URL}/og-image.jpg`
const SITE_NAME = 'HappyRoam Thailand'

/**
 * Update document meta tags dynamically
 */
export function updateMetaTags(meta: PageMeta): void {
  const { title, description, image = DEFAULT_IMAGE, url, type = 'website' } = meta
  const fullTitle = `${title} | ${SITE_NAME}`
  const fullUrl = url ? `${BASE_URL}${url}` : BASE_URL

  // Basic meta
  document.title = fullTitle
  setMetaTag('description', description)

  // Open Graph
  setMetaTag('og:title', fullTitle, 'property')
  setMetaTag('og:description', description, 'property')
  setMetaTag('og:image', image, 'property')
  setMetaTag('og:url', fullUrl, 'property')
  setMetaTag('og:type', type, 'property')
  setMetaTag('og:site_name', SITE_NAME, 'property')

  // Twitter Card
  setMetaTag('twitter:card', 'summary_large_image')
  setMetaTag('twitter:title', fullTitle)
  setMetaTag('twitter:description', description)
  setMetaTag('twitter:image', image)

  // Canonical
  setCanonical(fullUrl)
}

/**
 * Set or update a meta tag
 */
function setMetaTag(name: string, content: string, attr: 'name' | 'property' = 'name'): void {
  let tag = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, name)
    document.head.appendChild(tag)
  }
  tag.content = content
}

/**
 * Set canonical URL
 */
function setCanonical(url: string): void {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }
  link.href = url
}

/**
 * Generate JSON-LD structured data for an attraction
 */
export function generateAttractionSchema(attraction: AttractionSchema): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: attraction.name,
    description: attraction.description,
    image: attraction.image || DEFAULT_IMAGE,
    address: {
      '@type': 'PostalAddress',
      addressLocality: attraction.address,
      addressRegion: attraction.province,
      addressCountry: 'Thailand',
    },
    url: `${BASE_URL}/attractions/${attraction.slug}`,
    isAccessibleForFree: true,
    publicAccess: true,
    ...(attraction.isHiddenGem && {
      additionalType: 'HiddenGem',
    }),
  }

  return JSON.stringify(schema)
}

/**
 * Generate JSON-LD for the organization
 */
export function generateOrganizationSchema(): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: 'Your personalized Thailand travel guide with AI-powered recommendations',
    sameAs: [
      'https://twitter.com/happyroam',
      'https://facebook.com/happyroam',
    ],
  }

  return JSON.stringify(schema)
}

/**
 * Generate JSON-LD for breadcrumbs
 */
export function generateBreadcrumbSchema(items: { name: string; url: string }[]): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${BASE_URL}${item.url}`,
    })),
  }

  return JSON.stringify(schema)
}

/**
 * Inject JSON-LD into page
 */
export function injectStructuredData(id: string, schema: string): void {
  let script = document.getElementById(id) as HTMLScriptElement | null
  if (!script) {
    script = document.createElement('script')
    script.id = id
    script.type = 'application/ld+json'
    document.head.appendChild(script)
  }
  script.textContent = schema
}

/**
 * Remove structured data from page
 */
export function removeStructuredData(id: string): void {
  const script = document.getElementById(id)
  if (script) {
    script.remove()
  }
}

/**
 * Page-specific meta configurations
 */
export const pageMeta: Record<string, PageMeta> = {
  home: {
    title: 'Thailand Travel Guide',
    description: 'Discover Thailand with personalized AI recommendations. Find hidden gems, get visa help, and plan your perfect trip with our smart travel guide.',
    type: 'website',
  },
  visa: {
    title: 'Thailand Visa Guide',
    description: 'Find the perfect Thailand visa for your trip. Tourist, retirement, elite, digital nomad visas explained with requirements and timelines.',
    url: '/visa',
  },
  attractions: {
    title: 'Places to Visit in Thailand',
    description: 'Explore 400+ destinations in Thailand. Beaches, temples, islands, hidden gems - find places that match your travel style.',
    url: '/attractions',
  },
  tdac: {
    title: 'Thailand Arrival Card Guide',
    description: 'Step-by-step guide to filling out Thailand\'s TM6 arrival and departure card. What to write, common mistakes, and tips.',
    url: '/tdac',
  },
  warnings: {
    title: 'Thailand Travel Tips & Warnings',
    description: 'Essential Thailand travel tips. Scams to avoid, cultural customs, safety advice, and local etiquette for a smooth trip.',
    url: '/warnings',
  },
  dashboard: {
    title: 'My Dashboard',
    description: 'Your personalized Thailand travel dashboard with recommendations matched to your preferences.',
    url: '/dashboard',
  },
  profile: {
    title: 'Travel Profile',
    description: 'Set your travel preferences to get personalized Thailand recommendations.',
    url: '/profile',
  },
  itinerary: {
    title: 'Trip Itinerary Planner',
    description: 'Plan your Thailand itinerary with AI-powered suggestions based on your travel style and interests.',
    url: '/itinerary',
  },
}

/**
 * Get meta for a specific page
 */
export function getPageMeta(page: keyof typeof pageMeta): PageMeta {
  return pageMeta[page] || pageMeta.home
}
