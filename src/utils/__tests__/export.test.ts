import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  generateIcsCalendar,
  generateTextItinerary,
  copyItineraryToClipboard,
  downloadIcsCalendar,
  printItinerary,
} from '../export'
import type { Itinerary, ItineraryDay, ItineraryActivity } from '@/composables/useItinerary'

function makeActivity(overrides: Partial<ItineraryActivity> = {}): ItineraryActivity {
  return {
    id: 'act-1',
    dayId: 'day-1',
    timeSlot: '09:00',
    title: 'Visit Grand Palace',
    description: 'Royal palace complex',
    durationMinutes: 120,
    estimatedCostThb: 500,
    sortOrder: 0,
    ...overrides,
  }
}

function makeDay(overrides: Partial<ItineraryDay> = {}): ItineraryDay {
  return {
    id: 'day-1',
    itineraryId: 'itin-1',
    dayNumber: 1,
    date: '2026-07-01',
    location: 'Bangkok',
    activities: [makeActivity()],
    ...overrides,
  }
}

function makeItinerary(overrides: Partial<Itinerary> = {}): Itinerary {
  return {
    id: 'itin-1',
    userId: 'user-1',
    name: 'Thailand Adventure',
    startDate: '2026-07-01',
    endDate: '2026-07-05',
    status: 'active',
    aiGenerated: false,
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
    days: [makeDay()],
    ...overrides,
  }
}

