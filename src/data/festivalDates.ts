/**
 * Festival dates beyond the database's date_2025 / date_2026 columns, plus the shared
 * "when is it next?" logic used by the festivals API, the SSG prefetch and the browser.
 *
 * Why this file exists (T-0636, Nov 2026): the thai_festivals table only has columns for
 * 2025 and 2026, and every date check was written as `year === 2025 ? date2025 : date2026`.
 * From 1 Jan 2027 that would have emptied every "upcoming festivals" list. Adding a
 * date_2027 column is a live schema change, so known dates for later years live here.
 * A date here wins over the database for the same year (used for one 2026 correction).
 *
 * Only dates from an official source go in here. Lunar and organiser-set festivals whose
 * 2027 date isn't announced yet get no 2027 entry; the page then says it isn't announced.
 * No imports on purpose: this file is shared by Netlify functions, the build script and Vue.
 */

/** Extra or corrected start dates per festival slug and year (YYYY-MM-DD, Thailand date). */
export const FESTIVAL_DATE_OVERRIDES: Record<string, Partial<Record<number, string>>> = {
  // 2026 correction: the database says 25 Nov. Loy Krathong is the full moon of the 12th
  // lunar month: Tuesday 24 Nov 2026 (TAT News 5 Nov 2026 "the full moon falls on
  // 24 November"; PPTV and Thansettakij: วันอังคารที่ 24 พฤศจิกายน 2569, ขึ้น 15 ค่ำ เดือน 12).
  'loy-krathong': { 2026: '2026-11-24' },

  // 2027 Buddhist holidays: Bank of Thailand Announcement No. 37/2569 (Royal Gazette,
  // 25 Aug 2026), also Time Out Bangkok's 2027 holiday list. Khao Phansa (start of
  // Buddhist Lent) is the day after Asanha Bucha.
  'makha-bucha': { 2027: '2027-02-21' },
  'visakha-bucha': { 2027: '2027-05-20' },
  'asanha-bucha': { 2027: '2027-07-18' },
  'khao-phansa': { 2027: '2027-07-19' },

  // 2027 fixed-date days (same date every year; same source for the public holidays)
  'chakri-day': { 2027: '2027-04-06' },
  songkran: { 2027: '2027-04-13' },
  'coronation-day': { 2027: '2027-05-04' },
  'kings-birthday': { 2027: '2027-07-28' },
  'mothers-day': { 2027: '2027-08-12' },
  'fathers-day': { 2027: '2027-12-05' },
  'constitution-day': { 2027: '2027-12-10' },
  // National Thai Elephant Day is 13 March every year
  'elephant-day': { 2027: '2027-03-13' },

  // Chinese New Year 2027 (Year of the Goat) starts Saturday 6 Feb 2027
  'chinese-new-year': { 2027: '2027-02-06' },
}

/** The date fields a festival needs for date logic (API rows and frontend objects both fit). */
export interface FestivalDateSource {
  slug: string
  date2025?: string | Date | null
  date2026?: string | Date | null
  durationDays?: number | null
}

export interface FestivalOccurrence {
  /** Start date as an ISO string at UTC midnight, e.g. "2027-02-06T00:00:00.000Z" (same format the API always used) */
  nextDate: string
  /** Whole days until the start in Thailand; 0 while it's on */
  daysUntil: number
  isOngoing: boolean
}

const DAY_MS = 86_400_000

/**
 * A database DATE (a JS Date from the Neon driver, or a "YYYY-MM-DD..." string) as "YYYY-MM-DD".
 * The driver builds a DATE as local midnight, so a Date is read with local getters: that gives
 * the stored day on any server time zone (reading it as UTC would shift it a day east of UTC).
 */
export function toYmd(value: string | Date | null | undefined): string | null {
  if (!value) return null
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null
    const m = String(value.getMonth() + 1).padStart(2, '0')
    const d = String(value.getDate()).padStart(2, '0')
    return `${value.getFullYear()}-${m}-${d}`
  }
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value)
  return match ? match[1] : null
}

/** "YYYY-MM-DD" as the ISO string the API returns for festival dates (UTC midnight). */
export function ymdToIso(ymd: string): string {
  return `${ymd}T00:00:00.000Z`
}

/** "YYYY-MM-DD" plus a number of days, as "YYYY-MM-DD". */
export function addDaysYmd(ymd: string, days: number): string {
  return new Date(Date.parse(ymdToIso(ymd)) + days * DAY_MS).toISOString().slice(0, 10)
}

/** Today's date in Thailand (all festivals are there) as "YYYY-MM-DD". */
export function thailandToday(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/**
 * A festival's start date for one year in the API's ISO format: this file's date if it has
 * one, else the database value (pass the row's date_YYYY column), else null.
 */
export function festivalDateForYear(
  slug: string,
  year: number,
  dbValue?: string | Date | null,
): string | null {
  const ymd = FESTIVAL_DATE_OVERRIDES[slug]?.[year] ?? toYmd(dbValue)
  return ymd ? ymdToIso(ymd) : null
}

/** Every known start date of a festival, oldest first (database dates, then this file's). */
export function festivalDatesByYear(f: FestivalDateSource): { year: number; ymd: string }[] {
  // Plain object, not a Map: the build script's tsconfig targets old JS without Map iteration
  const byYear: Record<number, string> = {}
  for (const value of [f.date2025, f.date2026]) {
    const ymd = toYmd(value)
    if (ymd) byYear[Number(ymd.slice(0, 4))] = ymd
  }
  const overrides = FESTIVAL_DATE_OVERRIDES[f.slug] ?? {}
  for (const year of Object.keys(overrides)) {
    const ymd = overrides[Number(year)]
    if (ymd) byYear[Number(year)] = ymd
  }
  return Object.keys(byYear)
    .map(Number)
    .sort((a, b) => a - b)
    .map((year) => ({ year, ymd: byYear[year] }))
}

/**
 * The next time a festival starts or is still on, counted from `todayYmd` (Thailand date).
 * Returns null when every known date has passed (e.g. a lunar festival whose next date
 * isn't announced yet).
 */
export function nextFestivalOccurrence(
  f: FestivalDateSource,
  todayYmd: string = thailandToday(),
): FestivalOccurrence | null {
  const today = Date.parse(ymdToIso(todayYmd))
  const lengthDays = Math.max(1, f.durationDays || 1)
  for (const { ymd } of festivalDatesByYear(f)) {
    const start = Date.parse(ymdToIso(ymd))
    const end = start + (lengthDays - 1) * DAY_MS
    if (end < today) continue
    const daysUntil = Math.round((start - today) / DAY_MS)
    return { nextDate: ymdToIso(ymd), daysUntil: Math.max(0, daysUntil), isOngoing: daysUntil <= 0 }
  }
  return null
}
