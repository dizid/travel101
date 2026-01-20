import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFavorites } from './useFavorites'
import { useUserStore } from '@/stores/userStore'

describe('useFavorites', () => {
  let userStore: ReturnType<typeof useUserStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    userStore = useUserStore()
  })

  describe('savedPlaces', () => {
    it('should return empty array initially', () => {
      const { savedPlaces } = useFavorites()
      expect(savedPlaces.value).toEqual([])
    })

    it('should reflect user store saved places', () => {
      userStore.toggleSavedPlace('grand-palace')
      userStore.toggleSavedPlace('wat-arun')

      const { savedPlaces } = useFavorites()
      expect(savedPlaces.value).toContain('grand-palace')
      expect(savedPlaces.value).toContain('wat-arun')
    })
  })

  describe('savedCount', () => {
    it('should return 0 when no favorites', () => {
      const { savedCount } = useFavorites()
      expect(savedCount.value).toBe(0)
    })

    it('should return correct count of favorites', () => {
      userStore.toggleSavedPlace('place-1')
      userStore.toggleSavedPlace('place-2')
      userStore.toggleSavedPlace('place-3')

      const { savedCount } = useFavorites()
      expect(savedCount.value).toBe(3)
    })
  })

  describe('toggleFavorite', () => {
    it('should add place to favorites when not saved', () => {
      const { toggleFavorite, isFavorite } = useFavorites()

      expect(isFavorite('new-place')).toBe(false)
      toggleFavorite('new-place')
      expect(isFavorite('new-place')).toBe(true)
    })

    it('should remove place from favorites when already saved', () => {
      const { toggleFavorite, isFavorite } = useFavorites()

      toggleFavorite('test-place')
      expect(isFavorite('test-place')).toBe(true)

      toggleFavorite('test-place')
      expect(isFavorite('test-place')).toBe(false)
    })

    it('should update savedCount when toggling', () => {
      const { toggleFavorite, savedCount } = useFavorites()

      expect(savedCount.value).toBe(0)
      toggleFavorite('place-1')
      expect(savedCount.value).toBe(1)
      toggleFavorite('place-2')
      expect(savedCount.value).toBe(2)
      toggleFavorite('place-1')
      expect(savedCount.value).toBe(1)
    })
  })

  describe('isFavorite', () => {
    it('should return false for non-saved place', () => {
      const { isFavorite } = useFavorites()
      expect(isFavorite('unknown-place')).toBe(false)
    })

    it('should return true for saved place', () => {
      userStore.toggleSavedPlace('saved-place')

      const { isFavorite } = useFavorites()
      expect(isFavorite('saved-place')).toBe(true)
    })
  })

  describe('removeFavorite', () => {
    it('should remove place from favorites', () => {
      const { toggleFavorite, removeFavorite, isFavorite } = useFavorites()

      toggleFavorite('to-remove')
      expect(isFavorite('to-remove')).toBe(true)

      removeFavorite('to-remove')
      expect(isFavorite('to-remove')).toBe(false)
    })

    it('should do nothing if place is not in favorites', () => {
      const { removeFavorite, isFavorite, savedCount } = useFavorites()

      removeFavorite('not-saved')
      expect(isFavorite('not-saved')).toBe(false)
      expect(savedCount.value).toBe(0)
    })

    it('should not affect other favorites when removing one', () => {
      const { toggleFavorite, removeFavorite, isFavorite } = useFavorites()

      toggleFavorite('keep-1')
      toggleFavorite('remove-me')
      toggleFavorite('keep-2')

      removeFavorite('remove-me')

      expect(isFavorite('keep-1')).toBe(true)
      expect(isFavorite('keep-2')).toBe(true)
      expect(isFavorite('remove-me')).toBe(false)
    })
  })

  describe('reactivity', () => {
    it('should update savedPlaces when store changes', () => {
      const { savedPlaces, savedCount } = useFavorites()

      expect(savedPlaces.value).toEqual([])
      expect(savedCount.value).toBe(0)

      userStore.toggleSavedPlace('reactive-place')

      expect(savedPlaces.value).toContain('reactive-place')
      expect(savedCount.value).toBe(1)
    })
  })
})
