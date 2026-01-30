import { ref, computed } from 'vue'
import { useApi } from './useApi'
import { useUserStore } from '@/stores/userStore'

export interface ItineraryActivity {
  id: string
  dayId: string
  timeSlot?: string
  title: string
  description?: string
  activityType?: string
  attractionSlug?: string
  durationMinutes?: number
  estimatedCostThb?: number
  googleMapsUrl?: string
  bookingUrl?: string
  notes?: string
  sortOrder: number
}

export interface ItineraryDay {
  id: string
  itineraryId: string
  dayNumber: number
  date?: string
  location: string
  notes?: string
  activities: ItineraryActivity[]
}

export interface Itinerary {
  id: string
  userId: string
  name: string
  startDate?: string
  endDate?: string
  status: 'draft' | 'active' | 'completed' | 'archived'
  coverImageUrl?: string
  notes?: string
  aiGenerated: boolean
  createdAt: string
  updatedAt: string
  days?: ItineraryDay[]
  dayCount?: number
}

export interface GenerateOptions {
  duration: number
  destinations?: string[]
  interests?: string[]
  travelStyle?: string[]
  budget?: string
  groupType?: string
  // Enhanced generation options
  budgetMode?: 'budget' | 'comfort' | 'luxury'
  travelPace?: 'relaxed' | 'moderate' | 'packed'
  tripFocus?: string[]
}

