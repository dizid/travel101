import { computed } from 'vue'
import { useUserStore } from '@/stores/userStore'

/**
 * Single source of truth for the profile-completion percentage, used by
 * AppHeader, DashboardView, and PersonalizationBar. Previously each of these
 * reimplemented the same 25%-per-field formula independently.
 */
export function useProfileCompleteness() {
  const userStore = useUserStore()

  const profileCompleteness = computed(() => {
    const prefs = userStore.profile.prefs
    let score = 0
    if (prefs.nationality) score += 25
    if (prefs.travelStyle.length > 0) score += 25
    if (prefs.interests.length > 0) score += 25
    if (prefs.tripType) score += 25
    return score
  })

  return { profileCompleteness }
}
