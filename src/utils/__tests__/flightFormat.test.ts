import { describe, it, expect } from 'vitest'
import { formatIsoDuration, arrivalDayOffset } from '../flightFormat'

describe('formatIsoDuration', () => {
  it('turns Duffel ISO durations into hours and minutes (the live page showed "PT2H12M")', () => {
    expect(formatIsoDuration('PT2H12M')).toBe('2h 12m')
    expect(formatIsoDuration('PT15H30M')).toBe('15h 30m')
    expect(formatIsoDuration('PT3H')).toBe('3h')
    expect(formatIsoDuration('PT45M')).toBe('45m')
    expect(formatIsoDuration('P1DT3H20M')).toBe('27h 20m')
  })

  it('leaves unknown input alone and handles empty values', () => {
    expect(formatIsoDuration('2h 5m')).toBe('2h 5m')
    expect(formatIsoDuration('P')).toBe('P')
    expect(formatIsoDuration(null)).toBe('')
    expect(formatIsoDuration(undefined)).toBe('')
  })
})

describe('arrivalDayOffset', () => {
  it('counts calendar days between the local departure and arrival dates', () => {
    expect(arrivalDayOffset('2026-12-07T04:38:00', '2026-12-07T07:50:00')).toBe(0)
    expect(arrivalDayOffset('2026-12-07T20:05:00', '2026-12-08T12:35:00')).toBe(1)
    expect(arrivalDayOffset('2026-12-31T23:00:00', '2027-01-02T01:00:00')).toBe(2)
  })

  it('is 0 when a time is missing or not a date', () => {
    expect(arrivalDayOffset('', '2026-12-08T12:35:00')).toBe(0)
    expect(arrivalDayOffset('2026-12-07T20:05:00', null)).toBe(0)
    expect(arrivalDayOffset('soon', 'later')).toBe(0)
  })
})
