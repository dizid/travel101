import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from './userStore'
import { localStorageMock } from '@/test/setup'
import {
  backpackerPrefs,
  luxuryCouplePrefs,
  defaultPreferences,
} from '@/test/fixtures'

describe('userStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorageMock.store = {}
  })

  describe('initial state', () => {
    it('should have default preferences', () => {
      const store = useUserStore()

      expect(store.profile.prefs.travelStyle).toEqual([])
      expect(store.profile.prefs.budget).toBe('mid')
      expect(store.profile.prefs.groupType).toBe('solo')
      expect(store.profile.prefs.ageGroup).toBe('middle')
      expect(store.profile.prefs.tripType).toBe('holiday')
      expect(store.profile.prefs.interests).toEqual([])
      expect(store.profile.prefs.nationality).toBe('')
    })

    it('should start with isPro false', () => {
      const store = useUserStore()
      expect(store.profile.isPro).toBe(false)
      expect(store.isPro).toBe(false)
    })

    it('should start unauthenticated', () => {
      const store = useUserStore()
      expect(store.isAuthenticated).toBe(false)
      expect(store.authUserId).toBeNull()
    })

    it('should start with empty activities', () => {
      const store = useUserStore()
      expect(store.activities).toEqual([])
    })

    it('should start with empty saved places', () => {
      const store = useUserStore()
      expect(store.savedPlaces).toEqual([])
    })
  })

  describe('hasProfile computed', () => {
    it('should return false when nationality is empty', () => {
      const store = useUserStore()
      store.updatePreferences({ travelStyle: ['adventure'] })

      expect(store.hasProfile).toBe(false)
    })

    it('should return false when travelStyle is empty', () => {
      const store = useUserStore()
      store.updatePreferences({ nationality: 'US' })

      expect(store.hasProfile).toBe(false)
    })

    it('should return true when both nationality and travelStyle are set', () => {
      const store = useUserStore()
      store.updatePreferences({
        nationality: 'US',
        travelStyle: ['adventure'],
      })

      expect(store.hasProfile).toBe(true)
    })

    it('should return true with multiple travel styles', () => {
      const store = useUserStore()
      store.updatePreferences({
        nationality: 'UK',
        travelStyle: ['adventure', 'culture', 'relaxation'],
      })

      expect(store.hasProfile).toBe(true)
    })
  })

  describe('displayName computed', () => {
    it('should return name if set', () => {
      const store = useUserStore()
      store.setProfile({ name: 'John Doe' })

      expect(store.displayName).toBe('John Doe')
    })

    it('should extract username from email if no name', () => {
      const store = useUserStore()
      store.setProfile({ email: 'john.doe@example.com' })

      expect(store.displayName).toBe('john.doe')
    })

    it('should return Traveler as fallback', () => {
      const store = useUserStore()

      expect(store.displayName).toBe('Traveler')
    })

    it('should prefer name over email', () => {
      const store = useUserStore()
      store.setProfile({ name: 'John', email: 'john@example.com' })

      expect(store.displayName).toBe('John')
    })
  })

  describe('updatePreferences', () => {
    it('should merge preferences', () => {
      const store = useUserStore()
      store.updatePreferences({ nationality: 'US' })
      store.updatePreferences({ budget: 'luxury' })

      expect(store.profile.prefs.nationality).toBe('US')
      expect(store.profile.prefs.budget).toBe('luxury')
    })

    it('should preserve existing preferences', () => {
      const store = useUserStore()
      store.updatePreferences(backpackerPrefs)
      store.updatePreferences({ budget: 'luxury' })

      expect(store.profile.prefs.nationality).toBe('US')
      expect(store.profile.prefs.travelStyle).toEqual(['adventure', 'culture'])
      expect(store.profile.prefs.budget).toBe('luxury')
    })

    it('should persist to localStorage', () => {
      const store = useUserStore()
      store.updatePreferences({ nationality: 'US' })

      expect(localStorageMock.setItem).toHaveBeenCalled()
      const saved = JSON.parse(localStorageMock.store['user-profile'])
      expect(saved.prefs.nationality).toBe('US')
    })
  })

  describe('setProfile', () => {
    it('should set profile properties', () => {
      const store = useUserStore()
      store.setProfile({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        isPro: true,
      })

      expect(store.profile.id).toBe('user-123')
      expect(store.profile.email).toBe('test@example.com')
      expect(store.profile.name).toBe('Test User')
      expect(store.profile.isPro).toBe(true)
    })

    it('should merge with existing profile', () => {
      const store = useUserStore()
      store.updatePreferences({ nationality: 'US' })
      store.setProfile({ name: 'Test' })

      expect(store.profile.name).toBe('Test')
      expect(store.profile.prefs.nationality).toBe('US')
    })
  })

  describe('setPro', () => {
    it('should set Pro status to true', () => {
      const store = useUserStore()
      store.setPro(true)

      expect(store.profile.isPro).toBe(true)
      expect(store.isPro).toBe(true)
    })

    it('should set Pro status to false', () => {
      const store = useUserStore()
      store.setPro(true)
      store.setPro(false)

      expect(store.profile.isPro).toBe(false)
      expect(store.isPro).toBe(false)
    })

    it('should persist to localStorage', () => {
      const store = useUserStore()
      store.setPro(true)

      const saved = JSON.parse(localStorageMock.store['user-profile'])
      expect(saved.isPro).toBe(true)
    })
  })

  describe('authentication', () => {
    it('should set auth user with all details', () => {
      const store = useUserStore()
      store.setAuthUser('user-123', 'test@example.com', 'Test User')

      expect(store.authUserId).toBe('user-123')
      expect(store.isAuthenticated).toBe(true)
      expect(store.profile.email).toBe('test@example.com')
      expect(store.profile.name).toBe('Test User')
    })

    it('should set auth user with only userId', () => {
      const store = useUserStore()
      store.setAuthUser('user-123')

      expect(store.authUserId).toBe('user-123')
      expect(store.isAuthenticated).toBe(true)
    })

    it('should clear auth user', () => {
      const store = useUserStore()
      store.setAuthUser('user-123', 'test@example.com')
      store.clearAuthUser()

      expect(store.authUserId).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })

    it('should set authenticated status', () => {
      const store = useUserStore()
      store.setAuthenticated(true)

      expect(store.isAuthenticated).toBe(true)
    })
  })

  describe('activities', () => {
    it('should add activity with generated id and timestamp', () => {
      const store = useUserStore()

      store.addActivity({
        userId: 'user-123',
        action: 'visa_wizard_start',
        metadata: { step: 1 },
      })

      expect(store.activities.length).toBe(1)
      expect(store.activities[0].id).toMatch(/^test-uuid-/)
      expect(store.activities[0].createdAt).toBeInstanceOf(Date)
      expect(store.activities[0].action).toBe('visa_wizard_start')
      expect(store.activities[0].metadata).toEqual({ step: 1 })
    })

    it('should prepend new activities (most recent first)', () => {
      const store = useUserStore()

      store.addActivity({
        userId: 'user-123',
        action: 'visa_wizard_start',
        metadata: {},
      })
      store.addActivity({
        userId: 'user-123',
        action: 'ai_query',
        metadata: { query: 'test' },
      })

      expect(store.activities[0].action).toBe('ai_query')
      expect(store.activities[1].action).toBe('visa_wizard_start')
    })

    it('should limit activities to 50', () => {
      const store = useUserStore()

      for (let i = 0; i < 60; i++) {
        store.addActivity({
          userId: 'user-123',
          action: 'ai_query',
          metadata: { query: `Query ${i}` },
        })
      }

      expect(store.activities.length).toBe(50)
    })

    it('should keep most recent activities when truncating', () => {
      const store = useUserStore()

      for (let i = 0; i < 60; i++) {
        store.addActivity({
          userId: 'user-123',
          action: 'ai_query',
          metadata: { index: i },
        })
      }

      // Most recent (index 59) should be first
      expect(store.activities[0].metadata.index).toBe(59)
      // Oldest kept (index 10) should be last
      expect(store.activities[49].metadata.index).toBe(10)
    })
  })

  describe('clearProfile', () => {
    it('should reset profile to defaults', () => {
      const store = useUserStore()
      store.setProfile({
        id: 'user-123',
        name: 'Test',
        email: 'test@example.com',
        isPro: true,
      })
      store.updatePreferences(backpackerPrefs)

      store.clearProfile()

      expect(store.profile.prefs).toEqual(defaultPreferences)
      expect(store.profile.isPro).toBe(false)
      expect(store.profile.name).toBeUndefined()
      expect(store.profile.email).toBeUndefined()
    })

    it('should clear authentication', () => {
      const store = useUserStore()
      store.setAuthUser('user-123')

      store.clearProfile()

      expect(store.isAuthenticated).toBe(false)
    })

    it('should clear activities', () => {
      const store = useUserStore()
      store.addActivity({
        userId: 'user-123',
        action: 'ai_query',
        metadata: {},
      })

      store.clearProfile()

      expect(store.activities).toEqual([])
    })

    it('should remove from localStorage', () => {
      const store = useUserStore()
      store.updatePreferences({ nationality: 'US' })

      store.clearProfile()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user-profile')
    })
  })

  describe('favorites', () => {
    it('should toggle saved place (add)', () => {
      const store = useUserStore()

      store.toggleSavedPlace('phuket')

      expect(store.savedPlaces).toContain('phuket')
    })

    it('should toggle saved place (remove)', () => {
      const store = useUserStore()
      store.toggleSavedPlace('phuket')

      store.toggleSavedPlace('phuket')

      expect(store.savedPlaces).not.toContain('phuket')
    })

    it('should check if place is saved', () => {
      const store = useUserStore()
      store.toggleSavedPlace('phuket')

      expect(store.isPlaceSaved('phuket')).toBe(true)
      expect(store.isPlaceSaved('chiang-mai')).toBe(false)
    })

    it('should return count of saved places', () => {
      const store = useUserStore()
      store.toggleSavedPlace('phuket')
      store.toggleSavedPlace('chiang-mai')
      store.toggleSavedPlace('krabi')

      expect(store.savedPlaces.length).toBe(3)
    })

    it('should persist favorites to localStorage', () => {
      const store = useUserStore()
      store.toggleSavedPlace('phuket')

      const saved = JSON.parse(localStorageMock.store['user-profile'])
      expect(saved.savedPlaces).toContain('phuket')
    })

    it('should initialize savedPlaces array if undefined', () => {
      const store = useUserStore()
      // Directly set profile without savedPlaces
      store.setProfile({ name: 'Test' })

      store.toggleSavedPlace('phuket')

      expect(store.savedPlaces).toContain('phuket')
    })
  })

  describe('localStorage persistence', () => {
    it('should load profile from localStorage on creation', () => {
      localStorageMock.store['user-profile'] = JSON.stringify({
        prefs: { nationality: 'US', travelStyle: ['adventure'] },
        isPro: true,
        name: 'Saved User',
      })

      // Create new store (simulates app reload)
      setActivePinia(createPinia())
      const store = useUserStore()

      expect(store.profile.prefs.nationality).toBe('US')
      expect(store.profile.prefs.travelStyle).toEqual(['adventure'])
      expect(store.profile.isPro).toBe(true)
      expect(store.profile.name).toBe('Saved User')
    })

    it('should merge saved prefs with defaults', () => {
      localStorageMock.store['user-profile'] = JSON.stringify({
        prefs: { nationality: 'US' },
        // Missing other fields
      })

      setActivePinia(createPinia())
      const store = useUserStore()

      // Saved value
      expect(store.profile.prefs.nationality).toBe('US')
      // Default values for missing fields
      expect(store.profile.prefs.budget).toBe('mid')
      expect(store.profile.prefs.groupType).toBe('solo')
    })

    it('should handle invalid JSON in localStorage', () => {
      localStorageMock.store['user-profile'] = 'invalid-json{'

      setActivePinia(createPinia())
      const store = useUserStore()

      // Should use defaults
      expect(store.profile.prefs.nationality).toBe('')
    })

    it('should handle empty localStorage', () => {
      setActivePinia(createPinia())
      const store = useUserStore()

      expect(store.profile.prefs).toEqual(defaultPreferences)
    })
  })
})
