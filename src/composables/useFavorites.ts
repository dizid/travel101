/**
 * Composable for managing saved/favorite places
 */

import { computed } from 'vue'
import { useUserStore } from '@stores/userStore'

export function useFavorites() {
  const userStore = useUserStore()

  const savedPlaces = computed(() => userStore.savedPlaces)
  const savedCount = computed(() => userStore.savedPlaces.length)

  function toggleFavorite(slug: string) {
    userStore.toggleSavedPlace(slug)
  }

  function isFavorite(slug: string): boolean {
    return userStore.isPlaceSaved(slug)
  }

  function removeFavorite(slug: string) {
    if (userStore.isPlaceSaved(slug)) {
      userStore.toggleSavedPlace(slug)
    }
  }

  return {
    savedPlaces,
    savedCount,
    toggleFavorite,
    isFavorite,
    removeFavorite,
  }
}