describe('export utils', () => {
  // --- generateIcsCalendar ---

  describe('generateIcsCalendar', () => {
    it('returns empty string when itinerary has no days', () => {
      const result = generateIcsCalendar(makeItinerary({ days: undefined }))
      expect(result).toBe('')
    })

    it('generates valid ICS calendar structure', () => {
      const ics = generateIcsCalendar(makeItinerary())
      expect(ics).toContain('BEGIN:VCALENDAR')
      expect(ics).toContain('VERSION:2.0')
      expect(ics).toContain('PRODID:-//HappyRoam Travel//Thailand Trip//EN')
      expect(ics).toContain('X-WR-CALNAME:Thailand Adventure')
      expect(ics).toContain('END:VCALENDAR')
    })

    it('creates VEVENT for each activity', () => {
      const ics = generateIcsCalendar(makeItinerary())
      expect(ics).toContain('BEGIN:VEVENT')
      expect(ics).toContain('END:VEVENT')
      expect(ics).toContain('SUMMARY:Visit Grand Palace')
      expect(ics).toContain('LOCATION:Bangkok')
    })

    it('sets DTSTART and DTEND from timeSlot and duration', () => {
      const ics = generateIcsCalendar(makeItinerary())
      // 2026-07-01 at 09:00 => DTSTART:20260701T090000
      expect(ics).toContain('DTSTART:20260701T090000')
      // 09:00 + 120 minutes = 11:00 => DTEND:20260701T110000
      expect(ics).toContain('DTEND:20260701T110000')
    })

    it('includes cost in description when present', () => {
      const ics = generateIcsCalendar(makeItinerary())
      expect(ics).toContain('(฿500)')
    })

    it('uses activity UID format', () => {
      const ics = generateIcsCalendar(makeItinerary())
      expect(ics).toContain('UID:act-1@happyroam.travel')
    })

    it('handles multiple days and activities', () => {
      const itinerary = makeItinerary({
        days: [
          makeDay({ dayNumber: 1, activities: [makeActivity({ id: 'a1' }), makeActivity({ id: 'a2', title: 'Eat Pad Thai' })] }),
          makeDay({ id: 'day-2', dayNumber: 2, date: '2026-07-02', location: 'Chiang Mai', activities: [makeActivity({ id: 'a3', title: 'Temple Tour' })] }),
        ],
      })
      const ics = generateIcsCalendar(itinerary)
      const eventCount = (ics.match(/BEGIN:VEVENT/g) || []).length
      expect(eventCount).toBe(3)
    })

    it('defaults timeSlot to 09:00 when not specified', () => {
      const itinerary = makeItinerary({
        days: [makeDay({ activities: [makeActivity({ timeSlot: undefined })] })],
      })
      const ics = generateIcsCalendar(itinerary)
      expect(ics).toContain('T090000')
    })

    it('defaults duration to 60 minutes when not specified', () => {
      const itinerary = makeItinerary({
        days: [makeDay({ activities: [makeActivity({ durationMinutes: undefined })] })],
      })
      const ics = generateIcsCalendar(itinerary)
      // 09:00 + 60 min = 10:00
      expect(ics).toContain('DTEND:20260701T100000')
    })

    it('omits cost from description when not present', () => {
      const itinerary = makeItinerary({
        days: [makeDay({ activities: [makeActivity({ estimatedCostThb: undefined })] })],
      })
      const ics = generateIcsCalendar(itinerary)
      expect(ics).not.toContain('฿')
    })
  })

  // --- generateTextItinerary ---

  describe('generateTextItinerary', () => {
    it('includes itinerary name in header', () => {
      const text = generateTextItinerary(makeItinerary())
      expect(text).toContain('Thailand Adventure')
    })

    it('includes date range when available', () => {
      const text = generateTextItinerary(makeItinerary())
      expect(text).toContain('2026-07-01')
      expect(text).toContain('2026-07-05')
    })

    it('includes day headers with number and location', () => {
      const text = generateTextItinerary(makeItinerary())
      expect(text).toContain('DAY 1')
      expect(text).toContain('Bangkok')
    })

    it('includes activities with time and cost', () => {
      const text = generateTextItinerary(makeItinerary())
      expect(text).toContain('09:00')
      expect(text).toContain('Visit Grand Palace')
      expect(text).toContain('[฿500]')
    })

    it('includes total cost at bottom', () => {
      const text = generateTextItinerary(makeItinerary())
      expect(text).toContain('Estimated Total')
      expect(text).toContain('500')
    })

    it('omits total cost when no activities have costs', () => {
      const itinerary = makeItinerary({
        days: [makeDay({ activities: [makeActivity({ estimatedCostThb: undefined })] })],
      })
      const text = generateTextItinerary(itinerary)
      expect(text).not.toContain('Estimated Total')
    })

    it('includes footer branding', () => {
      const text = generateTextItinerary(makeItinerary())
      expect(text).toContain('HappyRoam.travel')
    })

    it('includes activity descriptions', () => {
      const text = generateTextItinerary(makeItinerary())
      expect(text).toContain('Royal palace complex')
    })
  })

  // --- copyItineraryToClipboard ---

  describe('copyItineraryToClipboard', () => {
    it('returns true when clipboard write succeeds', async () => {
      Object.assign(navigator, {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      })
      const result = await copyItineraryToClipboard(makeItinerary())
      expect(result).toBe(true)
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
    })

    it('returns false when clipboard write fails', async () => {
      Object.assign(navigator, {
        clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
      })
      const result = await copyItineraryToClipboard(makeItinerary())
      expect(result).toBe(false)
    })
  })

  // --- downloadIcsCalendar ---

  describe('downloadIcsCalendar', () => {
    it('creates blob and triggers download', () => {
      const mockLink = { href: '', download: '', click: vi.fn() }
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any)
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any)
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any)
      const origCreate = URL.createObjectURL
      const origRevoke = URL.revokeObjectURL
      URL.createObjectURL = vi.fn().mockReturnValue('blob:test')
      URL.revokeObjectURL = vi.fn()

      downloadIcsCalendar(makeItinerary())

      expect(mockLink.click).toHaveBeenCalled()
      expect(mockLink.download).toContain('thailand-adventure')
      expect(mockLink.download).toContain('.ics')
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test')

      URL.createObjectURL = origCreate
      URL.revokeObjectURL = origRevoke
    })
  })

  // --- printItinerary ---

  describe('printItinerary', () => {
    it('calls window.print', () => {
      const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})
      printItinerary()
      expect(printSpy).toHaveBeenCalled()
      printSpy.mockRestore()
    })
  })
})
