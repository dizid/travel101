import { ref, computed } from 'vue'

export interface VisaEntry {
  entryDate: string           // ISO date string (YYYY-MM-DD)
  visaType: VisaType
  customDays?: number         // Only used when visaType is 'custom'
  extensionDate?: string      // Date extension was applied (YYYY-MM-DD)
  ninetyDayReports: string[]  // Dates of 90-day reports (YYYY-MM-DD)
}

export type VisaType =
  | 'visa-exemption'      // 60 days (ext +30)
  | 'tourist-visa'        // 60 days (ext +30)
  | 'dtv'                 // 180 days
  | 'education-visa'      // 90 days
  | 'retirement-visa'     // 365 days
  | 'business-visa'       // 90 days
  | 'custom'              // customDays

const STORAGE_KEY = 'happyroam_visa_countdown'

const VISA_BASE_DAYS: Record<VisaType, number> = {
  'visa-exemption': 60,
  'tourist-visa': 60,
  'dtv': 180,
  'education-visa': 90,
  'retirement-visa': 365,
  'business-visa': 90,
  'custom': 0, // placeholder; resolved dynamically using customDays
}

const VISA_LABELS: Record<VisaType, string> = {
  'visa-exemption': 'Visa Exemption (60 days)',
  'tourist-visa': 'Tourist Visa (60 days)',
  'dtv': 'Destination Thailand Visa — DTV (180 days)',
  'education-visa': 'Education Visa — ED (90 days)',
  'retirement-visa': 'Retirement Visa — O-A (365 days)',
  'business-visa': 'Non-Immigrant B — Business (90 days)',
  'custom': 'Custom Duration',
}

// Visa types that support a 30-day in-country extension
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

  function getVisaDays(type: VisaType, customDays?: number): number {
    if (type === 'custom') return customDays ?? 30
    return VISA_BASE_DAYS[type]
  }

  function getVisaLabel(type: VisaType): string {
    return VISA_LABELS[type]
  }

  // --- Computed ---

  // Total days including extension if applied
  const totalDays = computed<number>(() => {
    if (!visaEntry.value) return 0
    const base = getVisaDays(visaEntry.value.visaType, visaEntry.value.customDays)
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

  // Next 90-day report due date (only meaningful when totalDays > 90)
  const next90DayReport = computed<string | null>(() => {
    if (!visaEntry.value || totalDays.value <= 90) return null

    const entry = visaEntry.value.entryDate
    const reports = visaEntry.value.ninetyDayReports

    // Find how many 90-day cycles have passed since entry
    const todayStr = todayISOString()
    let cycle = 1

    while (true) {
      const dueDate = addDays(entry, 90 * cycle)
      // If this due date is still upcoming or today, it's the next report
      if (daysBetween(todayStr, dueDate) >= 0) {
        // Check if this cycle has already been reported
        const alreadyReported = reports.some((r) => {
          const reportCycle = Math.ceil(daysBetween(entry, r) / 90)
          return reportCycle === cycle
        })
        if (!alreadyReported) return dueDate
      }
      // Move to next cycle, but stop if we're past the visa expiry
      const nextDue = addDays(entry, 90 * (cycle + 1))
      if (daysBetween(todayStr, nextDue) < -90) break
      cycle++
      if (cycle > 20) break // safety guard
    }

    return null
  })

  const daysUntilNext90Day = computed<number | null>(() => {
    if (!next90DayReport.value) return null
    return daysBetween(todayISOString(), next90DayReport.value)
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
