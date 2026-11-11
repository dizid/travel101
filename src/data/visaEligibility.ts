/**
 * Thailand Visa Eligibility Data
 * Last verified: 2026-11-11
 *
 * Rules in force from 15 September 2026 (the old 60-day exemption for 93
 * countries was revoked). Sources (official Thai government / TAT):
 *  - TAT News: https://www.tatnews.org/2026/09/thailand-introduces-new-30-day-and-15-day-visa-exemption-rules-from-15-september/
 *  - Royal Thai Embassy London: https://london.thaiembassy.org/en/content/revision-of-thailand-s-visa-0926
 *  - Royal Thai Embassy Helsinki (30/15-day lists, bilateral 90/30/14-day lists, VoA):
 *    https://helsinki.thaiembassy.org/en/publicservice/new-visa-exemption-and-visa-on-arrival-voa-to-thailand
 *  - Royal Thai Embassy Doha (bilateral lists, VoA 15 days / 2,000 THB, extensions, land entries):
 *    https://doha.thaiembassy.org/en/publicservice/tourist-visa-exemption-visa-on-arrival
 *
 * Only nationalities confirmed on those pages are listed. A country that is
 * NOT in this table returns null from getVisaEligibility(), and the wizard
 * then tells the user to check with the Thai embassy. Do not guess entries.
 */

export type VisaEligibility = {
  exemption: boolean      // Visa exemption for tourism (30, 15 days or a bilateral period)
  exemptionDays: number   // Days allowed under the exemption
  landExemption: boolean  // Exemption also applies at land border checkpoints
  landDays: number        // Days for land entry (same as exemptionDays)
  voa: boolean            // Visa on Arrival eligible
  voaDays: number         // VOA duration
  workingHoliday: boolean // Working Holiday Visa eligible
  notes?: string          // Special notes
}

/** Build an exemption entry (air + land, tourism). */
function exemptEntry(days: number, workingHoliday = false, notes?: string): VisaEligibility {
  return { exemption: true, exemptionDays: days, landExemption: true, landDays: days, voa: false, voaDays: 0, workingHoliday, notes }
}

const BILATERAL_NOTE = (days: number): string =>
  `${days}-day visa exemption under a bilateral agreement between Thailand and your country (not the general 30-day scheme).`

// 30-day tourism exemption: the 60 countries/territories listed by TAT (effective 15 Sep 2026)
const THIRTY_DAY_CODES = [
  'AU', 'AT', 'BH', 'BE', 'BT', 'BN', 'BG', 'CA', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FJ', 'FI', 'FR', 'GE', 'DE',
  'GR', 'HU', 'IS', 'IN', 'ID', 'IE', 'IL', 'IT', 'JP', 'JO', 'KW', 'KG', 'LV', 'LI', 'LT', 'LU', 'MY', 'MV',
  'MT', 'NL', 'NZ', 'NO', 'OM', 'PH', 'PL', 'PT', 'QA', 'RO', 'SA', 'SG', 'SK', 'SI', 'ZA', 'ES', 'SE', 'CH',
  'TW', 'TR', 'UA', 'AE', 'GB', 'US',
]

// Working Holiday eligibility is unchanged by the Sept 2026 revision (kept from earlier data)
const WORKING_HOLIDAY_CODES = new Set(['AU', 'NZ', 'CA', 'FR', 'KR', 'HK', 'IL'])

// Visa exemption countries: 30-day general scheme, 15-day scheme, and bilateral agreements
export const VISA_EXEMPT_COUNTRIES: Record<string, VisaEligibility> = {
  // General 30-day tourism exemption (60 countries). Land entries: generally max 2 per calendar year.
  ...Object.fromEntries(THIRTY_DAY_CODES.map((code) => [code, exemptEntry(30, WORKING_HOLIDAY_CODES.has(code))])),

  // General 15-day tourism exemption
  'SC': exemptEntry(15),
  'MU': exemptEntry(15),

  // Bilateral agreements - 90 days
  'AR': exemptEntry(90, false, BILATERAL_NOTE(90)),
  'BR': exemptEntry(90, false, BILATERAL_NOTE(90)),
  'CL': exemptEntry(90, false, BILATERAL_NOTE(90)),
  'KR': exemptEntry(90, true, BILATERAL_NOTE(90)),
  'PE': exemptEntry(90, false, BILATERAL_NOTE(90)),

  // Bilateral agreements - 30 days
  'CN': exemptEntry(30, false, BILATERAL_NOTE(30)),
  'HK': exemptEntry(30, true, BILATERAL_NOTE(30)),
  'KZ': exemptEntry(30, false, BILATERAL_NOTE(30)),
  'LA': exemptEntry(30, false, BILATERAL_NOTE(30)),
  'MO': exemptEntry(30, false, BILATERAL_NOTE(30)),
  'MN': exemptEntry(30, false, BILATERAL_NOTE(30)),
  'RU': exemptEntry(30, false, BILATERAL_NOTE(30)),
  'TL': exemptEntry(30, false, BILATERAL_NOTE(30)),
  'VN': exemptEntry(30, false, BILATERAL_NOTE(30)),

  // Bilateral agreements - 14 days
  'KH': exemptEntry(14, false, BILATERAL_NOTE(14)),
  'MM': exemptEntry(14, false, BILATERAL_NOTE(14) + ' Myanmar nationals: international airports only.'),
}

