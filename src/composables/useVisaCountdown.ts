import { ref, computed } from 'vue'

export interface VisaEntry {
  entryDate: string           // ISO date string (YYYY-MM-DD)
  visaType: VisaType
  customDays?: number         // Only used when visaType is 'custom'
  extensionDate?: string      // Date extension was applied (YYYY-MM-DD)
  ninetyDayReports: string[]  // Dates of 90-day reports (YYYY-MM-DD)
}

export type VisaType =
  | 'visa-exemption'      // 30 days (general scheme since 15 Sep 2026; 60 before)
  | 'tourist-visa'        // typically 60 days (check your visa)
  | 'dtv'                 // 180 days
  | 'education-visa'      // 90 days
  | 'retirement-visa'     // 365 days
  | 'business-visa'       // 90 days
  | 'custom'              // customDays

const STORAGE_KEY = 'happyroam_visa_countdown'

// Thailand replaced the 60-day visa exemption with a 30-day one on this date
const EXEMPTION_RULE_CHANGE_DATE = '2026-09-15'
const LEGACY_EXEMPTION_DAYS = 60

// 90-day report window: from 15 days before the due date to 7 days after it
// (Immigration Bureau, immigration.go.th/?page_id=1666)
export const REPORT_EARLY_WINDOW_DAYS = 15
export const REPORT_LATE_WINDOW_DAYS = 7

const VISA_BASE_DAYS: Record<VisaType, number> = {
  'visa-exemption': 30,
  'tourist-visa': 60,
  'dtv': 180,
  'education-visa': 90,
  'retirement-visa': 365,
  'business-visa': 90,
  'custom': 0, // placeholder; resolved dynamically using customDays
}

const VISA_LABELS: Record<VisaType, string> = {
  'visa-exemption': 'Visa Exemption (30 days)',
  'tourist-visa': 'Tourist Visa (typically 60 days)',
  'dtv': 'Destination Thailand Visa — DTV (180 days)',
  'education-visa': 'Education Visa — ED (90 days)',
  'retirement-visa': 'Retirement Visa — O-A (365 days)',
  'business-visa': 'Non-Immigrant B — Business (90 days)',
  'custom': 'Custom Duration',
}

// Visa types where an in-country extension may be granted (officer's discretion; user records it)
const EXTENDABLE_TYPES: VisaType[] = ['visa-exemption', 'tourist-visa']

function todayISOString(): string {
  return new Date().toISOString().split('T')[0]
}

