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
const DEFAULT_IMAGE = `${BASE_URL}/og-image.svg`
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
      'https://instagram.com/happyroam',
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
 * Generate JSON-LD for a festival/event
 */
export interface EventSchema {
  name: string
  description: string
  image?: string
  startDate: string
  endDate?: string
  location: string
  province: string
  slug: string
  eventType?: string
}

export function generateEventSchema(event: EventSchema): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.description,
    image: event.image || DEFAULT_IMAGE,
    startDate: event.startDate,
    ...(event.endDate && { endDate: event.endDate }),
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: event.location,
      address: {
        '@type': 'PostalAddress',
        addressRegion: event.province,
        addressCountry: 'Thailand',
      },
    },
    url: `${BASE_URL}/festivals/${event.slug}`,
    organizer: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: BASE_URL,
    },
  }
  return JSON.stringify(schema)
}

/**
 * Generate JSON-LD for a heritage/landmark site
 */
export interface LandmarkSchema {
  name: string
  description: string
  image?: string
  address: string
  province: string
  slug: string
  isUNESCO?: boolean
  yearBuilt?: number
}

export function generateLandmarkSchema(landmark: LandmarkSchema): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LandmarksOrHistoricalBuildings',
    name: landmark.name,
    description: landmark.description,
    image: landmark.image || DEFAULT_IMAGE,
    address: {
      '@type': 'PostalAddress',
      addressLocality: landmark.address,
      addressRegion: landmark.province,
      addressCountry: 'Thailand',
    },
    url: `${BASE_URL}/heritage/${landmark.slug}`,
    isAccessibleForFree: false,
    publicAccess: true,
    ...(landmark.isUNESCO && {
      additionalType: 'https://schema.org/WorldHeritageSite',
    }),
    ...(landmark.yearBuilt && {
      foundingDate: String(landmark.yearBuilt),
    }),
  }
  return JSON.stringify(schema)
}

/**
 * Generate JSON-LD for an FAQ page
 */
export interface FAQItem {
  question: string
  answer: string
}

export function generateFAQSchema(items: FAQItem[]): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
  return JSON.stringify(schema)
}

/**
 * Generate JSON-LD for an Article (travel guides)
 */
export interface ArticleSchema {
  title: string
  description: string
  image?: string
  slug: string
  author: string
  publishedAt: string
  updatedAt: string
  wordCount?: number
}

export function generateArticleSchema(article: ArticleSchema): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    image: article.image || DEFAULT_IMAGE,
    url: `${BASE_URL}/guides/${article.slug}`,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      '@type': 'Organization',
      name: article.author || SITE_NAME,
      url: BASE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.png`,
      },
    },
    ...(article.wordCount && { wordCount: article.wordCount }),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/guides/${article.slug}`,
    },
  }
  return JSON.stringify(schema)
}

/**
 * Generate JSON-LD WebSite schema with SearchAction for sitelinks search box
 */
export function generateWebSiteSchema(): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: BASE_URL,
    description: 'Your personalized Thailand travel guide with AI-powered recommendations',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/attractions?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
  return JSON.stringify(schema)
}

/**
 * Generate JSON-LD HowTo schema (e.g. visa guide, 90-day reporting)
 */
export interface HowToStep {
  name: string
  text: string
}

export function generateHowToSchema(name: string, description: string, steps: HowToStep[]): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
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
  onwardTicket: {
    title: 'Onward Ticket — Proof of Onward Travel for Thailand',
    description: 'Book a verified onward flight reservation for Thai immigration. Pro members get 2 free bookings/month, or pay just $12 per ticket. Real airline PNR, instant delivery.',
    url: '/onward-ticket',
  },
  heritage: {
    title: 'Thailand Heritage Sites',
    description: 'Explore Thailand\'s UNESCO World Heritage sites, ancient temples, and historical parks. Ayutthaya, Sukhothai, Grand Palace, and more.',
    url: '/heritage',
  },
  festivals: {
    title: 'Thai Festivals & Events',
    description: 'Discover 50+ Thai festivals — Songkran, Loy Krathong, Yi Peng, and more. Dates, locations, tips, and crowd levels for 2026.',
    url: '/festivals',
  },
  safety: {
    title: 'Thailand Safety Guide',
    description: 'Stay safe in Thailand with region-specific safety information, scam alerts, and emergency contacts.',
    url: '/safety',
  },
  medical: {
    title: 'Medical Tourism in Thailand',
    description: 'Top hospitals and clinics in Thailand for medical tourism. JCI-accredited facilities, dental care, and wellness retreats.',
    url: '/medical',
  },
  '90day': {
    title: '90-Day Reporting Guide',
    description: 'Complete guide to Thailand\'s 90-day reporting requirement. TM47 form, deadlines, online reporting, and immigration offices.',
    url: '/90-day',
  },
  setupGuide: {
    title: 'Thailand Setup Guide',
    description: 'Essential setup guide for Thailand — SIM cards, banking, transport apps, and getting settled as a traveler or expat.',
    url: '/setup-guide',
  },
  costCalculator: {
    title: 'Thailand Cost of Living Calculator',
    description: 'Calculate your cost of living in Thailand. Compare prices across Bangkok, Chiang Mai, Phuket, and other cities.',
    url: '/cost-calculator',
  },
  packing: {
    title: 'Thailand Packing List',
    description: 'AI-powered packing list for Thailand. Get personalized recommendations based on your trip type, season, and activities.',
    url: '/packing',
  },
  people: {
    title: 'People & Culture in Thailand',
    description: 'Meet the diverse communities of Thailand — locals, expats, digital nomads, and travelers living the Thai experience.',
    url: '/people',
  },
  contact: {
    title: 'Contact HappyRoam',
    description: 'Get in touch with HappyRoam Thailand. Questions, feedback, and partnership inquiries welcome.',
    url: '/contact',
  },
  about: {
    title: 'About HappyRoam',
    description: 'Learn about HappyRoam Thailand — your AI-powered travel guide with 400+ destinations, 50+ festivals, and personalized recommendations.',
    url: '/about',
  },
  guides: {
    title: 'Thailand Travel Guides',
    description: 'In-depth travel guides for Thailand. Budget tips, destination guides, food recommendations, and practical advice from experienced travelers.',
    url: '/guides',
  },
  emergency: {
    title: 'Emergency Contacts — Thailand',
    description: 'Thailand emergency numbers, embassy directory, and what to do in an emergency. Tourist Police 1155, ambulance 1669, and 15 embassy contacts in Bangkok.',
    url: '/emergency',
  },
  phrasebook: {
    title: 'Thai Phrasebook — 200+ Essential Phrases',
    description: 'Learn 200+ essential Thai phrases for travel. Greetings, ordering food, bargaining, directions, and emergencies — with Thai script and phonetic pronunciation.',
    url: '/phrasebook',
  },
  visaCountdown: {
    title: 'Visa Countdown Timer',
    description: 'Track your Thailand visa expiry with a visual countdown timer. Supports visa exemption, tourist visa, DTV, and more. 90-day reporting reminders included.',
    url: '/visa-countdown',
  },
}

/**
 * Get meta for a specific page
 */
export function getPageMeta(page: keyof typeof pageMeta): PageMeta {
  return pageMeta[page] || pageMeta.home
}
