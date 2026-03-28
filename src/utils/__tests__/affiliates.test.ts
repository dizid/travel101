import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  generateAffiliateUrl,
  generateAllAffiliateLinks,
  trackAffiliateClick,
  generateHeritageHotelUrl,
  generateTransportUrl,
  getContextAffiliateLinks,
  affiliateContexts,
  travelEssentials,
  type AffiliatePartner,
} from '../affiliates'

describe('affiliates', () => {
  beforeEach(() => {
    // Clear all affiliate env vars
    delete import.meta.env.VITE_KLOOK_AFFILIATE_ID
    delete import.meta.env.VITE_AGODA_AFFILIATE_ID
    delete import.meta.env.VITE_12GO_AFFILIATE_ID
    delete import.meta.env.VITE_GETYOURGUIDE_AFFILIATE_ID
    delete import.meta.env.VITE_VIATOR_AFFILIATE_ID
    delete import.meta.env.VITE_SAFETYWING_AFFILIATE_ID
    delete import.meta.env.VITE_NORDVPN_AFFILIATE_ID
  })

  // --- generateAffiliateUrl ---

  describe('generateAffiliateUrl', () => {
    describe('without affiliate IDs', () => {
      it('generates Klook search URL', () => {
        const url = generateAffiliateUrl('klook', 'Bangkok', 'Grand Palace')
        expect(url).toContain('klook.com')
        expect(url).toContain('query=')
        expect(url).toContain('Grand%20Palace')
        expect(url).toContain('Bangkok')
      })

      it('generates Agoda partner search URL', () => {
        const url = generateAffiliateUrl('agoda', 'Chiang Mai')
        expect(url).toContain('agoda.com/partners/partnersearch.aspx')
        expect(url).toContain('city=Chiang+Mai')
      })

      it('generates 12Go URL with slugified destination', () => {
        const url = generateAffiliateUrl('12go', 'Chiang Mai')
        expect(url).toContain('12go.asia/en/travel/thailand/chiang-mai')
        expect(url).not.toContain('referer=')
      })

      it('generates GetYourGuide search URL', () => {
        const url = generateAffiliateUrl('getyourguide', 'Phuket', 'Phi Phi Islands')
        expect(url).toContain('getyourguide.com/s/')
        expect(url).toContain('Phi+Phi+Islands')
        expect(url).toContain('Thailand')
      })

      it('generates Viator search URL', () => {
        const url = generateAffiliateUrl('viator', 'Bangkok', 'Temple Tour')
        expect(url).toContain('viator.com/searchResults')
        expect(url).toContain('Temple+Tour')
      })

      it('generates SafetyWing URL without referenceID', () => {
        const url = generateAffiliateUrl('safetywing', 'Bangkok')
        expect(url).toBe('https://safetywing.com/nomad-insurance')
      })

      it('generates NordVPN URL', () => {
        const url = generateAffiliateUrl('nordvpn', 'anywhere')
        expect(url).toContain('nordvpn.com')
      })
    })

    describe('with affiliate IDs', () => {
      it('wraps Klook URL in affiliate redirect', () => {
        import.meta.env.VITE_KLOOK_AFFILIATE_ID = 'klk123'
        const url = generateAffiliateUrl('klook', 'Bangkok')
        expect(url).toContain('affiliate.klook.com/redirect')
        expect(url).toContain('aid=klk123')
      })

      it('adds cid param for Agoda', () => {
        import.meta.env.VITE_AGODA_AFFILIATE_ID = 'agd456'
        const url = generateAffiliateUrl('agoda', 'Phuket')
        expect(url).toContain('cid=agd456')
      })

      it('adds referer param for 12Go', () => {
        import.meta.env.VITE_12GO_AFFILIATE_ID = '12g789'
        const url = generateAffiliateUrl('12go', 'Bangkok')
        expect(url).toContain('referer=12g789')
      })

      it('adds partner_id for GetYourGuide', () => {
        import.meta.env.VITE_GETYOURGUIDE_AFFILIATE_ID = 'gyg101'
        const url = generateAffiliateUrl('getyourguide', 'Bangkok')
        expect(url).toContain('partner_id=gyg101')
        expect(url).toContain('utm_medium=online_publisher')
      })

      it('adds pid for Viator', () => {
        import.meta.env.VITE_VIATOR_AFFILIATE_ID = 'via202'
        const url = generateAffiliateUrl('viator', 'Bangkok')
        expect(url).toContain('pid=via202')
        expect(url).toContain('campaign=happytravel')
      })

      it('adds referenceID for SafetyWing', () => {
        import.meta.env.VITE_SAFETYWING_AFFILIATE_ID = 'sw303'
        const url = generateAffiliateUrl('safetywing', 'Bangkok')
        expect(url).toContain('referenceID=sw303')
      })
    })

    it('encodes special characters in destination', () => {
      const url = generateAffiliateUrl('klook', "Ko Phi Phi Don")
      expect(url).toContain('Ko%20Phi%20Phi%20Don')
    })

    it('builds Klook URL with destination only when no attraction name', () => {
      const url = generateAffiliateUrl('klook', 'Bangkok')
      expect(url).toContain('query=Bangkok')
      expect(url).not.toContain('undefined')
    })
  })

  // --- generateAllAffiliateLinks ---

  describe('generateAllAffiliateLinks', () => {
    it('returns URLs for all 7 partners', () => {
      const links = generateAllAffiliateLinks('Bangkok')
      const partners: AffiliatePartner[] = ['klook', 'agoda', '12go', 'getyourguide', 'viator', 'safetywing', 'nordvpn']
      for (const partner of partners) {
        expect(links[partner]).toBeDefined()
        expect(links[partner]).toContain('http')
      }
    })

    it('passes attraction name to relevant partners', () => {
      const links = generateAllAffiliateLinks('Bangkok', 'Grand Palace')
      expect(links.klook).toContain('Grand%20Palace')
      expect(links.getyourguide).toContain('Grand+Palace')
      expect(links.viator).toContain('Grand+Palace')
    })
  })

  // --- trackAffiliateClick ---

  describe('trackAffiliateClick', () => {
    it('calls gtag when available', () => {
      const mockGtag = vi.fn()
      ;(window as any).gtag = mockGtag
      trackAffiliateClick('klook', 'Bangkok', 'grand-palace')
      expect(mockGtag).toHaveBeenCalledWith('event', 'affiliate_click', {
        partner: 'klook',
        destination: 'Bangkok',
        attraction: 'grand-palace',
      })
      delete (window as any).gtag
    })

    it('does not throw when gtag is not available', () => {
      delete (window as any).gtag
      expect(() => trackAffiliateClick('klook', 'Bangkok')).not.toThrow()
    })
  })

  // --- generateHeritageHotelUrl ---

  describe('generateHeritageHotelUrl', () => {
    it('builds Agoda URL with hotel name and province', () => {
      const url = generateHeritageHotelUrl('Aman Nai Lert', 'Bangkok')
      expect(url).toContain('agoda.com/partners/partnersearch.aspx')
      expect(url).toContain('textToSearch=Aman+Nai+Lert+Bangkok+Thailand')
    })

    it('includes affiliate ID when available', () => {
      import.meta.env.VITE_AGODA_AFFILIATE_ID = 'agd456'
      const url = generateHeritageHotelUrl('Hotel', 'Phuket')
      expect(url).toContain('cid=agd456')
    })
  })

  // --- generateTransportUrl ---

  describe('generateTransportUrl', () => {
    it('builds 12Go URL with slugified from/to', () => {
      const url = generateTransportUrl('Chiang Mai', 'Chiang Rai')
      expect(url).toBe('https://12go.asia/en/travel/chiang-mai/chiang-rai')
    })

    it('includes affiliate ID when available', () => {
      import.meta.env.VITE_12GO_AFFILIATE_ID = '12g789'
      const url = generateTransportUrl('Bangkok', 'Pattaya')
      expect(url).toContain('referer=12g789')
    })
  })

  // --- getContextAffiliateLinks ---

  describe('getContextAffiliateLinks', () => {
    it('returns correct partners for attractionDetail context', () => {
      const links = getContextAffiliateLinks('attractionDetail', 'Bangkok')
      expect(Object.keys(links)).toEqual(expect.arrayContaining(['klook', 'getyourguide', 'viator', 'agoda']))
      expect(Object.keys(links)).not.toContain('safetywing')
    })

    it('returns only Agoda for heritageHotel context', () => {
      const links = getContextAffiliateLinks('heritageHotel', 'Bangkok')
      expect(Object.keys(links)).toEqual(['agoda'])
    })

    it('returns essentials partners for essentials context', () => {
      const links = getContextAffiliateLinks('essentials', 'Bangkok')
      expect(Object.keys(links)).toEqual(expect.arrayContaining(['safetywing', 'nordvpn']))
    })

    it('returns only 12go for transport context', () => {
      const links = getContextAffiliateLinks('transport', 'Bangkok')
      expect(Object.keys(links)).toEqual(['12go'])
    })
  })

  // --- Static data shape ---

  describe('affiliateContexts', () => {
    it('has all expected context keys', () => {
      const keys = Object.keys(affiliateContexts)
      expect(keys).toContain('attractionDetail')
      expect(keys).toContain('heritageHotel')
      expect(keys).toContain('activities')
      expect(keys).toContain('transport')
      expect(keys).toContain('destination')
      expect(keys).toContain('essentials')
      expect(keys).toContain('visa')
    })
  })

  describe('travelEssentials', () => {
    it('contains SafetyWing and NordVPN entries', () => {
      expect(travelEssentials).toHaveLength(2)
      expect(travelEssentials[0].partner).toBe('safetywing')
      expect(travelEssentials[1].partner).toBe('nordvpn')
    })

    it('has required display fields', () => {
      for (const essential of travelEssentials) {
        expect(essential.name).toBeDefined()
        expect(essential.description).toBeDefined()
        expect(essential.tagline).toBeDefined()
        expect(essential.color).toBeDefined()
      }
    })
  })
})
