import { describe, it, expect } from 'vitest'
import { buildNinetyDayIcs } from '../ninetyDayCalendar'

describe('buildNinetyDayIcs', () => {
  const window = { opens: '2026-08-15', due: '2026-08-30', closes: '2026-09-06' }
  const ics = buildNinetyDayIcs(window, new Date('2026-06-15T12:00:00Z'))
  const lines = ics.split('\r\n')

  it('is a calendar with two all-day events joined by CRLF', () => {
    expect(lines[0]).toBe('BEGIN:VCALENDAR')
    expect(lines[lines.length - 1]).toBe('END:VCALENDAR')
    expect(lines.filter((line) => line === 'BEGIN:VEVENT')).toHaveLength(2)
  })

  it('puts the window-opening day and the due day on the calendar', () => {
    expect(lines).toContain('DTSTART;VALUE=DATE:20260815')
    expect(lines).toContain('DTEND;VALUE=DATE:20260816')
    expect(lines).toContain('DTSTART;VALUE=DATE:20260830')
    expect(lines).toContain('DTEND;VALUE=DATE:20260831')
  })

  it('rolls the end date over a month boundary', () => {
    const endOfMonth = buildNinetyDayIcs({ opens: '2026-01-16', due: '2026-01-31', closes: '2026-02-07' })
    expect(endOfMonth).toContain('DTEND;VALUE=DATE:20260201')
  })

  it('names the official window, the online site and the rules page', () => {
    expect(ics).toContain('Report window: 2026-08-15 to 2026-09-06')
    expect(ics).toContain('https://tm47.immigration.go.th')
    expect(ics).toContain('https://www.immigration.go.th/?page_id=1666')
  })

  it('has a UTC timestamp and stable UIDs', () => {
    expect(lines).toContain('DTSTAMP:20260615T120000Z')
    expect(lines).toContain('UID:90day-due-2026-08-30@happyroam.travel')
  })
})
