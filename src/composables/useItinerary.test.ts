import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useItinerary, type Itinerary, type ItineraryDay, type ItineraryActivity } from './useItinerary'
import { useUserStore } from '@/stores/userStore'
import { mockFetch, createMockResponse } from '@/test/setup'

describe('useItinerary', () => {
  let userStore: ReturnType<typeof useUserStore>

  const mockActivity: ItineraryActivity = {
    id: 'activity-1',
    dayId: 'day-1',
    timeSlot: '09:00',
    title: 'Visit Grand Palace',
    description: 'Explore the historic royal complex',
    activityType: 'sightseeing',
    attractionSlug: 'grand-palace',
    durationMinutes: 180,
    estimatedCostThb: 500,
    sortOrder: 0,
  }

  const mockDay: ItineraryDay = {
    id: 'day-1',
    itineraryId: 'itin-1',
    dayNumber: 1,
    date: '2024-07-01',
    location: 'Bangkok',
    notes: 'First day in Bangkok',
    activities: [mockActivity],
  }

  const mockItinerary: Itinerary = {
    id: 'itin-1',
    userId: 'user-123',
    name: 'Thailand Adventure',
    startDate: '2024-07-01',
    endDate: '2024-07-07',
    status: 'draft',
    aiGenerated: false,
    createdAt: '2024-06-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
    days: [mockDay],
    dayCount: 7,
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    userStore = useUserStore()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Pro requirement', () => {
    it('should not fetch itineraries for non-Pro users', async () => {
      userStore.setPro(false)

      const { fetchItineraries } = useItinerary()
      const result = await fetchItineraries()

      expect(result).toEqual([])
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should not create itinerary for non-Pro users', async () => {
      userStore.setPro(false)

      const { createItinerary } = useItinerary()
      const result = await createItinerary({ name: 'Test' })

      expect(result).toBeNull()
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should not generate itinerary for non-Pro users', async () => {
      userStore.setPro(false)

      const { generateItinerary } = useItinerary()
      const result = await generateItinerary({ duration: 7 })

      expect(result).toBeNull()
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('fetchItineraries', () => {
    it('should fetch itineraries for Pro users', async () => {
      userStore.setPro(true)
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ itineraries: [mockItinerary] })
      )

      const { fetchItineraries, itineraries } = useItinerary()
      await fetchItineraries()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/itinerary'),
        expect.any(Object)
      )
      expect(itineraries.value).toHaveLength(1)
      expect(itineraries.value[0].name).toBe('Thailand Adventure')
    })
  })

  describe('fetchItinerary', () => {
    it('should fetch single itinerary with days', async () => {
      userStore.setPro(true)
      mockFetch.mockResolvedValueOnce(createMockResponse(mockItinerary))

      const { fetchItinerary, currentItinerary } = useItinerary()
      await fetchItinerary('itin-1')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/itinerary?id=itin-1'),
        expect.any(Object)
      )
      expect(currentItinerary.value).toEqual(mockItinerary)
    })
  })

  describe('createItinerary', () => {
    it('should create itinerary and refresh list', async () => {
      userStore.setPro(true)
      mockFetch
        .mockResolvedValueOnce(createMockResponse({ itinerary: mockItinerary }))
        .mockResolvedValueOnce(createMockResponse({ itineraries: [mockItinerary] }))

      const { createItinerary, currentItinerary } = useItinerary()
      const result = await createItinerary({
        name: 'Thailand Adventure',
        startDate: '2024-07-01',
        endDate: '2024-07-07',
      })

      expect(result).toEqual(mockItinerary)
      expect(currentItinerary.value).toEqual(mockItinerary)
    })

    it('should create itinerary with days and activities', async () => {
      userStore.setPro(true)
      mockFetch
        .mockResolvedValueOnce(createMockResponse({ itinerary: mockItinerary }))
        .mockResolvedValueOnce(createMockResponse({ itineraries: [mockItinerary] }))

      const { createItinerary } = useItinerary()
      await createItinerary({
        name: 'Thailand Adventure',
        days: [
          {
            dayNumber: 1,
            location: 'Bangkok',
            activities: [
              { title: 'Grand Palace', durationMinutes: 180, estimatedCostThb: 500 },
            ],
          },
        ],
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Bangkok'),
        })
      )
    })
  })

  describe('generateItinerary', () => {
    it('should generate AI itinerary and set generating flag', async () => {
      userStore.setPro(true)
      mockFetch
        .mockResolvedValueOnce(
          createMockResponse({
            itinerary: mockItinerary,
            tips: ['Pack light', 'Stay hydrated'],
          })
        )
        .mockResolvedValueOnce(createMockResponse({ itineraries: [mockItinerary] }))

      const { generateItinerary, generating } = useItinerary()

      expect(generating.value).toBe(false)

      const resultPromise = generateItinerary({
        duration: 7,
        destinations: ['Bangkok', 'Chiang Mai'],
        interests: ['temples', 'food'],
      })

      // Note: generating.value is set synchronously before the async call
      const result = await resultPromise

      expect(result?.itinerary).toEqual(mockItinerary)
      expect(result?.tips).toEqual(['Pack light', 'Stay hydrated'])
      expect(generating.value).toBe(false)
    })

    it('should reset generating flag on error', async () => {
      userStore.setPro(true)
      mockFetch.mockRejectedValueOnce(new Error('API Error'))

      const { generateItinerary, generating } = useItinerary()

      await generateItinerary({ duration: 7 }).catch(() => {})

      expect(generating.value).toBe(false)
    })
  })

  describe('updateItinerary', () => {
    it('should update itinerary fields', async () => {
      userStore.setPro(true)
      const updated = { ...mockItinerary, name: 'Updated Name' }
      mockFetch
        .mockResolvedValueOnce(createMockResponse({ itinerary: updated }))
        .mockResolvedValueOnce(createMockResponse({ itineraries: [updated] }))

      const { updateItinerary, currentItinerary } = useItinerary()
      const result = await updateItinerary('itin-1', { name: 'Updated Name' })

      expect(result?.name).toBe('Updated Name')
      expect(currentItinerary.value?.name).toBe('Updated Name')
    })

    it('should update itinerary status', async () => {
      userStore.setPro(true)
      const completed = { ...mockItinerary, status: 'completed' as const }
      mockFetch
        .mockResolvedValueOnce(createMockResponse({ itinerary: completed }))
        .mockResolvedValueOnce(createMockResponse({ itineraries: [completed] }))

      const { updateItinerary } = useItinerary()
      const result = await updateItinerary('itin-1', { status: 'completed' })

      expect(result?.status).toBe('completed')
    })
  })

  describe('deleteItinerary', () => {
    it('should delete itinerary and update state', async () => {
      userStore.setPro(true)
      mockFetch
        .mockResolvedValueOnce(createMockResponse({ itineraries: [mockItinerary] }))
        .mockResolvedValueOnce(createMockResponse({ success: true }))

      const { fetchItineraries, deleteItinerary, itineraries, currentItinerary } = useItinerary()
      await fetchItineraries()
      currentItinerary.value = mockItinerary

      const result = await deleteItinerary('itin-1')

      expect(result).toBe(true)
      expect(itineraries.value).toHaveLength(0)
      expect(currentItinerary.value).toBeNull()
    })
  })

  describe('Day operations', () => {
    it('should add day to itinerary', async () => {
      userStore.setPro(true)
      mockFetch.mockResolvedValueOnce(createMockResponse(mockItinerary))

      const { fetchItinerary, currentItinerary } = useItinerary()
      await fetchItinerary('itin-1')

      const newDay: ItineraryDay = {
        id: 'day-2',
        itineraryId: 'itin-1',
        dayNumber: 2,
        location: 'Chiang Mai',
        activities: [],
      }
      mockFetch.mockResolvedValueOnce(createMockResponse({ day: newDay }))

      const { addDay } = useItinerary()
      // Use the instance's currentItinerary
      const itinerary = useItinerary()
      itinerary.currentItinerary.value = mockItinerary

      const result = await itinerary.addDay('itin-1', { location: 'Chiang Mai' })

      expect(result).toEqual(newDay)
    })

    it('should update day', async () => {
      userStore.setPro(true)
      const updatedDay = { ...mockDay, location: 'Phuket' }
      mockFetch.mockResolvedValueOnce(createMockResponse({ day: updatedDay }))

      const itinerary = useItinerary()
      itinerary.currentItinerary.value = { ...mockItinerary }

      const result = await itinerary.updateDay('day-1', { location: 'Phuket' })

      expect(result?.location).toBe('Phuket')
    })

    it('should delete day and renumber remaining days', async () => {
      userStore.setPro(true)
      mockFetch.mockResolvedValueOnce(createMockResponse({ success: true }))

      const itinerary = useItinerary()
      itinerary.currentItinerary.value = {
        ...mockItinerary,
        days: [
          { ...mockDay, id: 'day-1', dayNumber: 1 },
          { ...mockDay, id: 'day-2', dayNumber: 2 },
          { ...mockDay, id: 'day-3', dayNumber: 3 },
        ],
      }

      const result = await itinerary.deleteDay('day-2')

      expect(result).toBe(true)
      expect(itinerary.currentItinerary.value.days).toHaveLength(2)
      expect(itinerary.currentItinerary.value.days[0].dayNumber).toBe(1)
      expect(itinerary.currentItinerary.value.days[1].dayNumber).toBe(2)
    })
  })

  describe('Activity operations', () => {
    it('should add activity to day', async () => {
      userStore.setPro(true)
      const newActivity: ItineraryActivity = {
        id: 'activity-2',
        dayId: 'day-1',
        title: 'Wat Pho',
        sortOrder: 1,
      }
      mockFetch.mockResolvedValueOnce(createMockResponse({ activity: newActivity }))

      const itinerary = useItinerary()
      itinerary.currentItinerary.value = { ...mockItinerary }

      const result = await itinerary.addActivity('day-1', { title: 'Wat Pho' })

      expect(result).toEqual(newActivity)
      expect(itinerary.currentItinerary.value.days?.[0].activities).toHaveLength(2)
    })

    it('should update activity', async () => {
      userStore.setPro(true)
      const updatedActivity = { ...mockActivity, title: 'Updated Title' }
      mockFetch.mockResolvedValueOnce(createMockResponse({ activity: updatedActivity }))

      const itinerary = useItinerary()
      itinerary.currentItinerary.value = { ...mockItinerary }

      const result = await itinerary.updateActivity('activity-1', { title: 'Updated Title' })

      expect(result?.title).toBe('Updated Title')
    })

    it('should delete activity and renumber', async () => {
      userStore.setPro(true)
      mockFetch.mockResolvedValueOnce(createMockResponse({ success: true }))

      const itinerary = useItinerary()
      itinerary.currentItinerary.value = {
        ...mockItinerary,
        days: [
          {
            ...mockDay,
            activities: [
              { ...mockActivity, id: 'a1', sortOrder: 0 },
              { ...mockActivity, id: 'a2', sortOrder: 1 },
              { ...mockActivity, id: 'a3', sortOrder: 2 },
            ],
          },
        ],
      }

      const result = await itinerary.deleteActivity('a2')

      expect(result).toBe(true)
      const activities = itinerary.currentItinerary.value.days?.[0].activities
      expect(activities).toHaveLength(2)
      expect(activities?.[0].sortOrder).toBe(0)
      expect(activities?.[1].sortOrder).toBe(1)
    })
  })

  describe('getTripDuration', () => {
    it('should calculate duration from start and end dates', () => {
      const { getTripDuration } = useItinerary()

      const itinerary: Itinerary = {
        ...mockItinerary,
        startDate: '2024-07-01',
        endDate: '2024-07-07',
      }

      expect(getTripDuration(itinerary)).toBe(7)
    })

    it('should return dayCount when no dates', () => {
      const { getTripDuration } = useItinerary()

      const itinerary: Itinerary = {
        ...mockItinerary,
        startDate: undefined,
        endDate: undefined,
        dayCount: 5,
      }

      expect(getTripDuration(itinerary)).toBe(5)
    })

    it('should return 0 when no dates or dayCount', () => {
      const { getTripDuration } = useItinerary()

      const itinerary: Itinerary = {
        ...mockItinerary,
        startDate: undefined,
        endDate: undefined,
        dayCount: undefined,
      }

      expect(getTripDuration(itinerary)).toBe(0)
    })
  })

  describe('getTotalBudget', () => {
    it('should sum all activity costs', () => {
      const { getTotalBudget } = useItinerary()

      const itinerary: Itinerary = {
        ...mockItinerary,
        days: [
          {
            ...mockDay,
            activities: [
              { ...mockActivity, estimatedCostThb: 500 },
              { ...mockActivity, estimatedCostThb: 300 },
            ],
          },
          {
            ...mockDay,
            id: 'day-2',
            activities: [
              { ...mockActivity, estimatedCostThb: 1000 },
            ],
          },
        ],
      }

      expect(getTotalBudget(itinerary)).toBe(1800)
    })

    it('should return 0 when no days', () => {
      const { getTotalBudget } = useItinerary()

      const itinerary: Itinerary = {
        ...mockItinerary,
        days: undefined,
      }

      expect(getTotalBudget(itinerary)).toBe(0)
    })

    it('should handle activities without cost', () => {
      const { getTotalBudget } = useItinerary()

      const itinerary: Itinerary = {
        ...mockItinerary,
        days: [
          {
            ...mockDay,
            activities: [
              { ...mockActivity, estimatedCostThb: 500 },
              { ...mockActivity, estimatedCostThb: undefined },
            ],
          },
        ],
      }

      expect(getTotalBudget(itinerary)).toBe(500)
    })
  })

  describe('getLocations', () => {
    it('should return unique locations', () => {
      const { getLocations } = useItinerary()

      const itinerary: Itinerary = {
        ...mockItinerary,
        days: [
          { ...mockDay, location: 'Bangkok' },
          { ...mockDay, id: 'day-2', location: 'Chiang Mai' },
          { ...mockDay, id: 'day-3', location: 'Bangkok' },
          { ...mockDay, id: 'day-4', location: 'Phuket' },
        ],
      }

      const locations = getLocations(itinerary)

      expect(locations).toHaveLength(3)
      expect(locations).toContain('Bangkok')
      expect(locations).toContain('Chiang Mai')
      expect(locations).toContain('Phuket')
    })

    it('should return empty array when no days', () => {
      const { getLocations } = useItinerary()

      const itinerary: Itinerary = {
        ...mockItinerary,
        days: undefined,
      }

      expect(getLocations(itinerary)).toEqual([])
    })
  })
})
