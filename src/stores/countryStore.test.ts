import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCountryStore } from './countryStore'
import { useUserStore } from './userStore'
import { mockFetch, createMockResponse } from '@/test/setup'
import { mockAttractionListResponse, backpackerPrefs } from '@/test/fixtures'

describe('countryStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('should have Thailand as current country', () => {
      const store = useCountryStore()

      expect(store.currentCountry.id).toBe('thailand')
      expect(store.currentCountry.code).toBe('TH')
      expect(store.currentCountry.name).toBe('Thailand')
    })

    it('should have visa types loaded', () => {
      const store = useCountryStore()

      expect(store.visaTypes.length).toBeGreaterThan(0)
      expect(store.visaTypes.some(v => v.code === 'VE')).toBe(true)
      expect(store.visaTypes.some(v => v.code === 'DTV')).toBe(true)
      expect(store.visaTypes.some(v => v.code === 'Non-O')).toBe(true)
    })

    it('should have warnings loaded', () => {
      const store = useCountryStore()

      expect(store.warnings.length).toBeGreaterThan(0)
      expect(store.warnings.some(w => w.category === 'royal_family')).toBe(true)
      expect(store.warnings.some(w => w.category === 'drug_laws')).toBe(true)
    })

    it('should have fallback attractions', () => {
      const store = useCountryStore()

      expect(store.attractions.length).toBeGreaterThan(0)
    })
  })

  describe('getVisaForProfile', () => {
    describe('visa exemption (VE)', () => {
      it('should return VE for US citizen short holiday (30 days)', () => {
        const store = useCountryStore()

        const result = store.getVisaForProfile('US', 'holiday', 30)

        expect(result.visa?.code).toBe('VE')
        expect(result.warning).toBeUndefined()
      })

      it('should return VE for US citizen 60-day holiday', () => {
        const store = useCountryStore()

        const result = store.getVisaForProfile('US', 'holiday', 60)

        expect(result.visa?.code).toBe('VE')
        expect(result.warning).toBeUndefined()
      })

      it('should return VE with extension warning for 75-day stay', () => {
        const store = useCountryStore()

        const result = store.getVisaForProfile('US', 'holiday', 75)

        expect(result.visa?.code).toBe('VE')
        expect(result.warning).toContain('extension')
      })

      it('should return VE with extension warning for 90-day stay', () => {
        const store = useCountryStore()

        const result = store.getVisaForProfile('GB', 'holiday', 90)

        expect(result.visa?.code).toBe('VE')
        expect(result.warning).toBeDefined()
      })

      it('should return Tourist Visa for stays over 90 days', () => {
        const store = useCountryStore()

        const result = store.getVisaForProfile('DE', 'holiday', 100)

        expect(result.visa?.code).toBe('TR')
        expect(result.warning).toContain('Tourist Visa')
        expect(result.alternatives?.some(v => v.code === 'DTV')).toBe(true)
      })

      it('should work for EU countries', () => {
        const store = useCountryStore()

        const resultDE = store.getVisaForProfile('DE', 'holiday', 30)
        const resultFR = store.getVisaForProfile('FR', 'holiday', 30)
        const resultES = store.getVisaForProfile('ES', 'holiday', 30)

        expect(resultDE.visa?.code).toBe('VE')
        expect(resultFR.visa?.code).toBe('VE')
        expect(resultES.visa?.code).toBe('VE')
      })

      it('should work for other exempt countries', () => {
        const store = useCountryStore()

        const resultJP = store.getVisaForProfile('JP', 'holiday', 30)
        const resultKR = store.getVisaForProfile('KR', 'holiday', 30)
        const resultAU = store.getVisaForProfile('AU', 'holiday', 30)

        expect(resultJP.visa?.code).toBe('VE')
        expect(resultKR.visa?.code).toBe('VE')
        expect(resultAU.visa?.code).toBe('VE')
      })
    })

    describe('visa on arrival (VOA)', () => {
      it('should return VOA for Chinese citizen short stay', () => {
        const store = useCountryStore()

        const result = store.getVisaForProfile('CN', 'holiday', 10)

        expect(result.visa?.code).toBe('VOA')
        expect(result.warning).toContain('15 days')
      })

      it('should return VOA for Indian citizen', () => {
        const store = useCountryStore()

        const result = store.getVisaForProfile('IN', 'holiday', 15)

        expect(result.visa?.code).toBe('VOA')
      })

      it('should return Tourist Visa for VOA country staying over 15 days', () => {
        const store = useCountryStore()

        const result = store.getVisaForProfile('CN', 'holiday', 30)

        expect(result.visa?.code).toBe('TR')
        expect(result.warning).toContain('Tourist Visa')
      })

      it('should return VOA for Russian citizen', () => {
        const store = useCountryStore()

        const result = store.getVisaForProfile('RU', 'holiday', 10)

        expect(result.visa?.code).toBe('VOA')
      })

      it('should return VOA for Taiwan citizen', () => {
        const store = useCountryStore()

        const result = store.getVisaForProfile('TW', 'holiday', 14)

        expect(result.visa?.code).toBe('VOA')
      })
    })

    describe('visa required countries', () => {
      it('should return Tourist Visa with embassy warning for Pakistan', () => {
        const store = useCountryStore()

        const result = store.getVisaForProfile('PK', 'holiday', 30)

        expect(result.visa?.code).toBe('TR')
        expect(result.warning).toContain('embassy')
      })

      it('should return Tourist Visa with embassy warning for Bangladesh', () => {
        const store = useCountryStore()

        const result = store.getVisaForProfile('BD', 'holiday', 30)

        expect(result.visa?.code).toBe('TR')
        expect(result.warning).toContain('embassy')
      })
    })

    describe('digital nomad visa (DTV)', () => {
      it('should return DTV for digital nomad trip type', () => {
        const store = useCountryStore()

        const result = store.getVisaForProfile('US', 'digital_nomad', 120)

        expect(result.visa?.code).toBe('DTV')
      })

      it('should return DTV for any nationality as digital nomad', () => {
        const store = useCountryStore()

        const resultDE = store.getVisaForProfile('DE', 'digital_nomad', 180)
        const resultUK = store.getVisaForProfile('GB', 'digital_nomad', 180)

        expect(resultDE.visa?.code).toBe('DTV')
        expect(resultUK.visa?.code).toBe('DTV')
      })
    })

    describe('working holiday visa (WH)', () => {
      it('should return WH for eligible Australian digital nomad', () => {
        const store = useCountryStore()

        const result = store.getVisaForProfile('AU', 'digital_nomad', 180)

        expect(result.visa?.code).toBe('WH')
        expect(result.alternatives?.some(v => v.code === 'DTV')).toBe(true)
      })

      it('should return WH for eligible New Zealand citizen', () => {
        const store = useCountryStore()

        const result = store.getVisaForProfile('NZ', 'digital_nomad', 180)

        expect(result.visa?.code).toBe('WH')
      })

      it('should return WH for eligible Canadian citizen', () => {
        const store = useCountryStore()

        const result = store.getVisaForProfile('CA', 'digital_nomad', 180)

        expect(result.visa?.code).toBe('WH')
      })

      it('should return WH for eligible French citizen', () => {
        const store = useCountryStore()

        const result = store.getVisaForProfile('FR', 'digital_nomad', 180)

        expect(result.visa?.code).toBe('WH')
      })

      it('should not return WH for non-eligible country', () => {
        const store = useCountryStore()

        // Germany is not WH eligible
        const result = store.getVisaForProfile('DE', 'digital_nomad', 180)

        expect(result.visa?.code).toBe('DTV')
        expect(result.visa?.code).not.toBe('WH')
      })
    })

    describe('retirement visa (Non-O)', () => {
      it('should return Non-O for senior expat', () => {
        const store = useCountryStore()

        const result = store.getVisaForProfile('US', 'expat', 365, 'senior')

        expect(result.visa?.code).toBe('Non-O')
      })

      it('should return Non-O for any nationality senior expat', () => {
        const store = useCountryStore()

        const resultUK = store.getVisaForProfile('GB', 'expat', 365, 'senior')
        const resultDE = store.getVisaForProfile('DE', 'expat', 365, 'senior')

        expect(resultUK.visa?.code).toBe('Non-O')
        expect(resultDE.visa?.code).toBe('Non-O')
      })
    })

    describe('legacy function compatibility', () => {
      it('getVisaForProfileSimple should return just the visa', () => {
        const store = useCountryStore()

        const visa = store.getVisaForProfileSimple('US', 'holiday', 30)

        expect(visa?.code).toBe('VE')
      })

      it('getVisaForProfileSimple should return null when no visa', () => {
        const store = useCountryStore()

        // Unknown country should still return something
        const visa = store.getVisaForProfileSimple('XX', 'holiday', 30)

        // Either returns TR (visa required) or null
        expect(visa === null || visa?.code === 'TR').toBe(true)
      })
    })
  })

  describe('computed getters', () => {
    it('should filter hidden gems', () => {
      const store = useCountryStore()
      // Add a hidden gem to test
      store.attractions = [
        ...store.attractions,
        {
          id: 'hidden-1',
          slug: 'secret-spot',
          name: 'Secret Spot',
          description: 'Hidden gem',
          category: 'nature',
          location: 'Secret',
          province: 'Chiang Mai',
          categories: { nature: 0.9 },
          isHiddenGem: true,
        },
      ]

      const hiddenGems = store.hiddenGems

      expect(hiddenGems.every(a => a.isHiddenGem)).toBe(true)
      expect(hiddenGems.some(a => a.slug === 'secret-spot')).toBe(true)
    })

    it('should filter popular attractions (not hidden gems)', () => {
      const store = useCountryStore()

      const popular = store.popularAttractions

      expect(popular.every(a => !a.isHiddenGem)).toBe(true)
    })

    it('should group attractions by category', () => {
      const store = useCountryStore()

      const byCategory = store.attractionsByCategory

      expect(typeof byCategory).toBe('object')
      // Should have at least some categories from fallback data
      const categories = Object.keys(byCategory)
      expect(categories.length).toBeGreaterThan(0)
    })

    it('should filter critical warnings (severity 4)', () => {
      const store = useCountryStore()

      const critical = store.criticalWarnings

      expect(critical.every(w => w.severity === 4)).toBe(true)
      expect(critical.some(w => w.category === 'royal_family')).toBe(true)
      expect(critical.some(w => w.category === 'drug_laws')).toBe(true)
    })
  })

  describe('getters by id/slug', () => {
    it('should get attraction by id', () => {
      const store = useCountryStore()
      const first = store.attractions[0]

      const found = store.getAttractionById(first.id)

      expect(found).toBeDefined()
      expect(found?.id).toBe(first.id)
    })

    it('should return undefined for unknown id', () => {
      const store = useCountryStore()

      const found = store.getAttractionById('unknown-id')

      expect(found).toBeUndefined()
    })

    it('should get attraction by slug', () => {
      const store = useCountryStore()
      const first = store.attractions[0]

      const found = store.getAttractionBySlug(first.slug)

      expect(found).toBeDefined()
      expect(found?.slug).toBe(first.slug)
    })

    it('should return undefined for unknown slug', () => {
      const store = useCountryStore()

      const found = store.getAttractionBySlug('unknown-slug')

      expect(found).toBeUndefined()
    })

    it('should get warnings by category', () => {
      const store = useCountryStore()

      const scamWarnings = store.getWarningsByCategory('scams')

      expect(scamWarnings.every(w => w.category === 'scams')).toBe(true)
    })
  })

  describe('API integration', () => {
    it('should fetch attractions from API', async () => {
      const store = useCountryStore()
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          attractions: [
            {
              id: 'api-1',
              slug: 'api-attraction',
              name: 'API Attraction',
              description: 'From API',
              category: 'beach',
              location: 'Somewhere',
              province: 'Phuket',
              categories: { beach: 0.9 },
              is_hidden_gem: false,
            },
          ],
          total: 1,
          hasMore: false,
        })
      )

      await store.fetchAttractions()

      expect(store.attractions.some(a => a.slug === 'api-attraction')).toBe(true)
      expect(store.attractionsLoaded).toBe(true)
    })

    it('should pass category filter to API', async () => {
      const store = useCountryStore()
      mockFetch.mockResolvedValueOnce(createMockResponse(mockAttractionListResponse))

      await store.fetchAttractions({ category: 'beach' })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('category=beach'),
        expect.any(Object)
      )
    })

    it('should pass hidden gems filter to API', async () => {
      const store = useCountryStore()
      mockFetch.mockResolvedValueOnce(createMockResponse(mockAttractionListResponse))

      await store.fetchAttractions({ hiddenGemsOnly: true })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('hidden_gems=true'),
        expect.any(Object)
      )
    })

    it('should include user prefs header for personalized fetch', async () => {
      const store = useCountryStore()
      const userStore = useUserStore()
      userStore.updatePreferences(backpackerPrefs)

      mockFetch.mockResolvedValueOnce(createMockResponse(mockAttractionListResponse))

      await store.fetchAttractions({ personalized: true })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('personalized=true'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-user-prefs': expect.any(String),
          }),
        })
      )
    })

    it('should keep fallback data on API error', async () => {
      const store = useCountryStore()
      const originalCount = store.attractions.length

      mockFetch.mockRejectedValueOnce(new Error('API Error'))

      await store.fetchAttractions()

      expect(store.attractions.length).toBe(originalCount)
    })

    it('should fetch single attraction with details', async () => {
      const store = useCountryStore()
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          attraction: {
            id: 'detail-1',
            slug: 'detailed-attraction',
            name: 'Detailed',
            description: 'Full details',
            category: 'beach',
            location: 'Beach',
            province: 'Phuket',
            categories: { beach: 0.9 },
            is_hidden_gem: false,
            tips: [
              { id: 't1', tip_type: 'timing', title: 'Best Time', content: 'Morning', is_pro_only: false, sort_order: 0 },
            ],
            secrets: [],
            recommendations: [],
          },
          matchInfo: { score: 85, reasons: ['Beach lover'] },
        })
      )

      const result = await store.fetchAttractionBySlug('detailed-attraction')

      expect(result).toBeDefined()
      expect(result?.attraction.tips.length).toBe(1)
      expect(result?.matchInfo?.score).toBe(85)
      expect(store.currentAttraction?.slug).toBe('detailed-attraction')
    })

    it('should fetch matched attractions for user with profile', async () => {
      const store = useCountryStore()
      const userStore = useUserStore()
      userStore.updatePreferences(backpackerPrefs)

      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          matches: [
            {
              attraction: {
                id: 'match-1',
                slug: 'matched',
                name: 'Matched',
                description: 'Great match',
                category: 'culture',
                location: 'Bangkok',
                province: 'Bangkok',
                categories: { culture: 0.9 },
                is_hidden_gem: false,
              },
              score: 90,
              reasons: ['Culture lover'],
            },
          ],
        })
      )

      await store.fetchMatchedAttractions()

      expect(store.matchedAttractions.length).toBe(1)
      expect(store.matchedAttractions[0].score).toBe(90)
    })

    it('should not fetch matched attractions without profile', async () => {
      const store = useCountryStore()
      // No profile set

      await store.fetchMatchedAttractions()

      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('visa types data integrity', () => {
    it('should have correct VE duration (60 days)', () => {
      const store = useCountryStore()
      const ve = store.visaTypes.find(v => v.code === 'VE')

      expect(ve?.duration).toBe(60)
      expect(ve?.extendable).toBe(true)
      expect(ve?.extensionDays).toBe(30)
    })

    it('should have correct DTV duration (180 days per entry)', () => {
      const store = useCountryStore()
      const dtv = store.visaTypes.find(v => v.code === 'DTV')

      expect(dtv?.duration).toBe(180)
      expect(dtv?.validityPeriod).toBe(1825) // 5 years
      expect(dtv?.extendable).toBe(true)
      expect(dtv?.reportingInterval).toBe(90)
    })

    it('should have correct Non-O retirement visa details', () => {
      const store = useCountryStore()
      const nonO = store.visaTypes.find(v => v.code === 'Non-O')

      expect(nonO?.duration).toBe(365) // 1 year
      expect(nonO?.extendable).toBe(true)
      expect(nonO?.reportingInterval).toBe(90)
    })

    it('should have correct VOA duration (15 days)', () => {
      const store = useCountryStore()
      const voa = store.visaTypes.find(v => v.code === 'VOA')

      expect(voa?.duration).toBe(15)
      expect(voa?.extendable).toBe(false)
    })

    it('should have Tourist Visa with correct duration', () => {
      const store = useCountryStore()
      const tr = store.visaTypes.find(v => v.code === 'TR')

      expect(tr?.duration).toBe(60)
      expect(tr?.extendable).toBe(true)
      expect(tr?.extensionDays).toBe(30)
    })

    it('should have Working Holiday visa', () => {
      const store = useCountryStore()
      const wh = store.visaTypes.find(v => v.code === 'WH')

      expect(wh).toBeDefined()
      expect(wh?.duration).toBe(365)
    })
  })
})
