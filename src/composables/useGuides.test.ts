import { describe, it, expect, beforeEach } from 'vitest'
import { mockFetch, createMockResponse, createErrorResponse } from '@/test/setup'
import { useGuides, type Guide } from './useGuides'

const mockGuide: Guide = {
  id: 'guide-1',
  slug: 'bangkok-street-food',
  title: 'Bangkok Street Food Guide',
  subtitle: 'The ultimate guide to eating on the cheap',
  excerpt: 'Discover the best street food spots in Bangkok.',
  category: 'food',
  province: 'Bangkok',
  imageUrl: 'https://example.com/food.jpg',
  imageAlt: 'Thai street food',
  author: 'HappyRoam',
  readingTimeMin: 8,
  tags: ['food', 'bangkok', 'budget'],
  isPublished: true,
  publishedAt: '2026-01-15',
  updatedAt: '2026-02-01',
  viewCount: 1500,
}

const mockGuide2: Guide = {
  ...mockGuide,
  id: 'guide-2',
  slug: 'chiang-mai-temples',
  title: 'Chiang Mai Temple Guide',
  category: 'destination',
  province: 'Chiang Mai',
}

describe('useGuides', () => {
  beforeEach(() => {
    // Mocks reset automatically via setup.ts
  })

  describe('fetchAll', () => {
    it('should fetch all guides and update state', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ guides: [mockGuide, mockGuide2] })
      )

      const { fetchAll, guides, loading } = useGuides()
      const result = await fetchAll()

      expect(result).toHaveLength(2)
      expect(guides.value).toHaveLength(2)
      expect(loading.value).toBe(false)
      expect(mockFetch).toHaveBeenCalledWith('/api/guides')
    })

    it('should set error on failure', async () => {
      mockFetch.mockResolvedValueOnce(createErrorResponse('Server error', 500))

      const { fetchAll, error } = useGuides()
      const result = await fetchAll()

      expect(result).toEqual([])
      expect(error.value).toBeTruthy()
    })

    it('should handle empty response', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ guides: [] }))

      const { fetchAll } = useGuides()
      const result = await fetchAll()

      expect(result).toEqual([])
    })
  })

  describe('fetchByCategory', () => {
    it('should fetch guides filtered by category', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ guides: [mockGuide] })
      )

      const { fetchByCategory } = useGuides()
      await fetchByCategory('food')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('category=food')
      )
    })
  })

  describe('fetchBySlug', () => {
    it('should fetch a single guide with content', async () => {
      const fullGuide = { ...mockGuide, content: '# Bangkok Street Food\n\nGreat food...' }
      mockFetch.mockResolvedValueOnce(createMockResponse(fullGuide))

      const { fetchBySlug } = useGuides()
      const result = await fetchBySlug('bangkok-street-food')

      expect(result).toBeTruthy()
      expect(result?.content).toContain('Bangkok Street Food')
    })

    it('should return null for 404', async () => {
      mockFetch.mockResolvedValueOnce(createErrorResponse('Not found', 404))

      const { fetchBySlug } = useGuides()
      const result = await fetchBySlug('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('searchGuides', () => {
    it('should search guides', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ guides: [mockGuide] })
      )

      const { searchGuides } = useGuides()
      const result = await searchGuides('food')

      expect(result).toHaveLength(1)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('search=food')
      )
    })

    it('should return empty for blank query', async () => {
      const { searchGuides } = useGuides()
      const result = await searchGuides('')

      expect(result).toEqual([])
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('category helpers', () => {
    it('getCategoryLabel should return label for known categories', () => {
      const { getCategoryLabel } = useGuides()
      expect(getCategoryLabel('food')).toBe('Food')
      expect(getCategoryLabel('destination')).toBe('Destination')
      expect(getCategoryLabel('budget')).toBe('Budget')
    })

    it('getCategoryLabel should fall back to practical for unknown', () => {
      const { getCategoryLabel } = useGuides()
      expect(getCategoryLabel('unknown')).toBe('Practical')
    })

    it('getCategoryColor should return color class', () => {
      const { getCategoryColor } = useGuides()
      expect(getCategoryColor('food')).toContain('orange')
    })

    it('getCategoryIcon should return emoji', () => {
      const { getCategoryIcon } = useGuides()
      expect(getCategoryIcon('food')).toBe('🍜')
      expect(getCategoryIcon('destination')).toBe('📍')
    })
  })

  describe('formatDate', () => {
    it('should format date string', () => {
      const { formatDate } = useGuides()
      const result = formatDate('2026-01-15')
      expect(result).toContain('January')
      expect(result).toContain('15')
      expect(result).toContain('2026')
    })
  })

  describe('guidesByCategory', () => {
    it('should group guides by category', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ guides: [mockGuide, mockGuide2] })
      )

      const { fetchAll, guidesByCategory } = useGuides()
      await fetchAll()

      expect(guidesByCategory.value['food']).toHaveLength(1)
      expect(guidesByCategory.value['destination']).toHaveLength(1)
    })
  })
})
