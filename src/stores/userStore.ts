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
  courseInterests: [],
  dietaryRestrictions: [],
}

export const useUserStore = defineStore('user', () => {
  // State
  const profile = ref<UserProfile>({
    prefs: { ...defaultPreferences },
    isPro: false,
  })
  const authUserId = ref<string | null>(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(false)
  const activities = ref<UserActivity[]>([])

  // Test mode for pro features (activated via ?test=test123 URL param)
  // Persists in sessionStorage so it survives navigation but clears on browser close
  const testMode = ref(sessionStorage.getItem('testMode') === 'true')

  // Getters
  const hasProfile = computed(() => {
    const prefs = profile.value.prefs
    return prefs.nationality !== '' && prefs.travelStyle.length > 0
  })

  // isPro returns true if user has subscription OR test mode is active
  const isPro = computed(() => testMode.value || profile.value.isPro)

  const displayName = computed(() => {
    if (profile.value.name) {
      return profile.value.name
    }
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

  function setTestMode(value: boolean) {
    testMode.value = value
    if (value) {
      sessionStorage.setItem('testMode', 'true')
      console.log('🔓 Test mode enabled - Pro features unlocked (persists until browser close)')
    } else {
      sessionStorage.removeItem('testMode')
    }
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

  function setAuthUser(userId: string, email?: string, displayName?: string) {
    authUserId.value = userId
    isAuthenticated.value = true
    if (email) {
      profile.value.email = email
    }
    if (displayName) {
      profile.value.name = displayName
    }
    saveToLocalStorage()
  }

  function clearAuthUser() {
    authUserId.value = null
    isAuthenticated.value = false
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

  // Favorites functions
  const savedPlaces = computed(() => profile.value.savedPlaces || [])

  function toggleSavedPlace(slug: string) {
    if (!profile.value.savedPlaces) {
      profile.value.savedPlaces = []
    }
    const index = profile.value.savedPlaces.indexOf(slug)
    if (index === -1) {
      profile.value.savedPlaces.push(slug)
    } else {
      profile.value.savedPlaces.splice(index, 1)
    }
    saveToLocalStorage()
  }

  function isPlaceSaved(slug: string): boolean {
    return profile.value.savedPlaces?.includes(slug) || false
  }

  // Initialize from localStorage
  loadFromLocalStorage()

  return {
    // State
    profile,
    authUserId,
    isAuthenticated,
    isLoading,
    activities,
    savedPlaces,
    testMode,
    // Getters
    hasProfile,
    isPro,
    displayName,
    // Actions
    updatePreferences,
    setProfile,
    setAuthenticated,
    setPro,
    setTestMode,
    addActivity,
    clearProfile,
    setAuthUser,
    clearAuthUser,
    loadFromLocalStorage,
    toggleSavedPlace,
    isPlaceSaved,
  }
})
