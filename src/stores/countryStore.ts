import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useApi } from '@/composables/useApi'
import { useUserStore } from './userStore'
import type {
  Country,
  VisaType,
  Warning,
  Attraction,
  AttractionDetail,
  AttractionCategory,
  AttractionListResponse,
  AttractionDetailResponse,
  AttractionMatch,
} from '@/types'

// Thailand visa types data (VERIFIED January 2025)
const thailandVisaTypes: VisaType[] = [
  {
    id: 'visa-exemption',
    code: 'VE',
    name: 'Visa Exemption',
    duration: 60, // Updated from 30 → 60 (July 2024)
    description: 'For tourists from 93 eligible countries. Passport holders can enter visa-free for up to 60 days.',
    requirements: [
      'Valid passport (6+ months validity)',
      'Return/onward flight within 60 days',
      'Proof of accommodation',
      'Proof of funds (10,000 THB individual / 20,000 THB family)',
      'TDAC completed before arrival',
    ],
    extendable: true,
    extensionDays: 30,
    extensionFee: 1900,
    forProfiles: [{ tripType: 'holiday' }],
    entryType: 'multiple',
    notes: [
      'Land border entries: MAX 2 per calendar year',
      'Visa runs: MAX 2 per year (Nov 2025 crackdown)',
      'Land entries are NOT eligible for extension',
      'Same-day re-entries NOT eligible for extension',
    ],
  },
  {
    id: 'tourist-visa',
    code: 'TR',
    name: 'Tourist Visa (Single Entry)',
    duration: 60,
    description: 'Single-entry tourist visa for planned holidays. Apply at Thai embassy before travel.',
    requirements: [
      'Valid passport (6+ months validity)',
      'Completed visa application form',
      'Passport-sized photos (4x6 cm)',
      'Proof of accommodation',
      'Bank statements (3 months, showing 20,000+ THB equivalent)',
      'Return flight ticket within 60 days',
      'TDAC completed before arrival',
    ],
    extendable: true,
    extensionDays: 30,
    extensionFee: 1900,
    forProfiles: [{ tripType: 'holiday' }],
    entryType: 'single',
    notes: [
      'Total stay: up to 90 days (60 + 30 extension)',
      'Multiple Entry Tourist Visa (METV) also available: 6-month validity, 60 days per entry',
    ],
  },
  // STV REMOVED - Discontinued September 2022
  {
    id: 'dtv',
    code: 'DTV',
    name: 'Destination Thailand Visa (Digital Nomad)',
    duration: 180, // 180 days per entry
    validityPeriod: 1825, // 5 years total validity
    description: 'For remote workers and digital nomads. Valid for 5 years with 180 days per entry, extendable to 360 days.',
    requirements: [
      'Valid passport (6+ months validity)',
      'Proof of remote work (employment contract, freelance portfolio, invoices)',
      'Financial evidence: 500,000 THB (~$14,400 USD) in bank for 3 months',
      'Proof of income for last 6 months',
      'Health insurance',
      'TDAC completed before arrival',
    ],
    extendable: true,
    extensionDays: 180, // Can extend for another 180 days per entry
    extensionFee: 1900,
    forProfiles: [{ tripType: 'digital_nomad' }],
    reportingInterval: 90,
    entryType: 'multiple',
    notes: [
      '5-year multiple-entry visa',
      'Up to 360 days continuous stay per entry (180 + 180 extension)',
      'Family members can join (spouse + children under 20)',
      'Cannot work for Thai companies - remote work for foreign employers only',
      '90-day reporting required during stay',
      'Visa fee: ~10,000 THB ($250-$300 USD)',
    ],
  },
  {
    id: 'non-b',
    code: 'Non-B',
    name: 'Non-Immigrant B (Business)',
    duration: 90,
    description: 'For business activities or employment in Thailand. Initial 90 days, extendable to 1 year with work permit.',
    requirements: [
      'Valid passport (6+ months validity)',
      'Invitation letter from Thai company',
      'Company registration documents (DBD certificate)',
      'Employment contract or business invitation',
      'Work permit application (for 1-year extension)',
    ],
    extendable: true,
    forProfiles: [{ tripType: 'expat' }],
    reportingInterval: 90,
    renewalInfo: 'Extendable to 1 year with valid work permit',
    entryType: 'single',
    notes: [
      'Initial entry: 90 days',
      'With work permit: extends to 1 year, renewable annually',
      '90-day reporting required',
    ],
  },
  {
    id: 'non-o-retirement',
    code: 'Non-O',
    name: 'Non-Immigrant O (Retirement)',
    duration: 365, // 1 YEAR - NOT 90 days!
    description: 'For retirees aged 50+. Valid for 1 year, renewable annually. The go-to visa for long-term retirement in Thailand.',
    requirements: [
      'Valid passport (6+ months validity)',
      'Age 50 years or older',
      'Financial: 800,000 THB in Thai bank (2 months before apply, 3 months before renewal)',
      'OR: Monthly pension of 65,000 THB (~$1,800 USD)',
      'OR: Combination totaling 800,000 THB annually',
      'Health insurance (min 400,000 THB inpatient, 40,000 THB outpatient)',
      'Money must show international transfer (from abroad)',
    ],
    extendable: true,
    forProfiles: [{ tripType: 'expat', ageGroup: 'senior' }],
    reportingInterval: 90,
    renewalInfo: 'Renewable annually at local Immigration office. Apply 30 days before expiry.',
    entryType: 'multiple',
    notes: [
      '90-day reporting (TM.47) required - FREE, takes 2 minutes',
      'Can do reporting online at tm47.immigration.go.th',
      'Re-entry permit required if leaving Thailand (single: 1,000 THB, multiple: 3,800 THB)',
      'Employment is prohibited on this visa',
      'Bank balance can drop to 400,000 THB during year, but must be 800,000 THB 2 months before renewal',
    ],
  },
  {
    id: 'non-o-family',
    code: 'Non-O-M',
    name: 'Non-Immigrant O (Marriage/Family)',
    duration: 365,
    description: 'For those married to a Thai national or supporting Thai children. Valid for 1 year, renewable annually.',
    requirements: [
      'Valid passport (6+ months validity)',
      'Marriage certificate (translated & certified) OR birth certificate of Thai child',
      'Financial: 400,000 THB in Thai bank OR 40,000 THB/month income',
      'Spouse\'s Thai ID card and house registration',
      'Health insurance',
    ],
    extendable: true,
    forProfiles: [{ tripType: 'expat' }],
    reportingInterval: 90,
    renewalInfo: 'Renewable annually at local Immigration office',
    entryType: 'multiple',
    notes: [
      'Lower financial requirement than retirement visa',
      '90-day reporting required',
      'Can apply for work permit separately',
    ],
  },
  {
    id: 'elite',
    code: 'Elite',
    name: 'Thailand Privilege (Elite) Visa',
    duration: 365, // 1 year per entry
    validityPeriod: 1825, // 5-20 years depending on tier
    description: 'Premium membership program with VIP benefits. Multiple tiers from 5 to 20+ years. No age, income, or employment requirements.',
    requirements: [
      'Valid passport',
      'Clean criminal record / background check',
      'Membership fee (see pricing tiers)',
    ],
    extendable: false, // Comes with long validity, no extension needed
    forProfiles: [{ budget: 'luxury' }],
    entryType: 'multiple',
    notes: [
      'Bronze: 650,000 THB (~$18,000) - 5 years',
      'Gold: 900,000 THB (~$25,000) - 10 years',
      'Platinum: 1,500,000 THB (~$42,000) - 10 years + family option',
      'Diamond: 2,500,000 THB (~$70,000) - 15 years',
      'Reserve: 5,000,000 THB (~$140,000) - 20+ years (invitation only)',
      'VIP airport fast-track, lounge access, limousine service',
      'No 90-day reporting required for Elite members',
    ],
  },
]

