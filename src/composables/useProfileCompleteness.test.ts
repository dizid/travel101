import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProfileCompleteness } from './useProfileCompleteness'
import { useUserStore } from '@/stores/userStore'

describe('useProfileCompleteness', () => {
  let userStore: ReturnType<typeof useUserStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    userStore = useUserStore()
  })

  it('should count the default tripType as complete (25%) with nothing else filled in', () => {
    // Default prefs ship with tripType: 'holiday' (truthy), everything else empty.
    const { profileCompleteness } = useProfileCompleteness()
    expect(profileCompleteness.value).toBe(25)
  })

  it('should reach 100% once nationality, travelStyle, and interests are also filled in', () => {
    userStore.updatePreferences({ nationality: 'US' })
    let { profileCompleteness } = useProfileCompleteness()
    expect(profileCompleteness.value).toBe(50)

    userStore.updatePreferences({ travelStyle: ['adventure'] })
    ;({ profileCompleteness } = useProfileCompleteness())
    expect(profileCompleteness.value).toBe(75)

    userStore.updatePreferences({ interests: ['temples'] })
    ;({ profileCompleteness } = useProfileCompleteness())
    expect(profileCompleteness.value).toBe(100)
  })

  it('should update reactively as the store changes', () => {
    const { profileCompleteness } = useProfileCompleteness()
    expect(profileCompleteness.value).toBe(25)

    userStore.updatePreferences({ nationality: 'GB', travelStyle: ['culture'], interests: ['food'] })
    expect(profileCompleteness.value).toBe(100)
  })

  it('should not count empty arrays or empty strings as complete', () => {
    userStore.updatePreferences({ nationality: '', travelStyle: [], interests: [] })
    const { profileCompleteness } = useProfileCompleteness()
    expect(profileCompleteness.value).toBe(25)
  })
})
