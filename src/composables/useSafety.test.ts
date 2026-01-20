import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSafety, type ScamReport, type SafetyData } from './useSafety'
import { mockFetch, createMockResponse } from '@/test/setup'

describe('useSafety', () => {
  const mockScamReport: ScamReport = {
    id: 'scam-1',
    scam_type: 'taxi_scam',
    title: 'Taxi meter refusal',
    description: 'Taxi driver refused to use meter',
    location_name: 'Khao San Road',
    province: 'Bangkok',
    lat: 13.7563,
    lng: 100.5018,
    severity: 2,
    verified: true,
    report_count: 15,
    last_reported_at: '2024-06-01T10:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
  }

  const mockSafetyData: SafetyData = {
    scamReports: [
      mockScamReport,
      { ...mockScamReport, id: 'scam-2', severity: 3, province: 'Phuket', verified: false },
      { ...mockScamReport, id: 'scam-3', severity: 1, scam_type: 'overcharge' },
    ],
    provinceSafety: [
      { province: 'Bangkok', overall_score: 4, tourist_police_phone: '1155', notes: 'Generally safe' },
      { province: 'Phuket', overall_score: 3, tourist_police_phone: '1155', notes: 'Use caution' },
    ],
    scamTypes: [
      { value: 'taxi_scam', label: 'Taxi Scam', icon: '🚕' },
      { value: 'overcharge', label: 'Overcharging', icon: '💰' },
    ],
    stats: {
      total_reports: 150,
      verified_reports: 75,
      provinces_covered: 20,
    },
    emergencyNumbers: {
      touristPolice: '1155',
      police: '191',
      ambulance: '1669',
      fire: '199',
    },
  }

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchSafetyData', () => {
    it('should fetch safety data without filters', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSafetyData))

      const { fetchSafetyData, safetyData } = useSafety()
      await fetchSafetyData()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/safety'),
        expect.any(Object)
      )
      expect(safetyData.value).toEqual(mockSafetyData)
    })

    it('should fetch data with province filter', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSafetyData))

      const { fetchSafetyData } = useSafety()
      await fetchSafetyData('Bangkok')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/safety?province=Bangkok'),
        expect.any(Object)
      )
    })

    it('should fetch data with scam type filter', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSafetyData))

      const { fetchSafetyData } = useSafety()
      await fetchSafetyData(undefined, 'taxi_scam')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/safety?type=taxi_scam'),
        expect.any(Object)
      )
    })

    it('should fetch data with both filters', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSafetyData))

      const { fetchSafetyData } = useSafety()
      await fetchSafetyData('Phuket', 'overcharge')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/safety\?.*province=Phuket.*type=overcharge|\/safety\?.*type=overcharge.*province=Phuket/),
        expect.any(Object)
      )
    })
  })

  describe('submitReport', () => {
    it('should submit new report and refresh data', async () => {
      mockFetch
        .mockResolvedValueOnce(createMockResponse(mockSafetyData)) // Initial fetch
        .mockResolvedValueOnce(
          createMockResponse({
            message: 'Report submitted',
            report: mockScamReport,
            merged: false,
          })
        )
        .mockResolvedValueOnce(createMockResponse(mockSafetyData)) // Refresh

      const { fetchSafetyData, submitReport } = useSafety()
      await fetchSafetyData()

      const result = await submitReport({
        scam_type: 'taxi_scam',
        title: 'Meter refusal',
        description: 'Test description',
        province: 'Bangkok',
      })

      expect(result).toEqual({
        message: 'Report submitted',
        report: mockScamReport,
        merged: false,
      })
    })

    it('should return merged flag when report was merged', async () => {
      mockFetch
        .mockResolvedValueOnce(createMockResponse(mockSafetyData))
        .mockResolvedValueOnce(
          createMockResponse({
            message: 'Report merged with existing',
            report: { ...mockScamReport, report_count: 16 },
            merged: true,
          })
        )
        .mockResolvedValueOnce(createMockResponse(mockSafetyData))

      const { fetchSafetyData, submitReport } = useSafety()
      await fetchSafetyData()

      const result = await submitReport({
        scam_type: 'taxi_scam',
        title: 'Meter refusal',
        description: 'Test',
        province: 'Bangkok',
      })

      expect(result?.merged).toBe(true)
    })
  })

  describe('computed properties', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSafetyData))
    })

    it('should return scamReports from data', async () => {
      const { fetchSafetyData, scamReports } = useSafety()
      await fetchSafetyData()

      expect(scamReports.value).toHaveLength(3)
    })

    it('should return provinceSafety from data', async () => {
      const { fetchSafetyData, provinceSafety } = useSafety()
      await fetchSafetyData()

      expect(provinceSafety.value).toHaveLength(2)
    })

    it('should return scamTypes from data', async () => {
      const { fetchSafetyData, scamTypes } = useSafety()
      await fetchSafetyData()

      expect(scamTypes.value).toHaveLength(2)
    })

    it('should return stats from data', async () => {
      const { fetchSafetyData, stats } = useSafety()
      await fetchSafetyData()

      expect(stats.value?.total_reports).toBe(150)
    })

    it('should return emergencyNumbers from data', async () => {
      const { fetchSafetyData, emergencyNumbers } = useSafety()
      await fetchSafetyData()

      expect(emergencyNumbers.value?.touristPolice).toBe('1155')
    })

    it('should filter high severity reports', async () => {
      const { fetchSafetyData, highSeverityReports } = useSafety()
      await fetchSafetyData()

      expect(highSeverityReports.value).toHaveLength(1)
      expect(highSeverityReports.value[0].severity).toBe(3)
    })

    it('should filter verified reports', async () => {
      const { fetchSafetyData, verifiedReports } = useSafety()
      await fetchSafetyData()

      expect(verifiedReports.value).toHaveLength(2)
      expect(verifiedReports.value.every(r => r.verified)).toBe(true)
    })

    it('should group reports by province', async () => {
      const { fetchSafetyData, reportsByProvince } = useSafety()
      await fetchSafetyData()

      expect(reportsByProvince.value['Bangkok']).toHaveLength(2)
      expect(reportsByProvince.value['Phuket']).toHaveLength(1)
    })

    it('should group reports by type', async () => {
      const { fetchSafetyData, reportsByType } = useSafety()
      await fetchSafetyData()

      expect(reportsByType.value['taxi_scam']).toHaveLength(2)
      expect(reportsByType.value['overcharge']).toHaveLength(1)
    })
  })

  describe('getSafetyScore', () => {
    it('should return province safety score', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSafetyData))

      const { fetchSafetyData, getSafetyScore } = useSafety()
      await fetchSafetyData()

      expect(getSafetyScore('Bangkok')).toBe(4)
      expect(getSafetyScore('Phuket')).toBe(3)
    })

    it('should return default score 4 for unknown province', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSafetyData))

      const { fetchSafetyData, getSafetyScore } = useSafety()
      await fetchSafetyData()

      expect(getSafetyScore('Unknown')).toBe(4)
    })
  })

  describe('getSafetyLabel', () => {
    it('should return "Very Safe" for score >= 5', () => {
      const { getSafetyLabel } = useSafety()

      expect(getSafetyLabel(5)).toEqual({ label: 'Very Safe', color: 'text-green-600' })
      expect(getSafetyLabel(5.5)).toEqual({ label: 'Very Safe', color: 'text-green-600' })
    })

    it('should return "Safe" for score >= 4', () => {
      const { getSafetyLabel } = useSafety()

      expect(getSafetyLabel(4)).toEqual({ label: 'Safe', color: 'text-green-500' })
      expect(getSafetyLabel(4.5)).toEqual({ label: 'Safe', color: 'text-green-500' })
    })

    it('should return "Use Caution" for score >= 3', () => {
      const { getSafetyLabel } = useSafety()

      expect(getSafetyLabel(3)).toEqual({ label: 'Use Caution', color: 'text-yellow-600' })
      expect(getSafetyLabel(3.5)).toEqual({ label: 'Use Caution', color: 'text-yellow-600' })
    })

    it('should return "Exercise Caution" for score >= 2', () => {
      const { getSafetyLabel } = useSafety()

      expect(getSafetyLabel(2)).toEqual({ label: 'Exercise Caution', color: 'text-orange-500' })
      expect(getSafetyLabel(2.5)).toEqual({ label: 'Exercise Caution', color: 'text-orange-500' })
    })

    it('should return "High Caution" for score < 2', () => {
      const { getSafetyLabel } = useSafety()

      expect(getSafetyLabel(1)).toEqual({ label: 'High Caution', color: 'text-red-600' })
      expect(getSafetyLabel(0)).toEqual({ label: 'High Caution', color: 'text-red-600' })
    })
  })

  describe('getSeverityInfo', () => {
    it('should return "High Risk" for severity >= 3', () => {
      const { getSeverityInfo } = useSafety()

      expect(getSeverityInfo(3)).toEqual({
        label: 'High Risk',
        color: 'text-red-700',
        bgColor: 'bg-red-50 border-red-200',
      })
    })

    it('should return "Medium Risk" for severity >= 2', () => {
      const { getSeverityInfo } = useSafety()

      expect(getSeverityInfo(2)).toEqual({
        label: 'Medium Risk',
        color: 'text-amber-700',
        bgColor: 'bg-amber-50 border-amber-200',
      })
    })

    it('should return "Low Risk" for severity < 2', () => {
      const { getSeverityInfo } = useSafety()

      expect(getSeverityInfo(1)).toEqual({
        label: 'Low Risk',
        color: 'text-blue-700',
        bgColor: 'bg-blue-50 border-blue-200',
      })
    })
  })

  describe('getScamTypeInfo', () => {
    it('should return scam type info', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSafetyData))

      const { fetchSafetyData, getScamTypeInfo } = useSafety()
      await fetchSafetyData()

      expect(getScamTypeInfo('taxi_scam')).toEqual({
        value: 'taxi_scam',
        label: 'Taxi Scam',
        icon: '🚕',
      })
    })

    it('should return undefined for unknown type', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockSafetyData))

      const { fetchSafetyData, getScamTypeInfo } = useSafety()
      await fetchSafetyData()

      expect(getScamTypeInfo('unknown')).toBeUndefined()
    })
  })

  describe('initial state', () => {
    it('should have empty computed values before fetch', () => {
      const { scamReports, provinceSafety, scamTypes, stats, emergencyNumbers } = useSafety()

      expect(scamReports.value).toEqual([])
      expect(provinceSafety.value).toEqual([])
      expect(scamTypes.value).toEqual([])
      expect(stats.value).toBeUndefined()
      expect(emergencyNumbers.value).toBeUndefined()
    })
  })
})
