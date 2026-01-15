import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Country, VisaType, Warning, Attraction, AttractionCategory } from '@/types'

// Thailand visa types data
const thailandVisaTypes: VisaType[] = [
  {
    id: 'visa-exemption',
    code: 'VE',
    name: 'Visa Exemption',
    duration: 30,
    description: 'For tourists from eligible countries. Stay up to 30 days without a visa.',
    requirements: [
      'Valid passport (6+ months validity)',
      'Return/onward flight ticket',
      'Proof of accommodation',
      'Proof of funds (20,000 THB or equivalent)',
    ],
    extendable: true,
    forProfiles: [{ tripType: 'holiday' }],
  },
  {
    id: 'tourist-visa',
    code: 'TR',
    name: 'Tourist Visa',
    duration: 60,
    description: 'Single-entry tourist visa for longer holidays.',
    requirements: [
      'Valid passport (6+ months validity)',
      'Completed visa application form',
      'Passport-sized photos',
      'Proof of accommodation',
      'Bank statements (3 months)',
      'Return flight ticket',
    ],
    extendable: true,
    forProfiles: [{ tripType: 'holiday' }],
  },
  {
    id: 'stv',
    code: 'STV',
    name: 'Special Tourist Visa',
    duration: 90,
    description: 'For long-stay tourists, extendable twice for up to 270 days total.',
    requirements: [
      'Valid passport (6+ months validity)',
      'Health insurance covering COVID-19',
      'Proof of accommodation for full stay',
      'Financial evidence',
    ],
    extendable: true,
    forProfiles: [{ tripType: 'holiday' }],
  },
  {
    id: 'dtv',
    code: 'DTV',
    name: 'Digital Nomad Visa (Destination Thailand Visa)',
    duration: 180,
    description: 'For remote workers and digital nomads. Work remotely while exploring Thailand.',
    requirements: [
      'Valid passport (6+ months validity)',
      'Proof of employment or freelance income',
      'Income of at least $80,000/year or $5,000 savings',
      'Health insurance',
    ],
    extendable: true,
    forProfiles: [{ tripType: 'digital_nomad' }],
  },
  {
    id: 'non-b',
    code: 'Non-B',
    name: 'Non-Immigrant B (Business)',
    duration: 90,
    description: 'For business activities or employment in Thailand.',
    requirements: [
      'Valid passport (6+ months validity)',
      'Invitation letter from Thai company',
      'Company registration documents',
      'Employment contract',
    ],
    extendable: true,
    forProfiles: [{ tripType: 'expat' }],
  },
  {
    id: 'non-o',
    code: 'Non-O',
    name: 'Non-Immigrant O (Family/Retirement)',
    duration: 90,
    description: 'For retirees (50+) or those with Thai family members.',
    requirements: [
      'Valid passport (6+ months validity)',
      'Proof of relationship or age 50+',
      'Financial evidence (800,000 THB in Thai bank or pension)',
      'Health insurance',
    ],
    extendable: true,
    forProfiles: [{ tripType: 'expat', ageGroup: 'senior' }],
  },
  {
    id: 'elite',
    code: 'Elite',
    name: 'Thailand Elite Visa',
    duration: 365,
    description: 'Premium long-stay visa with VIP privileges. 5-20 year options available.',
    requirements: [
      'Valid passport',
      'Clean criminal record',
      'Membership fee (600,000 - 2,000,000 THB)',
    ],
    extendable: false, // Comes with long validity
    forProfiles: [{ budget: 'luxury' }],
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

// Thailand attractions data
const thailandAttractions: Attraction[] = [
  // Popular Beaches
  {
    id: 'phuket',
    countryId: 'thailand',
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
    countryId: 'thailand',
    name: 'Krabi',
    description: 'Dramatic limestone cliffs, pristine beaches, and excellent rock climbing at Railay Beach.',
    category: 'beach',
    location: 'Andaman Sea',
    province: 'Krabi',
    categories: { beach: 1, adventure: 0.9, nature: 0.8, relaxation: 0.7 },
    isHiddenGem: false,
  },
  {
    id: 'koh-samui',
    countryId: 'thailand',
    name: 'Koh Samui',
    description: 'Palm-fringed beaches, luxury resorts, and a more refined island experience.',
    category: 'island',
    location: 'Gulf of Thailand',
    province: 'Surat Thani',
    categories: { beach: 0.9, luxury: 0.9, wellness: 0.8, romantic: 0.8 },
    isHiddenGem: false,
  },
  {
    id: 'koh-phangan',
    countryId: 'thailand',
    name: 'Koh Phangan',
    description: 'Famous for Full Moon Parties, but also offers serene beaches and yoga retreats.',
    category: 'island',
    location: 'Gulf of Thailand',
    province: 'Surat Thani',
    categories: { party: 1, beach: 0.8, wellness: 0.6, budget: 0.7 },
    isHiddenGem: false,
  },
  // Culture
  {
    id: 'bangkok-temples',
    countryId: 'thailand',
    name: 'Bangkok Temples',
    description: 'Explore Wat Pho, Wat Arun, and the Grand Palace - the spiritual heart of Thailand.',
    category: 'culture',
    location: 'Bangkok',
    province: 'Bangkok',
    categories: { culture: 1, temples: 1, history: 0.9 },
    isHiddenGem: false,
  },
  {
    id: 'chiang-mai',
    countryId: 'thailand',
    name: 'Chiang Mai',
    description: 'The cultural capital of the North with ancient temples, cooking classes, and night markets.',
    category: 'culture',
    location: 'Northern Thailand',
    province: 'Chiang Mai',
    categories: { culture: 1, food: 0.9, nomad: 0.9, temples: 0.8, budget: 0.7 },
    isHiddenGem: false,
  },
  {
    id: 'ayutthaya',
    countryId: 'thailand',
    name: 'Ayutthaya',
    description: 'UNESCO World Heritage ancient capital with impressive temple ruins.',
    category: 'culture',
    location: 'Central Thailand',
    province: 'Ayutthaya',
    categories: { culture: 1, history: 1, temples: 0.9 },
    isHiddenGem: false,
  },
  // Hidden Gems
  {
    id: 'koh-kood',
    countryId: 'thailand',
    name: 'Koh Kood',
    description: 'Thailand\'s fourth largest island remains blissfully undeveloped with pristine beaches.',
    category: 'island',
    location: 'Gulf of Thailand',
    province: 'Trat',
    categories: { beach: 1, relaxation: 1, romantic: 0.9, nature: 0.8 },
    isHiddenGem: true,
  },
  {
    id: 'koh-yao-noi',
    countryId: 'thailand',
    name: 'Koh Yao Noi',
    description: 'A peaceful Muslim fishing community with stunning Phang Nga Bay views.',
    category: 'island',
    location: 'Phang Nga Bay',
    province: 'Phang Nga',
    categories: { relaxation: 1, romantic: 0.9, nature: 0.8, culture: 0.6 },
    isHiddenGem: true,
  },
  {
    id: 'nan-province',
    countryId: 'thailand',
    name: 'Nan Province',
    description: 'Authentic northern culture, ancient temples, and barely any tourists.',
    category: 'culture',
    location: 'Northern Thailand',
    province: 'Nan',
    categories: { culture: 1, nature: 0.8, budget: 0.8, authentic: 1 },
    isHiddenGem: true,
  },
  {
    id: 'umphang',
    countryId: 'thailand',
    name: 'Umphang',
    description: 'Remote jungle region with Thailand\'s largest waterfall, Thi Lo Su.',
    category: 'nature',
    location: 'Western Thailand',
    province: 'Tak',
    categories: { nature: 1, adventure: 0.9, authentic: 0.9 },
    isHiddenGem: true,
  },
  // Digital Nomad Hubs
  {
    id: 'chiang-mai-nomad',
    countryId: 'thailand',
    name: 'Chiang Mai (Nimman)',
    description: 'The digital nomad capital with co-working spaces, cafes, and a thriving community.',
    category: 'nomad',
    location: 'Northern Thailand',
    province: 'Chiang Mai',
    categories: { nomad: 1, food: 0.8, culture: 0.7, budget: 0.8 },
    isHiddenGem: false,
  },
  {
    id: 'koh-lanta',
    countryId: 'thailand',
    name: 'Koh Lanta',
    description: 'Laid-back island perfect for remote workers seeking beach-work balance.',
    category: 'nomad',
    location: 'Andaman Sea',
    province: 'Krabi',
    categories: { nomad: 0.9, beach: 0.8, relaxation: 0.9, budget: 0.7 },
    isHiddenGem: false,
  },
  // Foodie
  {
    id: 'yaowarat',
    countryId: 'thailand',
    name: 'Yaowarat (Bangkok Chinatown)',
    description: 'Street food paradise with legendary dishes and a vibrant night food scene.',
    category: 'foodie',
    location: 'Bangkok',
    province: 'Bangkok',
    categories: { food: 1, culture: 0.7, nightlife: 0.6 },
    isHiddenGem: false,
  },
]

export const useCountryStore = defineStore('country', () => {
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
  const attractions = ref<Attraction[]>(thailandAttractions)
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
  function getVisaForProfile(_nationality: string, tripType: string, duration: number): VisaType | null {
    // Simple recommendation logic
    if (duration <= 30) {
      return visaTypes.value.find((v) => v.code === 'VE') || null
    }
    if (tripType === 'digital_nomad') {
      return visaTypes.value.find((v) => v.code === 'DTV') || null
    }
    if (duration <= 60) {
      return visaTypes.value.find((v) => v.code === 'TR') || null
    }
    if (duration <= 90) {
      return visaTypes.value.find((v) => v.code === 'STV') || null
    }
    return visaTypes.value.find((v) => v.code === 'DTV') || null
  }

  function getAttractionById(id: string): Attraction | undefined {
    return attractions.value.find((a) => a.id === id)
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
    isLoading,
    // Getters
    hiddenGems,
    popularAttractions,
    attractionsByCategory,
    criticalWarnings,
    // Actions
    getVisaForProfile,
    getAttractionById,
    getWarningsByCategory,
  }
})
