import { describe, it, expect } from 'vitest'
import { countries } from '@/data/countries'
import {
  ALL_VISA_ELIGIBILITY,
  getVisaEligibility,
  getBestVisaOption,
  isVisaExempt,
  isVoaEligible,
} from './visaEligibility'

// The 60 nationalities in the TAT / Royal Thai Embassy 30-day list (effective 15 Sep 2026)
const THIRTY_DAY = [
  'AU', 'AT', 'BH', 'BE', 'BG', 'BT', 'BN', 'CA', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FJ', 'FI', 'FR', 'GE', 'DE',
  'GR', 'HU', 'IS', 'ID', 'IN', 'IE', 'IL', 'IT', 'JP', 'JO', 'KW', 'KG', 'LV', 'LI', 'LT', 'LU', 'MT', 'MY',
  'MV', 'NL', 'NZ', 'NO', 'OM', 'PH', 'PL', 'PT', 'QA', 'RO', 'SA', 'SG', 'SK', 'SI', 'ZA', 'ES', 'SE', 'CH',
  'TW', 'TR', 'UA', 'AE', 'GB', 'US',
]

describe('visaEligibility (rules from 15 Sep 2026)', () => {
  it('gives exactly 30 days to all 60 listed nationalities', () => {
    expect(THIRTY_DAY).toHaveLength(60)
    for (const code of THIRTY_DAY) {
      const e = getVisaEligibility(code)
      expect(e?.exemption, code).toBe(true)
      expect(e?.exemptionDays, code).toBe(30)
    }
  })

  it('never returns the old 60-day exemption for anyone', () => {
    for (const [code, e] of Object.entries(ALL_VISA_ELIGIBILITY)) {
      expect(e.exemptionDays, code).not.toBe(60)
    }
  })

  it('every listed code exists in the wizard nationality list', () => {
    const known = new Set(countries.map((c) => c.code))
    for (const code of Object.keys(ALL_VISA_ELIGIBILITY)) {
      expect(known.has(code), code).toBe(true)
    }
  })

  it('gives 15 days to Seychelles and Mauritius', () => {
    expect(getVisaEligibility('SC')?.exemptionDays).toBe(15)
    expect(getVisaEligibility('MU')?.exemptionDays).toBe(15)
  })

  it('applies bilateral agreements (90 / 30 / 14 days) with a bilateral note', () => {
    for (const code of ['AR', 'BR', 'CL', 'KR', 'PE']) expect(getVisaEligibility(code)?.exemptionDays, code).toBe(90)
    for (const code of ['CN', 'HK', 'KZ', 'LA', 'MO', 'MN', 'RU', 'TL', 'VN']) expect(getVisaEligibility(code)?.exemptionDays, code).toBe(30)
    for (const code of ['KH', 'MM']) expect(getVisaEligibility(code)?.exemptionDays, code).toBe(14)
    expect(getVisaEligibility('KR')?.notes).toContain('bilateral')
  })

  it('gives Visa on Arrival (15 days) only to Azerbaijan, Belarus, Serbia', () => {
    for (const code of ['AZ', 'BY', 'RS']) {
      expect(isVoaEligible(code), code).toBe(true)
      expect(getVisaEligibility(code)?.voaDays).toBe(15)
      expect(isVisaExempt(code)).toBe(false)
    }
    expect(isVoaEligible('CN')).toBe(false)
    expect(isVoaEligible('IN')).toBe(false)
  })

  it('returns null for nationalities that cannot be confirmed', () => {
    for (const code of ['MX', 'PK', 'BD', 'LK', 'NP', 'IR', 'AF', 'SY', 'YE', 'UZ', 'MC', 'XX']) {
      expect(getVisaEligibility(code), code).toBeNull()
    }
  })

  describe('getBestVisaOption', () => {
    it('UK passport, 30 days: exemption', () => {
      const r = getBestVisaOption('GB', 30)
      expect(r.visaType).toBe('exemption')
      expect(r.maxDays).toBe(30)
    })

    it('UK passport, 45 days: not exempt, never promises an extension', () => {
      const r = getBestVisaOption('GB', 45)
      expect(r.visaType).toBe('tourist')
      expect(r.notes).not.toMatch(/1,900|\+ ?30/)
    })

    it('exemption notes use no promised extension fee and mention the twice-a-year land rule', () => {
      expect(getBestVisaOption('US', 20).notes).toContain('discretion')
      expect(getBestVisaOption('US', 20, true).notes).toContain('2 per calendar year')
    })

    it('Korea, 90 days: bilateral exemption', () => {
      expect(getBestVisaOption('KR', 90).visaType).toBe('exemption')
    })

    it('Serbia, 15 days: VOA with 2,000 THB', () => {
      const r = getBestVisaOption('RS', 15)
      expect(r.visaType).toBe('voa')
      expect(r.notes).toContain('2,000')
    })

    it('unknown nationality: asks to check with the embassy', () => {
      const r = getBestVisaOption('MX', 30)
      expect(r.visaType).toBe('none')
      expect(r.notes).toContain('embassy')
    })
  })
})
