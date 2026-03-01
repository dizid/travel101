import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockFetch, createMockResponse, createErrorResponse } from '@/test/setup'

// Mock the thaiProvinces module
vi.mock('@/data/thaiProvinces', () => ({
  getFestivalDistance: vi.fn((lat: number, lng: number, provinces: string[] | null, isNationwide: boolean) => {
    if (isNationwide) return 0
    if (!provinces?.length) return null
    return 100 // Fixed distance for testing
  }),
  formatDistance: vi.fn((km: number | null) => {
    if (km === null) return null
    if (km === 0) return 'Nationwide'
    return `~${km} km`
  }),
}))

import { useFestivals } from './useFestivals'
import type { Festival } from '@/types'

const mockFestival: Festival = {
  id: 'fest-1',
  slug: 'songkran',
  name: 'Songkran',
  description: 'Thai New Year water festival',
  festivalType: 'cultural',
  religion: 'buddhist',
  provinces: ['Bangkok', 'Chiang Mai'],
  isNationwide: true,
  isHiddenGem: false,
  durationDays: 3,
  crowdLevel: 'extreme',
  startDate: '2026-04-13',
  endDate: '2026-04-15',
}

const mockFestival2: Festival = {
  id: 'fest-2',
  slug: 'loy-krathong',
  name: 'Loy Krathong',
  description: 'Festival of lights on water',
  festivalType: 'religious',
  religion: 'buddhist',
  provinces: ['Sukhothai'],
  isNationwide: false,
  isHiddenGem: false,
  durationDays: 1,
  crowdLevel: 'high',
  startDate: '2026-11-15',
  endDate: '2026-11-15',
}

