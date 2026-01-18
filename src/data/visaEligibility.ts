/**
 * Thailand Visa Eligibility Data
 * Last verified: January 2026
 * Source: Thai Immigration Bureau (immigration.go.th)
 */

export type VisaEligibility = {
  exemption: boolean      // 60-day visa exemption (air entry)
  exemptionDays: number   // Days allowed under exemption
  landExemption: boolean  // Land border visa exemption
  landDays: number        // Days for land entry (if different)
  voa: boolean            // Visa on Arrival eligible
  voaDays: number         // VOA duration
  workingHoliday: boolean // Working Holiday Visa eligible
  notes?: string          // Special notes
}

// Countries eligible for 60-day visa exemption (by air)
// These countries get visa-free entry for tourism
export const VISA_EXEMPT_COUNTRIES: Record<string, VisaEligibility> = {
  // Europe - Schengen & EU
  'AT': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'BE': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'CH': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'CZ': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'DE': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'DK': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'EE': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'ES': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'FI': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'FR': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: true },
  'GR': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'HU': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'IE': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'IS': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'IT': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'LI': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'LT': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'LU': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'LV': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'MC': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'MT': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'NL': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'NO': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'PL': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'PT': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'SE': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'SI': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'SK': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },

  // UK & Commonwealth
  'GB': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'AU': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: true },
  'NZ': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: true },
  'CA': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: true },

  // Americas
  'US': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'AR': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'BR': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'CL': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'MX': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'PE': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },

  // Asia-Pacific (Visa Exempt)
  'JP': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'KR': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: true },
  'SG': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'HK': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: true },
  'MY': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'BN': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'ID': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'PH': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'VN': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },

  // Middle East
  'AE': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'BH': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'IL': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: true },
  'KW': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'OM': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'QA': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'SA': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'TR': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },

  // Africa
  'ZA': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },

  // Other European
  'HR': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'CY': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'BG': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
  'RO': { exemption: true, exemptionDays: 60, landExemption: true, landDays: 30, voa: false, voaDays: 0, workingHoliday: false },
}

// Countries that require Visa on Arrival (VOA) - 15 days
export const VOA_COUNTRIES: Record<string, VisaEligibility> = {
  'CN': { exemption: false, exemptionDays: 0, landExemption: false, landDays: 0, voa: true, voaDays: 15, workingHoliday: false, notes: 'Visa on Arrival only - 15 days, ฿2000 fee' },
  'IN': { exemption: false, exemptionDays: 0, landExemption: false, landDays: 0, voa: true, voaDays: 15, workingHoliday: false, notes: 'Visa on Arrival only - 15 days, ฿2000 fee' },
  'TW': { exemption: false, exemptionDays: 0, landExemption: false, landDays: 0, voa: true, voaDays: 15, workingHoliday: false, notes: 'Visa on Arrival only - 15 days, ฿2000 fee' },
  'RU': { exemption: false, exemptionDays: 0, landExemption: false, landDays: 0, voa: true, voaDays: 15, workingHoliday: false, notes: 'Visa on Arrival only - 15 days, ฿2000 fee' },
  'UA': { exemption: false, exemptionDays: 0, landExemption: false, landDays: 0, voa: true, voaDays: 15, workingHoliday: false, notes: 'Visa on Arrival only - 15 days, ฿2000 fee' },
  'KZ': { exemption: false, exemptionDays: 0, landExemption: false, landDays: 0, voa: true, voaDays: 15, workingHoliday: false, notes: 'Visa on Arrival only - 15 days, ฿2000 fee' },
  'UZ': { exemption: false, exemptionDays: 0, landExemption: false, landDays: 0, voa: true, voaDays: 15, workingHoliday: false, notes: 'Visa on Arrival only - 15 days, ฿2000 fee' },
}

// Countries that must apply for visa in advance
export const VISA_REQUIRED_COUNTRIES: Record<string, VisaEligibility> = {
  'PK': { exemption: false, exemptionDays: 0, landExemption: false, landDays: 0, voa: false, voaDays: 0, workingHoliday: false, notes: 'Must apply for visa at Thai embassy before travel' },
  'BD': { exemption: false, exemptionDays: 0, landExemption: false, landDays: 0, voa: false, voaDays: 0, workingHoliday: false, notes: 'Must apply for visa at Thai embassy before travel' },
  'LK': { exemption: false, exemptionDays: 0, landExemption: false, landDays: 0, voa: false, voaDays: 0, workingHoliday: false, notes: 'Must apply for visa at Thai embassy before travel' },
  'NP': { exemption: false, exemptionDays: 0, landExemption: false, landDays: 0, voa: false, voaDays: 0, workingHoliday: false, notes: 'Must apply for visa at Thai embassy before travel' },
  'MM': { exemption: false, exemptionDays: 0, landExemption: false, landDays: 0, voa: false, voaDays: 0, workingHoliday: false, notes: 'Must apply for visa at Thai embassy before travel' },
  'IR': { exemption: false, exemptionDays: 0, landExemption: false, landDays: 0, voa: false, voaDays: 0, workingHoliday: false, notes: 'Must apply for visa at Thai embassy before travel' },
  'AF': { exemption: false, exemptionDays: 0, landExemption: false, landDays: 0, voa: false, voaDays: 0, workingHoliday: false, notes: 'Must apply for visa at Thai embassy before travel' },
  'SY': { exemption: false, exemptionDays: 0, landExemption: false, landDays: 0, voa: false, voaDays: 0, workingHoliday: false, notes: 'Must apply for visa at Thai embassy before travel' },
  'YE': { exemption: false, exemptionDays: 0, landExemption: false, landDays: 0, voa: false, voaDays: 0, workingHoliday: false, notes: 'Must apply for visa at Thai embassy before travel' },
}

// Combine all eligibility data
export const ALL_VISA_ELIGIBILITY: Record<string, VisaEligibility> = {
  ...VISA_EXEMPT_COUNTRIES,
  ...VOA_COUNTRIES,
  ...VISA_REQUIRED_COUNTRIES,
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
    const extensible = !isLandEntry // Land entries NOT extensible

    if (durationDays <= maxDays) {
      return {
        visaType: 'exemption',
        maxDays,
        extensible,
        notes: isLandEntry
          ? `Land entry: ${maxDays} days, NOT extensible. Max 2 land entries per calendar year.`
          : `Air entry: ${maxDays} days, extensible +30 days at immigration (฿1,900).`,
      }
    }

    // Can extend air entry by 30 days
    if (!isLandEntry && durationDays <= maxDays + 30) {
      return {
        visaType: 'exemption',
        maxDays: maxDays + 30,
        extensible: true,
        notes: `60-day exemption + 30-day extension = 90 days max. Apply at immigration office.`,
      }
    }
  }

  // Check VOA
  if (eligibility.voa && durationDays <= eligibility.voaDays) {
    return {
      visaType: 'voa',
      maxDays: eligibility.voaDays,
      extensible: false,
      notes: `Visa on Arrival: ${eligibility.voaDays} days, ฿2,000 fee. NOT extensible.`,
    }
  }

  // Need Tourist Visa or DTV
  if (durationDays <= 90) {
    return {
      visaType: 'tourist',
      maxDays: 90,
      extensible: true,
      notes: 'Tourist Visa: 60 days + 30-day extension. Apply at Thai embassy before travel.',
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