// Thailand warnings data
const thailandWarnings: Warning[] = [
  {
    id: 'royal-family',
    countryId: 'thailand',
    category: 'royal_family',
    title: 'Respecting the Royal Family',
    content: 'Thai people deeply revere their Royal Family. Showing respect is appreciated and keeps you on the right side of local customs and laws. Avoid any negative comments and stand respectfully during the Royal Anthem played before movies.',
    severity: 4,
    tags: ['culture', 'law', 'respect'],
  },
  {
    id: 'drug-laws',
    countryId: 'thailand',
    category: 'drug_laws',
    title: 'Understanding Drug Laws',
    content: 'Thailand has strict drug laws with serious consequences. The safest approach is complete avoidance - this keeps your trip worry-free. Note: While cannabis was decriminalized, public consumption is still restricted.',
    severity: 4,
    tags: ['law', 'safety'],
  },
  {
    id: 'common-scams',
    countryId: 'thailand',
    category: 'scams',
    title: 'Staying Scam-Aware',
    content: 'Like any tourist destination, be aware of common scams: tuk-tuk gem store tours, jet ski damage claims, and closed attraction redirects. Book through reputable sources and trust your instincts.',
    severity: 2,
    tags: ['safety', 'tips'],
  },
  {
    id: 'traffic',
    countryId: 'thailand',
    category: 'traffic',
    title: 'Getting Around Safely',
    content: 'Traffic in Thailand drives on the left. If renting a motorbike, always wear a helmet and have a valid license. Use Grab or Bolt apps for safe, metered rides.',
    severity: 3,
    tags: ['transport', 'safety'],
  },
  {
    id: 'beach-safety',
    countryId: 'thailand',
    category: 'beach_safety',
    title: 'Beach & Ocean Safety',
    content: 'Check for red flags indicating dangerous conditions. Monsoon season (May-October on west coast, November-February on east coast) brings stronger currents. Jellyfish can be present - vinegar helps with stings.',
    severity: 2,
    tags: ['beach', 'safety', 'seasonal'],
  },
  {
    id: 'nightlife',
    countryId: 'thailand',
    category: 'nightlife',
    title: 'Enjoying Nightlife Responsibly',
    content: 'Thailand has vibrant nightlife! Keep drinks in sight, stay with friends, and use registered taxis. Most areas are safe, but exercise normal caution as you would anywhere.',
    severity: 1,
    tags: ['nightlife', 'safety', 'tips'],
  },
]