describe('useFestivals', () => {
  beforeEach(() => {
    // Reset shared state by clearing mocks
    vi.clearAllMocks()
  })

  describe('fetchAll', () => {
    it('should fetch all festivals', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ festivals: [mockFestival, mockFestival2] })
      )

      const { fetchAll, allFestivals } = useFestivals()
      const result = await fetchAll()

      expect(result).toHaveLength(2)
      expect(allFestivals.value).toHaveLength(2)
      expect(mockFetch).toHaveBeenCalledWith('/api/festivals')
    })

    it('should return empty array on error', async () => {
      mockFetch.mockResolvedValueOnce(createErrorResponse('Server error', 500))

      const { fetchAll } = useFestivals()
      const result = await fetchAll()

      expect(result).toEqual([])
    })
  })

  describe('fetchUpcoming', () => {
    it('should fetch upcoming festivals with days parameter', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ festivals: [mockFestival] })
      )

      const { fetchUpcoming } = useFestivals()
      await fetchUpcoming(30)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('days=30')
      )
    })

    it('should default to 60 days', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ festivals: [] })
      )

      const { fetchUpcoming } = useFestivals()
      await fetchUpcoming()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('days=60')
      )
    })
  })

  describe('fetchFiltered', () => {
    it('should build URL with filter params', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ festivals: [mockFestival], total: 1, hasMore: false })
      )

      const { fetchFiltered } = useFestivals()
      await fetchFiltered({ type: 'cultural' as any, month: 4 })

      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('type=cultural')
      expect(url).toContain('month=4')
    })

    it('should omit undefined filters', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ festivals: [] })
      )

      const { fetchFiltered } = useFestivals()
      await fetchFiltered({ month: 12 })

      const url = mockFetch.mock.calls[0][0] as string
      expect(url).not.toContain('type=')
      expect(url).toContain('month=12')
    })
  })

  describe('fetchBySlug', () => {
    it('should fetch single festival', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(mockFestival))

      const { fetchBySlug } = useFestivals()
      const result = await fetchBySlug('songkran')

      expect(result).toBeTruthy()
      expect(mockFetch).toHaveBeenCalledWith('/api/festivals/songkran')
    })

    it('should return null for 404', async () => {
      mockFetch.mockResolvedValueOnce(createErrorResponse('Not found', 404))

      const { fetchBySlug } = useFestivals()
      const result = await fetchBySlug('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('searchFestivals', () => {
    it('should search with query', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ festivals: [mockFestival] })
      )

      const { searchFestivals } = useFestivals()
      await searchFestivals('water')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('search=water')
      )
    })

    it('should return empty for blank query', async () => {
      const { searchFestivals } = useFestivals()
      const result = await searchFestivals('   ')

      expect(result).toEqual([])
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('helper functions', () => {
    it('getFestivalEmoji should return slug-specific emoji', () => {
      const { getFestivalEmoji } = useFestivals()
      expect(getFestivalEmoji(mockFestival)).toBe('💦') // songkran
    })

    it('getFestivalEmoji should return crown for royal festivals', () => {
      const { getFestivalEmoji } = useFestivals()
      expect(getFestivalEmoji({ ...mockFestival, slug: 'unknown', festivalType: 'royal' } as Festival)).toBe('👑')
    })

    it('getFestivalEmoji should fall back to religion emoji', () => {
      const { getFestivalEmoji } = useFestivals()
      expect(getFestivalEmoji({ ...mockFestival, slug: 'unknown', festivalType: 'cultural', religion: 'buddhist' } as Festival)).toBe('🙏')
    })

    it('getFestivalEmoji should fall back to default', () => {
      const { getFestivalEmoji } = useFestivals()
      expect(getFestivalEmoji({ ...mockFestival, slug: 'unknown', festivalType: 'cultural', religion: undefined } as Festival)).toBe('🎉')
    })

    it('getFestivalTypeColor should return color for known types', () => {
      const { getFestivalTypeColor } = useFestivals()
      expect(getFestivalTypeColor('religious')).toContain('amber')
      expect(getFestivalTypeColor('cultural')).toContain('purple')
    })

    it('getFestivalTypeColor should return default for unknown type', () => {
      const { getFestivalTypeColor } = useFestivals()
      expect(getFestivalTypeColor('unknown')).toContain('gray')
    })

    it('getCrowdLevelColor should return correct colors', () => {
      const { getCrowdLevelColor } = useFestivals()
      expect(getCrowdLevelColor('extreme')).toContain('red')
      expect(getCrowdLevelColor('low')).toContain('green')
    })

    it('getCountdownText should format various durations', () => {
      const { getCountdownText } = useFestivals()
      expect(getCountdownText(0)).toBe('Today!')
      expect(getCountdownText(1)).toBe('Tomorrow!')
      expect(getCountdownText(5)).toBe('In 5 days')
      expect(getCountdownText(14)).toBe('In 2 weeks')
      expect(getCountdownText(60)).toBe('In 2 months')
    })

    it('getCountdownText should handle ongoing festivals', () => {
      const { getCountdownText } = useFestivals()
      expect(getCountdownText(0, true)).toBe('Happening Now')
    })

    it('getMonthName should return correct month names', () => {
      const { getMonthName } = useFestivals()
      expect(getMonthName(1)).toBe('January')
      expect(getMonthName(12)).toBe('December')
      expect(getMonthName(0)).toBe('')
      expect(getMonthName(13)).toBe('')
    })

    it('formatFestivalDate should format single day', () => {
      const { formatFestivalDate } = useFestivals()
      const result = formatFestivalDate('2026-04-13')
      expect(result).toContain('Apr')
      expect(result).toContain('13')
    })

    it('formatFestivalDate should format multi-day range', () => {
      const { formatFestivalDate } = useFestivals()
      const result = formatFestivalDate('2026-04-13', 3)
      expect(result).toContain(' - ')
    })
  })

  describe('distance helpers', () => {
    it('withDistances should annotate festivals with distance', () => {
      const { withDistances } = useFestivals()
      const result = withDistances([mockFestival, mockFestival2], 13.75, 100.50)

      expect(result[0].distanceKm).toBe(0) // nationwide
      expect(result[1].distanceKm).toBe(100) // mock returns 100
    })

    it('sortByProximity should sort by distance', () => {
      const { sortByProximity } = useFestivals()
      const festivals = [
        { distanceKm: 200 },
        { distanceKm: null },
        { distanceKm: 50 },
        { distanceKm: 0 },
      ]
      const sorted = sortByProximity(festivals)

      expect(sorted[0].distanceKm).toBe(0)
      expect(sorted[1].distanceKm).toBe(50)
      expect(sorted[2].distanceKm).toBe(200)
      expect(sorted[3].distanceKm).toBeNull()
    })
  })
})
