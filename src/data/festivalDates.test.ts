import { describe, it, expect } from 'vitest'
import {
  FESTIVAL_DATE_OVERRIDES,
  addDaysYmd,
  festivalDateForYear,
  festivalDatesByYear,
  nextFestivalOccurrence,
  thailandToday,
  toYmd,
} from './festivalDates.ts'

describe('festivalDates', () => {
  describe('toYmd', () => {
    it('reads a driver Date (local midnight) as the stored day', () => {
      // The Neon driver builds a DATE as local midnight
      expect(toYmd(new Date(2026, 10, 24))).toBe('2026-11-24')
    })

    it('reads API strings and plain dates', () => {
      expect(toYmd('2026-11-24T00:00:00.000Z')).toBe('2026-11-24')
      expect(toYmd('2026-11-24')).toBe('2026-11-24')
    })

    it('returns null for empty or invalid values', () => {
      expect(toYmd(null)).toBeNull()
      expect(toYmd(undefined)).toBeNull()
      expect(toYmd('')).toBeNull()
      expect(toYmd('soon')).toBeNull()
      expect(toYmd(new Date('nope'))).toBeNull()
    })
  })

  describe('thailandToday', () => {
    it('is already the next day in Bangkok at 18:00 UTC', () => {
      expect(thailandToday(new Date('2026-12-31T18:00:00Z'))).toBe('2027-01-01')
      expect(thailandToday(new Date('2026-12-31T16:59:00Z'))).toBe('2026-12-31')
    })
  })

  describe('addDaysYmd', () => {
    it('crosses month and year ends', () => {
      expect(addDaysYmd('2026-11-24', 1)).toBe('2026-11-25')
      expect(addDaysYmd('2026-12-31', 1)).toBe('2027-01-01')
      expect(addDaysYmd('2027-04-13', 2)).toBe('2027-04-15')
    })
  })

  describe('festivalDateForYear', () => {
    it('uses the code date over the database for the same year (Loy Krathong 2026 fix)', () => {
      expect(festivalDateForYear('loy-krathong', 2026, new Date(2026, 10, 25))).toBe('2026-11-24T00:00:00.000Z')
    })

    it('falls back to the database value, else null', () => {
      expect(festivalDateForYear('bo-sang-umbrella', 2026, new Date(2026, 0, 16))).toBe('2026-01-16T00:00:00.000Z')
      expect(festivalDateForYear('bo-sang-umbrella', 2027)).toBeNull()
    })

    it('has 2027 dates for the officially announced holidays', () => {
      expect(festivalDateForYear('makha-bucha', 2027)).toBe('2027-02-21T00:00:00.000Z')
      expect(festivalDateForYear('visakha-bucha', 2027)).toBe('2027-05-20T00:00:00.000Z')
      expect(festivalDateForYear('songkran', 2027)).toBe('2027-04-13T00:00:00.000Z')
      expect(festivalDateForYear('chinese-new-year', 2027)).toBe('2027-02-06T00:00:00.000Z')
    })
  })

  describe('override table', () => {
    it('holds only valid calendar dates that match their year', () => {
      for (const [slug, years] of Object.entries(FESTIVAL_DATE_OVERRIDES)) {
        for (const [year, ymd] of Object.entries(years)) {
          expect(ymd, slug).toMatch(/^\d{4}-\d{2}-\d{2}$/)
          expect(ymd!.slice(0, 4), slug).toBe(year)
          expect(addDaysYmd(ymd!, 0), slug).toBe(ymd)
        }
      }
    })
  })

  describe('festivalDatesByYear', () => {
    it('merges database and code dates, oldest first', () => {
      const dates = festivalDatesByYear({ slug: 'songkran', date2025: '2025-04-13', date2026: '2026-04-13' })
      expect(dates).toEqual([
        { year: 2025, ymd: '2025-04-13' },
        { year: 2026, ymd: '2026-04-13' },
        { year: 2027, ymd: '2027-04-13' },
      ])
    })
  })

  describe('nextFestivalOccurrence', () => {
    const songkran = { slug: 'songkran', date2025: '2025-04-13', date2026: '2026-04-13', durationDays: 3 }

    it('finds the 2027 date once 2026 has passed (the old code only knew 2025/2026)', () => {
      expect(nextFestivalOccurrence(songkran, '2027-01-05')).toEqual({
        nextDate: '2027-04-13T00:00:00.000Z',
        daysUntil: 98,
        isOngoing: false,
      })
    })

    it('counts a multi-day festival as on until its last day', () => {
      expect(nextFestivalOccurrence(songkran, '2027-04-15')).toEqual({
        nextDate: '2027-04-13T00:00:00.000Z',
        daysUntil: 0,
        isOngoing: true,
      })
    })

    it('counts the first day as on', () => {
      const surin = { slug: 'surin-elephant-roundup', date2026: '2026-11-21', durationDays: 2 }
      expect(nextFestivalOccurrence(surin, '2026-11-21')).toMatchObject({ daysUntil: 0, isOngoing: true })
      expect(nextFestivalOccurrence(surin, '2026-11-20')).toMatchObject({ daysUntil: 1, isOngoing: false })
    })

    it('returns null when every known date has passed', () => {
      const naga = { slug: 'naga-fireballs', date2025: '2025-10-07', date2026: '2026-10-26', durationDays: 1 }
      expect(nextFestivalOccurrence(naga, '2026-11-20')).toBeNull()
    })

    it('uses the corrected Loy Krathong 2026 date', () => {
      const loy = { slug: 'loy-krathong', date2026: new Date(2026, 10, 25), durationDays: 1 }
      expect(nextFestivalOccurrence(loy, '2026-11-20')).toEqual({
        nextDate: '2026-11-24T00:00:00.000Z',
        daysUntil: 4,
        isOngoing: false,
      })
    })

    it('handles a festival with no dates', () => {
      expect(nextFestivalOccurrence({ slug: 'full-moon-party', date2025: null, date2026: null }, '2026-11-20')).toBeNull()
    })
  })
})
