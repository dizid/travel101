/**
 * Small display helpers for flight offers (onward ticket, T-0597).
 * Duffel sends durations as ISO 8601 ("PT2H12M", "P1DT3H20M") and departure /
 * arrival as local airport times without an offset ("2026-12-07T20:05:00").
 */

const ISO_DURATION = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/

/** "PT2H12M" -> "2h 12m", "P1DT3H20M" -> "27h 20m", "PT45M" -> "45m". Unknown input is returned as-is. */
export function formatIsoDuration(iso: string | null | undefined): string {
  if (!iso) return ''
  const match = ISO_DURATION.exec(iso)
  if (!match || iso === 'P' || iso === 'PT') return iso
  const days = Number(match[1] || 0)
  const hours = Number(match[2] || 0) + days * 24
  const minutes = Number(match[3] || 0)
  if (hours === 0) return `${minutes}m`
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`
}

/**
 * Calendar days between departure and arrival, from their local dates
 * (first 10 characters), so "+1" shows when a flight lands the next day.
 * 0 when either is missing or not a date.
 */
export function arrivalDayOffset(departure: string | null | undefined, arrival: string | null | undefined): number {
  const dep = Date.parse(`${(departure || '').slice(0, 10)}T00:00:00Z`)
  const arr = Date.parse(`${(arrival || '').slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(dep) || Number.isNaN(arr)) return 0
  return Math.round((arr - dep) / 86_400_000)
}