// Fallback attractions data (used when API is unavailable)
const fallbackAttractions: Attraction[] = [
  {
    id: 'phuket',
    slug: 'phuket',
    name: 'Phuket',
    description: 'Thailand\'s largest island with stunning beaches, vibrant nightlife, and world-class resorts.',
    category: 'beach',
    location: 'Andaman Sea',
    province: 'Phuket',
    categories: { beach: 1, nightlife: 0.9, luxury: 0.8, party: 0.9 },
    isHiddenGem: false,
  },
  {
    id: 'krabi',
    slug: 'krabi',
    name: 'Krabi',
    description: 'Dramatic limestone cliffs, pristine beaches, and excellent rock climbing at Railay Beach.',
    category: 'beach',
    location: 'Andaman Sea',
    province: 'Krabi',
    categories: { beach: 1, adventure: 0.9, nature: 0.8, relaxation: 0.7 },
    isHiddenGem: false,
  },
  {
    id: 'chiang-mai',
    slug: 'chiang-mai',
    name: 'Chiang Mai',
    description: 'The cultural capital of the North with ancient temples, cooking classes, and night markets.',
    category: 'culture',
    location: 'Northern Thailand',
    province: 'Chiang Mai',
    categories: { culture: 1, food: 0.9, nomad: 0.9, temples: 0.8, budget: 0.7 },
    isHiddenGem: false,
  },
]