export function useItinerary() {
  const { get, post, put, del, loading, error } = useApi()
  const userStore = useUserStore()

  const itineraries = ref<Itinerary[]>([])
  const currentItinerary = ref<Itinerary | null>(null)
  const generating = ref(false)

  const isPro = computed(() => userStore.isPro)

  async function fetchItineraries() {
    if (!isPro.value) return []
    const result = await get<{ itineraries: Itinerary[] }>('/itinerary')
    if (result) {
      itineraries.value = result.itineraries
    }
    return itineraries.value
  }

  async function fetchItinerary(id: string) {
    if (!isPro.value) return null
    const result = await get<Itinerary>(`/itinerary?id=${id}`)
    if (result) {
      currentItinerary.value = result
    }
    return currentItinerary.value
  }

  async function createItinerary(data: {
    name: string
    startDate?: string
    endDate?: string
    days?: Array<{
      dayNumber: number
      date?: string
      location: string
      activities?: Array<{
        timeSlot?: string
        title: string
        description?: string
        activityType?: string
        durationMinutes?: number
        estimatedCostThb?: number
      }>
    }>
  }) {
    if (!isPro.value) return null
    const result = await post<{ itinerary: Itinerary }>('/itinerary', data)
    if (result) {
      currentItinerary.value = result.itinerary
      await fetchItineraries()
    }
    return result?.itinerary
  }

  async function generateItinerary(options: GenerateOptions) {
    if (!isPro.value) return null
    generating.value = true
    try {
      const result = await post<{ itinerary: Itinerary; tips: string[] }>('/itinerary', {
        action: 'generate',
        ...options,
      })
      if (result) {
        currentItinerary.value = result.itinerary
        await fetchItineraries()
        return result
      }
    } finally {
      generating.value = false
    }
    return null
  }

  async function updateItinerary(
    id: string,
    data: {
      name?: string
      startDate?: string
      endDate?: string
      status?: Itinerary['status']
      notes?: string
    }
  ) {
    if (!isPro.value) return null
    const result = await put<{ itinerary: Itinerary }>(`/itinerary?id=${id}`, data)
    if (result) {
      currentItinerary.value = result.itinerary
      await fetchItineraries()
    }
    return result?.itinerary
  }

  async function deleteItinerary(id: string) {
    if (!isPro.value) return false
    const result = await del<{ success: boolean }>(`/itinerary?id=${id}`)
    if (result?.success) {
      itineraries.value = itineraries.value.filter((i) => i.id !== id)
      if (currentItinerary.value?.id === id) {
        currentItinerary.value = null
      }
    }
    return result?.success ?? false
  }

  // Helper to calculate trip duration
  function getTripDuration(itinerary: Itinerary): number {
    if (itinerary.startDate && itinerary.endDate) {
      const start = new Date(itinerary.startDate)
      const end = new Date(itinerary.endDate)
      return Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1
    }
    return itinerary.dayCount || 0
  }

  // Helper to calculate total budget
  function getTotalBudget(itinerary: Itinerary): number {
    if (!itinerary.days) return 0
    return itinerary.days.reduce((total, day) => {
      return total + day.activities.reduce((dayTotal, activity) => {
        return dayTotal + (activity.estimatedCostThb || 0)
      }, 0)
    }, 0)
  }

  // Get unique locations from itinerary
  function getLocations(itinerary: Itinerary): string[] {
    if (!itinerary.days) return []
    return [...new Set(itinerary.days.map((d) => d.location).filter(Boolean))]
  }

  // Day CRUD operations
  async function addDay(itineraryId: string, data: { location?: string; date?: string; notes?: string } = {}) {
    if (!isPro.value) return null
    const result = await post<{ day: ItineraryDay }>(
      `/itinerary?resource=day&id=${itineraryId}`,
      data
    )
    if (result && currentItinerary.value) {
      currentItinerary.value.days = [...(currentItinerary.value.days || []), result.day]
    }
    return result?.day
  }

  async function updateDay(dayId: string, data: { location?: string; date?: string; dayNumber?: number; notes?: string }) {
    if (!isPro.value) return null
    const result = await put<{ day: ItineraryDay }>(
      `/itinerary?resource=day&dayId=${dayId}`,
      data
    )
    if (result && currentItinerary.value?.days) {
      const idx = currentItinerary.value.days.findIndex((d) => d.id === dayId)
      if (idx >= 0) {
        currentItinerary.value.days[idx] = result.day
      }
    }
    return result?.day
  }

  async function deleteDay(dayId: string) {
    if (!isPro.value) return false
    const result = await del<{ success: boolean }>(`/itinerary?resource=day&dayId=${dayId}`)
    if (result?.success && currentItinerary.value?.days) {
      currentItinerary.value.days = currentItinerary.value.days.filter((d) => d.id !== dayId)
      // Renumber days
      currentItinerary.value.days.forEach((d, idx) => {
        d.dayNumber = idx + 1
      })
    }
    return result?.success ?? false
  }

  // Activity CRUD operations
  async function addActivity(dayId: string, data: Partial<ItineraryActivity>) {
    if (!isPro.value) return null
    const result = await post<{ activity: ItineraryActivity }>(
      `/itinerary?resource=activity&dayId=${dayId}`,
      data
    )
    if (result && currentItinerary.value?.days) {
      const day = currentItinerary.value.days.find((d) => d.id === dayId)
      if (day) {
        day.activities = [...day.activities, result.activity]
      }
    }
    return result?.activity
  }

  async function updateActivity(activityId: string, data: Partial<ItineraryActivity>) {
    if (!isPro.value) return null
    const result = await put<{ activity: ItineraryActivity }>(
      `/itinerary?resource=activity&activityId=${activityId}`,
      data
    )
    if (result && currentItinerary.value?.days) {
      for (const day of currentItinerary.value.days) {
        const idx = day.activities.findIndex((a) => a.id === activityId)
        if (idx >= 0) {
          day.activities[idx] = result.activity
          break
        }
      }
    }
    return result?.activity
  }

  async function deleteActivity(activityId: string) {
    if (!isPro.value) return false
    const result = await del<{ success: boolean }>(`/itinerary?resource=activity&activityId=${activityId}`)
    if (result?.success && currentItinerary.value?.days) {
      for (const day of currentItinerary.value.days) {
        const idx = day.activities.findIndex((a) => a.id === activityId)
        if (idx >= 0) {
          day.activities.splice(idx, 1)
          // Renumber activities
          day.activities.forEach((a, i) => {
            a.sortOrder = i
          })
          break
        }
      }
    }
    return result?.success ?? false
  }

  return {
    // State
    itineraries,
    currentItinerary,
    loading,
    error,
    generating,
    isPro,
    // Itinerary Actions
    fetchItineraries,
    fetchItinerary,
    createItinerary,
    generateItinerary,
    updateItinerary,
    deleteItinerary,
    // Day Actions
    addDay,
    updateDay,
    deleteDay,
    // Activity Actions
    addActivity,
    updateActivity,
    deleteActivity,
    // Helpers
    getTripDuration,
    getTotalBudget,
    getLocations,
  }
}
