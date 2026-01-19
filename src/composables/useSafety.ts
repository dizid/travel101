import { ref, computed } from 'vue'
import { useApi } from './useApi'

export interface ScamReport {
  id: string
  scam_type: string
  title: string
  description: string
  location_name: string
  province: string
  lat?: number
  lng?: number
  severity: number
  verified: boolean
  report_count: number
  last_reported_at: string
  created_at: string
}

export interface ProvinceSafety {
  province: string
  overall_score: number
  tourist_police_phone: string
  local_emergency?: string
  hospital_name?: string
  hospital_address?: string
  notes: string
}

export interface ScamType {
  value: string
  label: string
  icon: string
}

export interface SafetyStats {
  total_reports: number
  verified_reports: number
  provinces_covered: number
}

export interface EmergencyNumbers {
  touristPolice: string
  police: string
  ambulance: string
  fire: string
}

export interface SafetyData {
  scamReports: ScamReport[]
  provinceSafety: ProvinceSafety[]
  scamTypes: ScamType[]
  stats: SafetyStats
  emergencyNumbers: EmergencyNumbers
}

export interface NewScamReport {
  scam_type: string
  title: string
  description: string
  location_name?: string
  province: string
  lat?: number
  lng?: number
  severity?: number
}

export function useSafety() {
  const { get, post, loading, error } = useApi()
  const safetyData = ref<SafetyData | null>(null)

  async function fetchSafetyData(province?: string, scamType?: string) {
    const params = new URLSearchParams()
    if (province) params.append('province', province)
    if (scamType) params.append('type', scamType)

    const queryString = params.toString()
    const url = `/safety${queryString ? `?${queryString}` : ''}`

    const data = await get<SafetyData>(url, { requiresAuth: false })
    if (data) {
      safetyData.value = data
    }
    return data
  }

  async function submitReport(report: NewScamReport) {
    const result = await post<{ message: string; report: ScamReport; merged: boolean }>(
      '/safety',
      report,
      { requiresAuth: false }
    )
    if (result && safetyData.value) {
      // Add to local state or refresh
      await fetchSafetyData()
    }
    return result
  }

  const scamReports = computed(() => safetyData.value?.scamReports ?? [])
  const provinceSafety = computed(() => safetyData.value?.provinceSafety ?? [])
  const scamTypes = computed(() => safetyData.value?.scamTypes ?? [])
  const stats = computed(() => safetyData.value?.stats)
  const emergencyNumbers = computed(() => safetyData.value?.emergencyNumbers)

  const highSeverityReports = computed(() =>
    scamReports.value.filter(r => r.severity === 3)
  )

  const verifiedReports = computed(() =>
    scamReports.value.filter(r => r.verified)
  )

  const reportsByProvince = computed(() => {
    const grouped: Record<string, ScamReport[]> = {}
    for (const report of scamReports.value) {
      if (!grouped[report.province]) {
        grouped[report.province] = []
      }
      grouped[report.province].push(report)
    }
    return grouped
  })

  const reportsByType = computed(() => {
    const grouped: Record<string, ScamReport[]> = {}
    for (const report of scamReports.value) {
      if (!grouped[report.scam_type]) {
        grouped[report.scam_type] = []
      }
      grouped[report.scam_type].push(report)
    }
    return grouped
  })

  function getSafetyScore(province: string): number {
    const safety = provinceSafety.value.find(p => p.province === province)
    return safety?.overall_score ?? 4
  }

  function getSafetyLabel(score: number): { label: string; color: string } {
    if (score >= 5) return { label: 'Very Safe', color: 'text-green-600' }
    if (score >= 4) return { label: 'Safe', color: 'text-green-500' }
    if (score >= 3) return { label: 'Use Caution', color: 'text-yellow-600' }
    if (score >= 2) return { label: 'Exercise Caution', color: 'text-orange-500' }
    return { label: 'High Caution', color: 'text-red-600' }
  }

  function getSeverityInfo(severity: number): { label: string; color: string; bgColor: string } {
    if (severity >= 3) return { label: 'High Risk', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' }
    if (severity >= 2) return { label: 'Medium Risk', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' }
    return { label: 'Low Risk', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' }
  }

  function getScamTypeInfo(type: string): ScamType | undefined {
    return scamTypes.value.find(t => t.value === type)
  }

  return {
    loading,
    error,
    safetyData,
    fetchSafetyData,
    submitReport,
    scamReports,
    provinceSafety,
    scamTypes,
    stats,
    emergencyNumbers,
    highSeverityReports,
    verifiedReports,
    reportsByProvince,
    reportsByType,
    getSafetyScore,
    getSafetyLabel,
    getSeverityInfo,
    getScamTypeInfo,
  }
}