export const useCountryStore = defineStore('country', () => {
  const { get } = useApi()

  // State
  const currentCountry = ref<Country>({
    id: 'thailand',
    code: 'TH',
    name: 'Thailand',
    theme: {
      primaryColor: '#f59e0b',
      accentColor: '#14b8a6',
      backgroundGradient: 'from-amber-50/30 via-white to-teal-50/20',
    },
  })

  const visaTypes = ref<VisaType[]>(thailandVisaTypes)
  const warnings = ref<Warning[]>(thailandWarnings)

  // Attractions state (API-driven with fallback)
  const attractions = ref<Attraction[]>(fallbackAttractions)
  const attractionsLoading = ref(false)
  const attractionsLoaded = ref(false)
  const currentAttraction = ref<AttractionDetail | null>(null)
  const matchedAttractions = ref<AttractionMatch[]>([])
  const isLoading = ref(false)

  // Getters
  const hiddenGems = computed(() =>
    attractions.value.filter((a) => a.isHiddenGem)
  )

  const popularAttractions = computed(() =>
    attractions.value.filter((a) => !a.isHiddenGem)
  )

  const attractionsByCategory = computed(() => {
    const grouped: Record<AttractionCategory, Attraction[]> = {} as Record<AttractionCategory, Attraction[]>
    attractions.value.forEach((attraction) => {
      if (!grouped[attraction.category]) {
        grouped[attraction.category] = []
      }
      grouped[attraction.category].push(attraction)
    })
    return grouped
  })

  const criticalWarnings = computed(() =>
    warnings.value.filter((w) => w.severity === 4)
  )

  // Actions
  function getVisaForProfile(_nationality: string, tripType: string, duration: number, ageGroup?: string): VisaType | null {
    // Retirement Visa for 50+ choosing long-term stay
    if (tripType === 'expat' && ageGroup === 'senior') {
      return visaTypes.value.find((v) => v.code === 'Non-O') || null
    }

    // Digital Nomad Visa for remote workers
    if (tripType === 'digital_nomad') {
      return visaTypes.value.find((v) => v.code === 'DTV') || null
    }

    // Duration-based recommendations for tourists
    if (duration <= 30) {
      return visaTypes.value.find((v) => v.code === 'VE') || null
    }
    if (duration <= 60) {
      return visaTypes.value.find((v) => v.code === 'TR') || null
    }
    if (duration <= 90) {
      return visaTypes.value.find((v) => v.code === 'STV') || null
    }

    // Long-term stay for younger travelers → DTV or Elite
    return visaTypes.value.find((v) => v.code === 'DTV') || null
  }

  // Fetch attractions from API
  async function fetchAttractions(options?: {
    category?: string
    hiddenGemsOnly?: boolean
    personalized?: boolean
  }) {
    attractionsLoading.value = true
    try {
      const params = new URLSearchParams()
      if (options?.category) params.set('category', options.category)
      if (options?.hiddenGemsOnly) params.set('hidden_gems', 'true')
      if (options?.personalized) params.set('personalized', 'true')

      const userStore = useUserStore()
      const headers: Record<string, string> = {}
      if (options?.personalized && userStore.hasProfile) {
        headers['x-user-prefs'] = JSON.stringify(userStore.profile.prefs)
      }

      const response = await get<AttractionListResponse>(
        `/attractions?${params.toString()}`,
        { headers, requiresAuth: false }
      )

      if (response && response.attractions) {
        // Transform API response to match frontend types
        attractions.value = response.attractions.map(transformAttraction)
        attractionsLoaded.value = true
      }
    } catch (error) {
      console.error('Failed to fetch attractions:', error)
      // Keep fallback data if API fails
    } finally {
      attractionsLoading.value = false
    }
  }

  // Fetch single attraction with full details
  async function fetchAttractionBySlug(slug: string) {
    attractionsLoading.value = true
    try {
      const userStore = useUserStore()
      const headers: Record<string, string> = {}
      if (userStore.hasProfile) {
        headers['x-user-prefs'] = JSON.stringify(userStore.profile.prefs)
      }

      const response = await get<AttractionDetailResponse>(
        `/attractions/${slug}?include=tips,secrets,recommendations`,
        { headers, requiresAuth: false }
      )

      if (response && response.attraction) {
        currentAttraction.value = transformAttractionDetail(response.attraction)
        return {
          attraction: currentAttraction.value,
          matchInfo: response.matchInfo,
        }
      }
      return null
    } catch (error) {
      console.error('Failed to fetch attraction:', error)
      return null
    } finally {
      attractionsLoading.value = false
    }
  }

  // Fetch personalized matches
  async function fetchMatchedAttractions() {
    const userStore = useUserStore()
    if (!userStore.hasProfile) return

    attractionsLoading.value = true
    try {
      const response = await get<{ matches: AttractionMatch[] }>(
        '/attractions/matched',
        {
          headers: { 'x-user-prefs': JSON.stringify(userStore.profile.prefs) },
          requiresAuth: false,
        }
      )

      if (response && response.matches) {
        matchedAttractions.value = response.matches.map((m) => ({
          ...m,
          attraction: transformAttraction(m.attraction),
        }))
      }
    } catch (error) {
      console.error('Failed to fetch matched attractions:', error)
    } finally {
      attractionsLoading.value = false
    }
  }

  // Transform API response to frontend format
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function transformAttraction(a: any): Attraction {
    return {
      id: a.id as string,
      slug: a.slug as string,
      name: a.name as string,
      description: a.description as string,
      about: a.about as string | undefined,
      category: a.category as AttractionCategory,
      location: a.location as string,
      province: a.province as string,
      categories: a.categories as Record<string, number>,
      isHiddenGem: a.is_hidden_gem as boolean,
      isProOnly: a.is_pro_only as boolean,
      imageUrl: a.image_url as string | undefined,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function transformAttractionDetail(a: any): AttractionDetail {
    const base = transformAttraction(a)
    return {
      ...base,
      tips: ((a.tips as Record<string, unknown>[]) || []).map((t) => ({
        id: t.id as string,
        tipType: t.tip_type as AttractionDetail['tips'][0]['tipType'],
        title: t.title as string,
        content: t.content as string,
        isProOnly: t.is_pro_only as boolean,
        sortOrder: t.sort_order as number,
      })),
      secrets: ((a.secrets as Record<string, unknown>[]) || []).map((s) => ({
        id: s.id as string,
        secretType: s.secret_type as AttractionDetail['secrets'][0]['secretType'],
        title: s.title as string,
        content: s.content as string,
        locationHint: s.location_hint as string | undefined,
        isProOnly: s.is_pro_only as boolean,
        sortOrder: s.sort_order as number,
      })),
      recommendations: ((a.recommendations as Record<string, unknown>[]) || []).map((r) => ({
        id: r.id as string,
        recType: r.rec_type as AttractionDetail['recommendations'][0]['recType'],
        name: r.name as string,
        description: r.description as string,
        whySpecial: r.why_special as string | undefined,
        priceRange: r.price_range as AttractionDetail['recommendations'][0]['priceRange'],
        googleMapsUrl: r.google_maps_url as string | undefined,
        isProOnly: r.is_pro_only as boolean,
        sortOrder: r.sort_order as number,
      })),
    }
  }

  function getAttractionById(id: string): Attraction | undefined {
    return attractions.value.find((a) => a.id === id)
  }

  function getAttractionBySlug(slug: string): Attraction | undefined {
    return attractions.value.find((a) => a.slug === slug)
  }

  function getWarningsByCategory(category: string): Warning[] {
    return warnings.value.filter((w) => w.category === category)
  }

  return {
    // State
    currentCountry,
    visaTypes,
    warnings,
    attractions,
    attractionsLoading,
    attractionsLoaded,
    currentAttraction,
    matchedAttractions,
    isLoading,
    // Getters
    hiddenGems,
    popularAttractions,
    attractionsByCategory,
    criticalWarnings,
    // Actions
    getVisaForProfile,
    fetchAttractions,
    fetchAttractionBySlug,
    fetchMatchedAttractions,
    getAttractionById,
    getAttractionBySlug,
    getWarningsByCategory,
  }
})
