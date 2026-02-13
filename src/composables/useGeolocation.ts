import { ref, computed } from 'vue'

// Shared state - all components see the same location
const userLatitude = ref<number | null>(null)
const userLongitude = ref<number | null>(null)
const locationLoading = ref(false)
const locationError = ref<string | null>(null)

const STORAGE_KEY = 'user-geolocation'

// Load from session cache (30min TTL)
function loadCache(): boolean {
  try {
    const cached = sessionStorage.getItem(STORAGE_KEY)
    if (cached) {
      const { lat, lng, ts } = JSON.parse(cached)
      if (Date.now() - ts < 30 * 60 * 1000) {
        userLatitude.value = lat
        userLongitude.value = lng
        return true
      }
    }
  } catch { /* ignore */ }
  return false
}

// Try loading cache immediately
loadCache()

export function useGeolocation() {
  const hasLocation = computed(() => userLatitude.value !== null && userLongitude.value !== null)

  async function requestLocation(): Promise<boolean> {
    if (hasLocation.value) return true
    if (loadCache()) return true
    if (!navigator.geolocation) {
      locationError.value = 'Geolocation not supported'
      return false
    }

    locationLoading.value = true
    locationError.value = null

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          userLatitude.value = pos.coords.latitude
          userLongitude.value = pos.coords.longitude
          locationLoading.value = false
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
            lat: pos.coords.latitude, lng: pos.coords.longitude, ts: Date.now()
          }))
          resolve(true)
        },
        (err) => {
          locationError.value = err.code === 1 ? 'Location permission denied' : 'Could not get location'
          locationLoading.value = false
          resolve(false)
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
      )
    })
  }

  return {
    userLatitude,
    userLongitude,
    locationLoading,
    locationError,
    hasLocation,
    requestLocation,
  }
}
