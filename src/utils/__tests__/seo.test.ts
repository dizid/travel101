import { describe, it, expect, beforeEach } from 'vitest'

import {
  generateAttractionSchema,
  generateOrganizationSchema,
  generateBreadcrumbSchema,
  generateEventSchema,
  generateLandmarkSchema,
  generateFAQSchema,
  generateArticleSchema,
  generateWebSiteSchema,
  generateHowToSchema,
  getPageMeta,
  pageMeta,
  type AttractionSchema,
  type EventSchema,
  type LandmarkSchema,
  type ArticleSchema,
} from '../seo'

describe('seo utils', () => {
  describe('generateAttractionSchema', () => {
    const attraction: AttractionSchema = {
      name: 'Wat Phra Kaew',
      description: 'Temple of the Emerald Buddha',
      image: 'https://example.com/temple.jpg',
      address: 'Grand Palace',
      province: 'Bangkok',
      slug: 'wat-phra-kaew',
    }

    it('should generate valid TouristAttraction schema', () => {
      const schema = JSON.parse(generateAttractionSchema(attraction))

      expect(schema['@context']).toBe('https://schema.org')
      expect(schema['@type']).toBe('TouristAttraction')
      expect(schema.name).toBe('Wat Phra Kaew')
      expect(schema.description).toBe('Temple of the Emerald Buddha')
      expect(schema.image).toBe('https://example.com/temple.jpg')
    })

    it('should include address with Thailand as country', () => {
      const schema = JSON.parse(generateAttractionSchema(attraction))

      expect(schema.address['@type']).toBe('PostalAddress')
      expect(schema.address.addressLocality).toBe('Grand Palace')
      expect(schema.address.addressRegion).toBe('Bangkok')
      expect(schema.address.addressCountry).toBe('Thailand')
    })

    it('should generate correct URL from slug', () => {
      const schema = JSON.parse(generateAttractionSchema(attraction))

      expect(schema.url).toBe('https://happyroam.travel/attractions/wat-phra-kaew')
    })

    it('should use default image when none provided', () => {
      const noImage = { ...attraction, image: undefined }
      const schema = JSON.parse(generateAttractionSchema(noImage))

      expect(schema.image).toContain('og-image.svg')
    })

    it('should add HiddenGem type for hidden gems', () => {
      const gem = { ...attraction, isHiddenGem: true }
      const schema = JSON.parse(generateAttractionSchema(gem))

      expect(schema.additionalType).toBe('HiddenGem')
    })

    it('should not add HiddenGem type for regular attractions', () => {
      const schema = JSON.parse(generateAttractionSchema(attraction))

      expect(schema.additionalType).toBeUndefined()
    })
  })

  describe('generateOrganizationSchema', () => {
    it('should generate valid Organization schema', () => {
      const schema = JSON.parse(generateOrganizationSchema())

      expect(schema['@type']).toBe('Organization')
      expect(schema.name).toBe('HappyRoam Thailand')
      expect(schema.url).toBe('https://happyroam.travel')
      expect(schema.sameAs).toBeInstanceOf(Array)
      expect(schema.sameAs.length).toBeGreaterThan(0)
    })
  })

  describe('generateBreadcrumbSchema', () => {
    it('should generate BreadcrumbList with positions', () => {
      const items = [
        { name: 'Home', url: '/' },
        { name: 'Attractions', url: '/attractions' },
        { name: 'Wat Phra Kaew', url: '/attractions/wat-phra-kaew' },
      ]
      const schema = JSON.parse(generateBreadcrumbSchema(items))

      expect(schema['@type']).toBe('BreadcrumbList')
      expect(schema.itemListElement).toHaveLength(3)
      expect(schema.itemListElement[0].position).toBe(1)
      expect(schema.itemListElement[0].name).toBe('Home')
      expect(schema.itemListElement[2].position).toBe(3)
    })

    it('should prepend base URL to item URLs', () => {
      const items = [{ name: 'Test', url: '/test' }]
      const schema = JSON.parse(generateBreadcrumbSchema(items))

      expect(schema.itemListElement[0].item).toBe('https://happyroam.travel/test')
    })
  })

  describe('generateEventSchema', () => {
    const event: EventSchema = {
      name: 'Songkran',
      description: 'Thai New Year water festival',
      startDate: '2026-04-13',
      endDate: '2026-04-15',
      location: 'Nationwide',
      province: 'Bangkok',
      slug: 'songkran',
    }

    it('should generate valid Event schema', () => {
      const schema = JSON.parse(generateEventSchema(event))

      expect(schema['@type']).toBe('Event')
      expect(schema.name).toBe('Songkran')
      expect(schema.startDate).toBe('2026-04-13')
      expect(schema.endDate).toBe('2026-04-15')
    })

    it('should omit endDate when not provided', () => {
      const noEnd = { ...event, endDate: undefined }
      const schema = JSON.parse(generateEventSchema(noEnd))

      expect(schema.endDate).toBeUndefined()
    })

    it('should set offline attendance mode', () => {
      const schema = JSON.parse(generateEventSchema(event))

      expect(schema.eventAttendanceMode).toContain('OfflineEventAttendanceMode')
    })

    it('should generate correct URL from slug', () => {
      const schema = JSON.parse(generateEventSchema(event))

      expect(schema.url).toBe('https://happyroam.travel/festivals/songkran')
    })
  })

  describe('generateLandmarkSchema', () => {
    const landmark: LandmarkSchema = {
      name: 'Sukhothai Historical Park',
      description: 'Ancient capital ruins',
      address: 'Sukhothai',
      province: 'Sukhothai',
      slug: 'sukhothai-historical-park',
    }

    it('should generate LandmarksOrHistoricalBuildings schema', () => {
      const schema = JSON.parse(generateLandmarkSchema(landmark))

      expect(schema['@type']).toBe('LandmarksOrHistoricalBuildings')
      expect(schema.name).toBe('Sukhothai Historical Park')
    })

    it('should add UNESCO type for heritage sites', () => {
      const unesco = { ...landmark, isUNESCO: true }
      const schema = JSON.parse(generateLandmarkSchema(unesco))

      expect(schema.additionalType).toContain('WorldHeritageSite')
    })

    it('should add founding date when yearBuilt is provided', () => {
      const dated = { ...landmark, yearBuilt: 1238 }
      const schema = JSON.parse(generateLandmarkSchema(dated))

      expect(schema.foundingDate).toBe('1238')
    })

    it('should omit optional fields when not provided', () => {
      const schema = JSON.parse(generateLandmarkSchema(landmark))

      expect(schema.additionalType).toBeUndefined()
      expect(schema.foundingDate).toBeUndefined()
    })
  })

  describe('generateFAQSchema', () => {
    it('should generate FAQPage schema', () => {
      const items = [
        { question: 'Do I need a visa?', answer: 'Most nationalities get 30-day exemption.' },
        { question: 'Is it safe?', answer: 'Generally very safe for tourists.' },
      ]
      const schema = JSON.parse(generateFAQSchema(items))

      expect(schema['@type']).toBe('FAQPage')
      expect(schema.mainEntity).toHaveLength(2)
      expect(schema.mainEntity[0]['@type']).toBe('Question')
      expect(schema.mainEntity[0].name).toBe('Do I need a visa?')
      expect(schema.mainEntity[0].acceptedAnswer['@type']).toBe('Answer')
    })
  })

  describe('generateArticleSchema', () => {
    const article: ArticleSchema = {
      title: 'Best Street Food in Bangkok',
      description: 'A guide to the top street food spots',
      slug: 'best-street-food-bangkok',
      author: 'HappyRoam Thailand',
      publishedAt: '2026-01-15',
      updatedAt: '2026-02-01',
      wordCount: 2500,
    }

    it('should generate valid Article schema', () => {
      const schema = JSON.parse(generateArticleSchema(article))

      expect(schema['@type']).toBe('Article')
      expect(schema.headline).toBe('Best Street Food in Bangkok')
      expect(schema.datePublished).toBe('2026-01-15')
      expect(schema.dateModified).toBe('2026-02-01')
    })

    it('should include word count when provided', () => {
      const schema = JSON.parse(generateArticleSchema(article))

      expect(schema.wordCount).toBe(2500)
    })

    it('should omit word count when not provided', () => {
      const noCount = { ...article, wordCount: undefined }
      const schema = JSON.parse(generateArticleSchema(noCount))

      expect(schema.wordCount).toBeUndefined()
    })

    it('should include publisher info', () => {
      const schema = JSON.parse(generateArticleSchema(article))

      expect(schema.publisher['@type']).toBe('Organization')
      expect(schema.publisher.logo['@type']).toBe('ImageObject')
    })
  })

  describe('generateWebSiteSchema', () => {
    it('should generate WebSite schema with search action', () => {
      const schema = JSON.parse(generateWebSiteSchema())

      expect(schema['@type']).toBe('WebSite')
      expect(schema.potentialAction['@type']).toBe('SearchAction')
      expect(schema.potentialAction.target.urlTemplate).toContain('search_term_string')
    })
  })

  describe('generateHowToSchema', () => {
    it('should generate HowTo schema with steps', () => {
      const steps = [
        { name: 'Step 1', text: 'Fill in your name' },
        { name: 'Step 2', text: 'Add passport number' },
      ]
      const schema = JSON.parse(generateHowToSchema('Arrival Card', 'How to fill it', steps))

      expect(schema['@type']).toBe('HowTo')
      expect(schema.name).toBe('Arrival Card')
      expect(schema.step).toHaveLength(2)
      expect(schema.step[0].position).toBe(1)
      expect(schema.step[1].position).toBe(2)
    })
  })

  describe('getPageMeta', () => {
    it('should return meta for known pages', () => {
      const homeMeta = getPageMeta('home')

      expect(homeMeta.title).toBe('Thailand Travel Guide')
      expect(homeMeta.description).toBeTruthy()
    })

    it('should return home meta as fallback for unknown pages', () => {
      const meta = getPageMeta('nonexistent' as keyof typeof pageMeta)

      expect(meta.title).toBe('Thailand Travel Guide')
    })

    it('should have meta defined for all key pages', () => {
      const requiredPages = ['home', 'visa', 'attractions', 'festivals', 'heritage', 'safety', 'guides']
      for (const page of requiredPages) {
        const meta = pageMeta[page]
        expect(meta, `Missing meta for page: ${page}`).toBeDefined()
        expect(meta.title).toBeTruthy()
        expect(meta.description).toBeTruthy()
      }
    })
  })
})
