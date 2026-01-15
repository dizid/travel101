import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserProfile, UserPreferences, UserActivity } from '@/types'

const defaultPreferences: UserPreferences = {
  travelStyle: [],
  ageGroup: 'middle',
  groupType: 'solo',
  budget: 'mid',
  interests: [],
  nationality: '',
  tripType: 'holiday',
}

export const useUserStore = defineStore('user', () => {
  // State
  const profile = ref<UserProfile>({
    prefs: { ...defaultPreferences },
    isPro: false,
  })
  const isAuthenticated = ref(false)
  const isLoading = ref(false)
  const activities = ref<UserActivity[]>([])

  // Getters
  const hasProfile = computed(() => {
    const prefs = profile.value.prefs
    return prefs.nationality !== '' && prefs.travelStyle.length > 0
  })

  const isPro = computed(() => profile.value.isPro)

  const displayName = computed(() => {
    if (profile.value.email) {
      return profile.value.email.split('@')[0]
    }
    return 'Traveler'
  })

  // Actions
  function updatePreferences(prefs: Partial<UserPreferences>) {
    profile.value.prefs = { ...profile.value.prefs, ...prefs }
    saveToLocalStorage()
  }

  function setProfile(newProfile: Partial<UserProfile>) {
    profile.value = { ...profile.value, ...newProfile }
    saveToLocalStorage()
  }

  function setAuthenticated(value: boolean) {
    isAuthenticated.value = value
  }

  function setPro(value: boolean) {
    profile.value.isPro = value
    saveToLocalStorage()
  }

  function addActivity(activity: Omit<UserActivity, 'id' | 'createdAt'>) {
    const newActivity: UserActivity = {
      ...activity,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    }
    activities.value.unshift(newActivity)
    // Keep only last 50 activities
    if (activities.value.length > 50) {
      activities.value = activities.value.slice(0, 50)
    }
  }

  function clearProfile() {
    profile.value = {
      prefs: { ...defaultPreferences },
      isPro: false,
    }
    isAuthenticated.value = false
    activities.value = []
    localStorage.removeItem('user-profile')
  }

  // Local storage persistence
  function saveToLocalStorage() {
    localStorage.setItem('user-profile', JSON.stringify(profile.value))
  }

  function loadFromLocalStorage() {
    const saved = localStorage.getItem('user-profile')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        profile.value = {
          ...profile.value,
          ...parsed,
          prefs: { ...defaultPreferences, ...parsed.prefs },
        }
      } catch (e) {
        console.error('Failed to parse saved profile:', e)
      }
    }
  }

  // Initialize from localStorage
  loadFromLocalStorage()

  return {
    // State
    profile,
    isAuthenticated,
    isLoading,
    activities,
    // Getters
    hasProfile,
    isPro,
    displayName,
    // Actions
    updatePreferences,
    setProfile,
    setAuthenticated,
    setPro,
    addActivity,
    clearProfile,
    loadFromLocalStorage,
  }
})
