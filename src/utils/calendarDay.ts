/**
 * A trip date is a calendar day (Postgres DATE). The API sends it as '2026-12-01' or as
 * UTC midnight ('2026-12-01T00:00:00.000Z'); `new Date(value)` would then show the day
 * before for anyone west of UTC. This reads the YYYY-MM-DD part as a local date instead.
 */
export function parseCalendarDay(value: string | Date): Date {
  const text = value instanceof Date ? value.toISOString() : String(value)
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text)
  if (!match) return new Date(value)
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}
