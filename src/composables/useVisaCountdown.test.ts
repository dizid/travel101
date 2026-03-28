import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useVisaCountdown, type VisaEntry, type VisaType } from './useVisaCountdown'

describe('useVisaCountdown', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    // Set "today" to 2026-06-15 for deterministic tests
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'))
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function makeEntry(overrides: Partial<VisaEntry> = {}): VisaEntry {
    return {
      entryDate: '2026-06-01',
      visaType: 'visa-exemption',
      ninetyDayReports: [],
      ...overrides,
    }
  }

  // --- getVisaDays ---

  describe('getVisaDays', () => {
    it('returns 60 for visa-exemption', () => {
      const { getVisaDays } = useVisaCountdown()
      expect(getVisaDays('visa-exemption')).toBe(60)
    })

    it('returns 60 for tourist-visa', () => {
      const { getVisaDays } = useVisaCountdown()
      expect(getVisaDays('tourist-visa')).toBe(60)
    })

    it('returns 180 for dtv', () => {
      const { getVisaDays } = useVisaCountdown()
      expect(getVisaDays('dtv')).toBe(180)
    })

    it('returns 90 for education-visa', () => {
      const { getVisaDays } = useVisaCountdown()
      expect(getVisaDays('education-visa')).toBe(90)
    })

    it('returns 365 for retirement-visa', () => {
      const { getVisaDays } = useVisaCountdown()
      expect(getVisaDays('retirement-visa')).toBe(365)
    })

    it('returns 90 for business-visa', () => {
      const { getVisaDays } = useVisaCountdown()
      expect(getVisaDays('business-visa')).toBe(90)
    })

    it('returns customDays for custom type', () => {
      const { getVisaDays } = useVisaCountdown()
      expect(getVisaDays('custom', 45)).toBe(45)
    })

    it('defaults to 30 for custom type without customDays', () => {
      const { getVisaDays } = useVisaCountdown()
      expect(getVisaDays('custom')).toBe(30)
    })
  })

  // --- getVisaLabel ---

  describe('getVisaLabel', () => {
    it('returns correct labels for all visa types', () => {
      const { getVisaLabel } = useVisaCountdown()
      expect(getVisaLabel('visa-exemption')).toBe('Visa Exemption (60 days)')
      expect(getVisaLabel('tourist-visa')).toBe('Tourist Visa (60 days)')
      expect(getVisaLabel('dtv')).toContain('DTV')
      expect(getVisaLabel('education-visa')).toContain('ED')
      expect(getVisaLabel('retirement-visa')).toContain('O-A')
      expect(getVisaLabel('business-visa')).toContain('Business')
      expect(getVisaLabel('custom')).toBe('Custom Duration')
    })
  })

  // --- totalDays ---

  describe('totalDays', () => {
    it('returns 0 when no entry is set', () => {
      const { totalDays } = useVisaCountdown()
      expect(totalDays.value).toBe(0)
    })

    it('returns base days for visa without extension', () => {
      const { setEntry, totalDays } = useVisaCountdown()
      setEntry(makeEntry({ visaType: 'tourist-visa' }))
      expect(totalDays.value).toBe(60)
    })

    it('adds 30 days when extension is applied', () => {
      const { setEntry, totalDays } = useVisaCountdown()
      setEntry(makeEntry({ visaType: 'visa-exemption', extensionDate: '2026-06-10' }))
      expect(totalDays.value).toBe(90)
    })

    it('returns customDays for custom visa type', () => {
      const { setEntry, totalDays } = useVisaCountdown()
      setEntry(makeEntry({ visaType: 'custom', customDays: 120 }))
      expect(totalDays.value).toBe(120)
    })
  })

  // --- expiryDate ---

  describe('expiryDate', () => {
    it('returns empty string when no entry', () => {
      const { expiryDate } = useVisaCountdown()
      expect(expiryDate.value).toBe('')
    })

    it('calculates correct expiry from entry date + total days', () => {
      const { setEntry, expiryDate } = useVisaCountdown()
      // Entry 2026-06-01 + 60 days = 2026-07-31
      setEntry(makeEntry({ entryDate: '2026-06-01', visaType: 'visa-exemption' }))
      expect(expiryDate.value).toBe('2026-07-31')
    })

    it('accounts for extension in expiry date', () => {
      const { setEntry, expiryDate } = useVisaCountdown()
      // Entry 2026-06-01 + 90 days (60+30) = 2026-08-30
      setEntry(makeEntry({ entryDate: '2026-06-01', visaType: 'visa-exemption', extensionDate: '2026-07-01' }))
      expect(expiryDate.value).toBe('2026-08-30')
    })
  })

  // --- daysRemaining ---

  describe('daysRemaining', () => {
    it('returns 0 when no entry', () => {
      const { daysRemaining } = useVisaCountdown()
      expect(daysRemaining.value).toBe(0)
    })

    it('returns positive days when visa is active', () => {
      const { setEntry, daysRemaining } = useVisaCountdown()
      // Today is 2026-06-15, entry 2026-06-01, expiry 2026-07-31 => 46 days remaining
      setEntry(makeEntry({ entryDate: '2026-06-01', visaType: 'visa-exemption' }))
      expect(daysRemaining.value).toBe(46)
    })

    it('returns 0 on expiry day', () => {
      const { setEntry, daysRemaining } = useVisaCountdown()
      // Set entry so expiry is exactly today (2026-06-15)
      // 15 days ago + 15 day custom visa = expires today
      setEntry(makeEntry({ entryDate: '2026-06-01', visaType: 'custom', customDays: 14 }))
      expect(daysRemaining.value).toBe(0)
    })

    it('returns negative days when visa has expired', () => {
      const { setEntry, daysRemaining } = useVisaCountdown()
      // Entry 2026-05-01, custom 10 days => expired 2026-05-11, today is 2026-06-15
      setEntry(makeEntry({ entryDate: '2026-05-01', visaType: 'custom', customDays: 10 }))
      expect(daysRemaining.value).toBeLessThan(0)
    })
  })

  // --- percentRemaining ---

  describe('percentRemaining', () => {
    it('returns 0 when no entry', () => {
      const { percentRemaining } = useVisaCountdown()
      expect(percentRemaining.value).toBe(0)
    })

    it('returns value between 0 and 100 for active visa', () => {
      const { setEntry, percentRemaining } = useVisaCountdown()
      setEntry(makeEntry({ entryDate: '2026-06-01', visaType: 'visa-exemption' }))
      expect(percentRemaining.value).toBeGreaterThan(0)
      expect(percentRemaining.value).toBeLessThanOrEqual(100)
    })

    it('returns 0 when visa has expired', () => {
      const { setEntry, percentRemaining } = useVisaCountdown()
      setEntry(makeEntry({ entryDate: '2026-04-01', visaType: 'custom', customDays: 10 }))
      expect(percentRemaining.value).toBe(0)
    })

    it('is capped at 100', () => {
      const { setEntry, percentRemaining } = useVisaCountdown()
      // Entry today with 365 days = nearly 100%
      setEntry(makeEntry({ entryDate: '2026-06-15', visaType: 'retirement-visa' }))
      expect(percentRemaining.value).toBe(100)
    })
  })

  // --- urgency ---

  describe('urgency', () => {
    it('returns expired when daysRemaining <= 0', () => {
      const { setEntry, urgency } = useVisaCountdown()
      setEntry(makeEntry({ entryDate: '2026-04-01', visaType: 'custom', customDays: 10 }))
      expect(urgency.value).toBe('expired')
    })

    it('returns danger when daysRemaining < 15', () => {
      const { setEntry, urgency } = useVisaCountdown()
      // Today 2026-06-15, need expiry ~2026-06-25 => 10 days remaining
      // Entry 2026-06-05, custom 20 days => expires 2026-06-25 => 10 days
      setEntry(makeEntry({ entryDate: '2026-06-05', visaType: 'custom', customDays: 20 }))
      expect(urgency.value).toBe('danger')
    })

    it('returns warning when daysRemaining is 15-30', () => {
      const { setEntry, urgency } = useVisaCountdown()
      // Today 2026-06-15, need expiry around 2026-07-05 => 20 days
      // Entry 2026-06-05, custom 30 days => expires 2026-07-05 => 20 days
      setEntry(makeEntry({ entryDate: '2026-06-05', visaType: 'custom', customDays: 30 }))
      expect(urgency.value).toBe('warning')
    })

    it('returns safe when daysRemaining > 30', () => {
      const { setEntry, urgency } = useVisaCountdown()
      setEntry(makeEntry({ entryDate: '2026-06-01', visaType: 'visa-exemption' }))
      // 46 days remaining
      expect(urgency.value).toBe('safe')
    })
  })

  // --- canExtend ---

  describe('canExtend', () => {
    it('returns false when no entry', () => {
      const { canExtend } = useVisaCountdown()
      expect(canExtend.value).toBe(false)
    })

    it('returns true for visa-exemption without extension', () => {
      const { setEntry, canExtend } = useVisaCountdown()
      setEntry(makeEntry({ visaType: 'visa-exemption' }))
      expect(canExtend.value).toBe(true)
    })

    it('returns true for tourist-visa without extension', () => {
      const { setEntry, canExtend } = useVisaCountdown()
      setEntry(makeEntry({ visaType: 'tourist-visa' }))
      expect(canExtend.value).toBe(true)
    })

    it('returns false for visa-exemption already extended', () => {
      const { setEntry, canExtend } = useVisaCountdown()
      setEntry(makeEntry({ visaType: 'visa-exemption', extensionDate: '2026-06-10' }))
      expect(canExtend.value).toBe(false)
    })

    it('returns false for non-extendable visa types', () => {
      const { setEntry, canExtend } = useVisaCountdown()
      const nonExtendable: VisaType[] = ['dtv', 'education-visa', 'retirement-visa', 'business-visa', 'custom']
      for (const type of nonExtendable) {
        setEntry(makeEntry({ visaType: type, customDays: 30 }))
        expect(canExtend.value).toBe(false)
      }
    })
  })

  // --- setEntry / clearEntry ---

  describe('setEntry and clearEntry', () => {
    it('sets visaEntry and persists to localStorage', () => {
      const { setEntry, visaEntry } = useVisaCountdown()
      const entry = makeEntry()
      setEntry(entry)
      expect(visaEntry.value).toEqual(entry)
      expect(localStorage.setItem).toHaveBeenCalledWith('happyroam_visa_countdown', JSON.stringify(entry))
    })

    it('clearEntry removes entry and clears localStorage', () => {
      const { setEntry, clearEntry, visaEntry } = useVisaCountdown()
      setEntry(makeEntry())
      clearEntry()
      expect(visaEntry.value).toBeNull()
      expect(localStorage.removeItem).toHaveBeenCalledWith('happyroam_visa_countdown')
    })
  })

  // --- addExtension ---

  describe('addExtension', () => {
    it('sets extensionDate to today and persists', () => {
      const { setEntry, addExtension, visaEntry } = useVisaCountdown()
      setEntry(makeEntry({ visaType: 'visa-exemption' }))
      addExtension()
      expect(visaEntry.value?.extensionDate).toBe('2026-06-15')
      expect(localStorage.setItem).toHaveBeenCalled()
    })

    it('does nothing for non-extendable visa types', () => {
      const { setEntry, addExtension, visaEntry } = useVisaCountdown()
      setEntry(makeEntry({ visaType: 'dtv' }))
      addExtension()
      expect(visaEntry.value?.extensionDate).toBeUndefined()
    })

    it('does nothing if already extended', () => {
      const { setEntry, addExtension, visaEntry } = useVisaCountdown()
      setEntry(makeEntry({ visaType: 'visa-exemption', extensionDate: '2026-06-10' }))
      addExtension()
      // Should keep the original extension date
      expect(visaEntry.value?.extensionDate).toBe('2026-06-10')
    })

    it('does nothing when no entry', () => {
      const { addExtension, visaEntry } = useVisaCountdown()
      addExtension()
      expect(visaEntry.value).toBeNull()
    })
  })

  // --- add90DayReport ---

  describe('add90DayReport', () => {
    it('appends today to ninetyDayReports array', () => {
      const { setEntry, add90DayReport, visaEntry } = useVisaCountdown()
      setEntry(makeEntry({ visaType: 'retirement-visa' }))
      add90DayReport()
      expect(visaEntry.value?.ninetyDayReports).toEqual(['2026-06-15'])
    })

    it('appends multiple reports', () => {
      const { setEntry, add90DayReport, visaEntry } = useVisaCountdown()
      setEntry(makeEntry({ visaType: 'retirement-visa' }))
      add90DayReport()
      vi.setSystemTime(new Date('2026-09-01T12:00:00Z'))
      add90DayReport()
      expect(visaEntry.value?.ninetyDayReports).toEqual(['2026-06-15', '2026-09-01'])
    })

    it('does nothing when no entry', () => {
      const { add90DayReport, visaEntry } = useVisaCountdown()
      add90DayReport()
      expect(visaEntry.value).toBeNull()
    })
  })

  // --- next90DayReport ---

  describe('next90DayReport', () => {
    it('returns null for visa types with totalDays <= 90', () => {
      const { setEntry, next90DayReport } = useVisaCountdown()
      setEntry(makeEntry({ visaType: 'visa-exemption' })) // 60 days
      expect(next90DayReport.value).toBeNull()
    })

    it('returns first 90-day report date for DTV visa', () => {
      const { setEntry, next90DayReport } = useVisaCountdown()
      // Entry 2026-06-01, DTV = 180 days, today = 2026-06-15
      // First 90-day report due: 2026-06-01 + 90 = 2026-08-30
      setEntry(makeEntry({ entryDate: '2026-06-01', visaType: 'dtv' }))
      expect(next90DayReport.value).toBe('2026-08-30')
    })

    it('returns null when no entry', () => {
      const { next90DayReport } = useVisaCountdown()
      expect(next90DayReport.value).toBeNull()
    })

    it('skips cycles that have already been reported', () => {
      const { setEntry, next90DayReport } = useVisaCountdown()
      // Entry 2026-01-01, retirement visa = 365 days
      // First report due: 2026-04-01 (90 days), already reported
      // Today = 2026-06-15
      // Next due: 2026-06-30 (180 days) => this should be returned
      setEntry(makeEntry({
        entryDate: '2026-01-01',
        visaType: 'retirement-visa',
        ninetyDayReports: ['2026-03-30'], // reported near cycle 1
      }))
      expect(next90DayReport.value).toBe('2026-06-30')
    })
  })

  // --- daysUntilNext90Day ---

  describe('daysUntilNext90Day', () => {
    it('returns null when next90DayReport is null', () => {
      const { daysUntilNext90Day } = useVisaCountdown()
      expect(daysUntilNext90Day.value).toBeNull()
    })

    it('returns correct days until next 90-day report', () => {
      const { setEntry, daysUntilNext90Day } = useVisaCountdown()
      // Entry 2026-06-01, DTV = 180 days, today = 2026-06-15
      // Next report: 2026-08-30, days until: 76
      setEntry(makeEntry({ entryDate: '2026-06-01', visaType: 'dtv' }))
      expect(daysUntilNext90Day.value).toBe(76)
    })
  })

  // --- localStorage persistence on load ---

  describe('localStorage loading', () => {
    it('loads existing entry from localStorage on creation', () => {
      const entry = makeEntry({ visaType: 'tourist-visa' })
      localStorage.setItem('happyroam_visa_countdown', JSON.stringify(entry))
      const { visaEntry } = useVisaCountdown()
      expect(visaEntry.value).toEqual(entry)
    })

    it('returns null for empty localStorage', () => {
      const { visaEntry } = useVisaCountdown()
      expect(visaEntry.value).toBeNull()
    })

    it('handles corrupt localStorage data gracefully', () => {
      localStorage.setItem('happyroam_visa_countdown', 'not-valid-json{{{')
      const { visaEntry } = useVisaCountdown()
      expect(visaEntry.value).toBeNull()
    })
  })
})