// Countries that can get a Visa on Arrival (VOA) - 15 days, 2,000 THB, from 15 Sep 2026
const VOA_NOTE = 'Visa on Arrival - 15 days, 2,000 THB fee (cash, Thai baht). Generally not extendable.'
export const VOA_COUNTRIES: Record<string, VisaEligibility> = {
  'AZ': { exemption: false, exemptionDays: 0, landExemption: false, landDays: 0, voa: true, voaDays: 15, workingHoliday: false, notes: VOA_NOTE },
  'BY': { exemption: false, exemptionDays: 0, landExemption: false, landDays: 0, voa: true, voaDays: 15, workingHoliday: false, notes: VOA_NOTE },
  'RS': { exemption: false, exemptionDays: 0, landExemption: false, landDays: 0, voa: true, voaDays: 15, workingHoliday: false, notes: VOA_NOTE },
}

// Combine all eligibility data
export const ALL_VISA_ELIGIBILITY: Record<string, VisaEligibility> = {
  ...VISA_EXEMPT_COUNTRIES,
  ...VOA_COUNTRIES,
}

/**
 * Get visa eligibility for a country by ISO code
 */
export function getVisaEligibility(countryCode: string): VisaEligibility | null {
  return ALL_VISA_ELIGIBILITY[countryCode.toUpperCase()] || null
}

/**
 * Check if a country qualifies for visa exemption
 */
export function isVisaExempt(countryCode: string): boolean {
  const eligibility = getVisaEligibility(countryCode)
  return eligibility?.exemption ?? false
}

/**
 * Check if a country qualifies for VOA
 */
export function isVoaEligible(countryCode: string): boolean {
  const eligibility = getVisaEligibility(countryCode)
  return eligibility?.voa ?? false
}

/**
 * Check if a country qualifies for Working Holiday Visa
 */
export function isWorkingHolidayEligible(countryCode: string): boolean {
  const eligibility = getVisaEligibility(countryCode)
  return eligibility?.workingHoliday ?? false
}

/**
 * Get the best visa option for a nationality and duration
 */
export function getBestVisaOption(
  countryCode: string,
  durationDays: number,
  isLandEntry: boolean = false
): {
  visaType: 'exemption' | 'voa' | 'tourist' | 'dtv' | 'none'
  maxDays: number
  extensible: boolean
  notes: string
} {
  const eligibility = getVisaEligibility(countryCode)

  if (!eligibility) {
    return {
      visaType: 'none',
      maxDays: 0,
      extensible: false,
      notes: 'Unable to determine visa eligibility. Please check with Thai embassy in your country.',
    }
  }

  // Check visa exemption first
  if (eligibility.exemption) {
    const maxDays = isLandEntry ? eligibility.landDays : eligibility.exemptionDays

    if (durationDays <= maxDays) {
      return {
        visaType: 'exemption',
        maxDays,
        extensible: false, // Not guaranteed: extensions are at the immigration officer's discretion
        notes: isLandEntry
          ? `Land entry: ${maxDays} days. Visa-exempt land entries are generally limited to 2 per calendar year (not for Malaysia, Brunei, Indonesia, Singapore).`
          : `Air entry: ${maxDays} days, tourism only. Extensions may be possible at an immigration office (officer's discretion); check the current rules.`,
      }
    }
  }

  // Check VOA
  if (eligibility.voa && durationDays <= eligibility.voaDays) {
    return {
      visaType: 'voa',
      maxDays: eligibility.voaDays,
      extensible: false,
      notes: `Visa on Arrival: ${eligibility.voaDays} days, 2,000 THB fee. Generally not extendable.`,
    }
  }

  // Longer than the exemption / VOA allows: a visa from a Thai embassy is needed
  if (durationDays <= 90) {
    return {
      visaType: 'tourist',
      maxDays: 60,
      extensible: false,
      notes: 'Your stay is longer than your exemption allows. Apply for a Tourist Visa at a Thai embassy before travel and check the permitted stay and fee for your nationality.',
    }
  }

  // Need DTV or other long-term visa
  return {
    visaType: 'dtv',
    maxDays: 180,
    extensible: true,
    notes: 'For stays over 90 days, consider DTV (180 days) or other long-term visa options.',
  }
}

// Working Holiday Visa eligible countries (bilateral agreements)
export const WORKING_HOLIDAY_COUNTRIES = ['AU', 'NZ', 'CA', 'FR', 'KR', 'HK', 'IL']

// Official Thai Immigration resources
export const OFFICIAL_RESOURCES = {
  immigration: 'https://www.immigration.go.th',
  evisa: 'https://www.thaievisa.go.th',
  tm47: 'https://tm47.immigration.go.th',
  mfa: 'https://www.mfa.go.th/en/page/visa-information',
}
