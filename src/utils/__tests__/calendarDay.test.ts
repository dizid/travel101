import { describe, it, expect } from 'vitest'
import { parseCalendarDay } from '../calendarDay'

describe('parseCalendarDay', () => {
  it('keeps the calendar day of a UTC-midnight timestamp in any timezone', () => {
    const day = parseCalendarDay('2026-12-01T00:00:00.000Z')
    expect([day.getFullYear(), day.getMonth() + 1, day.getDate()]).toEqual([2026, 12, 1])
  })

  it('reads a plain YYYY-MM-DD as a local date', () => {
    const day = parseCalendarDay('2027-01-31')
    expect([day.getFullYear(), day.getMonth() + 1, day.getDate(), day.getHours()]).toEqual([2027, 1, 31, 0])
  })
})