function daysBetween(fromDate: string, toDate: string): number {
  const from = new Date(fromDate)
  const to = new Date(toDate)
  // Strip time component to get whole-day difference
  from.setHours(0, 0, 0, 0)
  to.setHours(0, 0, 0, 0)
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

export function useVisaCountdown() {
  // Load persisted entry from localStorage
  function loadEntry(): VisaEntry | null {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      return JSON.parse(raw) as VisaEntry
    } catch {
      return null
    }
  }

  const visaEntry = ref<VisaEntry | null>(loadEntry())

  // --- Helpers ---

  function getVisaDays(type: VisaType, customDays?: number, entryDate?: string): number {
    if (type === 'custom') return customDays ?? 30
    // Countdowns saved before the rule change were entered under the old 60-day exemption;
    // travellers already in Thailand keep their original permitted stay.
    if (type === 'visa-exemption' && entryDate && entryDate < EXEMPTION_RULE_CHANGE_DATE) {
      return LEGACY_EXEMPTION_DAYS
    }
    return VISA_BASE_DAYS[type]
  }

  function getVisaLabel(type: VisaType): string {
    return VISA_LABELS[type]
  }

  // --- Computed ---

  // Total days including extension if applied
  const totalDays = computed<number>(() => {
    if (!visaEntry.value) return 0
    const base = getVisaDays(visaEntry.value.visaType, visaEntry.value.customDays, visaEntry.value.entryDate)
    const extensionDays = visaEntry.value.extensionDate ? 30 : 0
    return base + extensionDays
  })

  // Absolute expiry date as ISO string
  const expiryDate = computed<string>(() => {
    if (!visaEntry.value) return ''
    return addDays(visaEntry.value.entryDate, totalDays.value)
  })

  // Days from today to expiry (negative = expired)
  const daysRemaining = computed<number>(() => {
    if (!visaEntry.value) return 0
    return daysBetween(todayISOString(), expiryDate.value)
  })

  // 0–100, capped at 0 when expired
  const percentRemaining = computed<number>(() => {
    if (!visaEntry.value || totalDays.value === 0) return 0
    const pct = (daysRemaining.value / totalDays.value) * 100
    return Math.max(0, Math.min(100, pct))
  })

  const urgency = computed<'safe' | 'warning' | 'danger' | 'expired'>(() => {
    const days = daysRemaining.value
    if (days <= 0) return 'expired'
    if (days < 15) return 'danger'
    if (days <= 30) return 'warning'
    return 'safe'
  })

  // Next 90-day report due date (only meaningful when totalDays > 90).
  // Chain model, per the Immigration Bureau (immigration.go.th/?page_id=1666): the first
  // report is due 90 days after entry and each recorded report sets the next one.
  // - Reported before or on the due date: next = report day + 90 (never later than the real date).
  // - Reported up to 7 days late (still inside the window): next = due date + 90.
  // - Reported later than that (a late, fined report): next = report day + 90.
  // An unreported due date stays the next report, so a missed report shows as overdue
  // instead of being skipped. The date on the user's own receipt is the official one.
  const next90DayReport = computed<string | null>(() => {
    if (!visaEntry.value || totalDays.value <= 90) return null

    const entry = visaEntry.value.entryDate
    // Only reports made during this stay count, oldest first
    const reports = visaEntry.value.ninetyDayReports
      .filter((reportDate) => daysBetween(entry, reportDate) >= 0)
      .sort()

    let dueDate = addDays(entry, 90)
    for (const reportDate of reports) {
      const daysLate = daysBetween(dueDate, reportDate)
      const insideLateWindow = daysLate > 0 && daysLate <= REPORT_LATE_WINDOW_DAYS
      dueDate = addDays(insideLateWindow ? dueDate : reportDate, 90)
    }

    // No report is needed once the permitted stay has ended
    if (daysBetween(dueDate, expiryDate.value) <= 0) return null
    return dueDate
  })

  const daysUntilNext90Day = computed<number | null>(() => {
    if (!next90DayReport.value) return null
    return daysBetween(todayISOString(), next90DayReport.value)
  })

  // The official window for the next report: 15 days before to 7 days after the due date
  const next90DayWindow = computed<{ opens: string; closes: string } | null>(() => {
    if (!next90DayReport.value) return null
    return {
      opens: addDays(next90DayReport.value, -REPORT_EARLY_WINDOW_DAYS),
      closes: addDays(next90DayReport.value, REPORT_LATE_WINDOW_DAYS),
    }
  })

  // Can apply extension: only visa-exemption / tourist-visa and not yet extended
  const canExtend = computed<boolean>(() => {
    if (!visaEntry.value) return false
    return (
      EXTENDABLE_TYPES.includes(visaEntry.value.visaType) &&
      !visaEntry.value.extensionDate
    )
  })

  // --- Methods ---

  function setEntry(entry: VisaEntry): void {
    visaEntry.value = entry
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry))
  }

  function clearEntry(): void {
    visaEntry.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  function addExtension(): void {
    if (!visaEntry.value || !canExtend.value) return
    const updated: VisaEntry = {
      ...visaEntry.value,
      extensionDate: todayISOString(),
    }
    setEntry(updated)
  }

  function add90DayReport(): void {
    if (!visaEntry.value) return
    const updated: VisaEntry = {
      ...visaEntry.value,
      ninetyDayReports: [...visaEntry.value.ninetyDayReports, todayISOString()],
    }
    setEntry(updated)
  }

  return {
    // State
    visaEntry,
    // Computed
    totalDays,
    expiryDate,
    daysRemaining,
    percentRemaining,
    urgency,
    next90DayReport,
    daysUntilNext90Day,
    next90DayWindow,
    canExtend,
    // Methods
    setEntry,
    clearEntry,
    addExtension,
    add90DayReport,
    getVisaDays,
    getVisaLabel,
  }
}
