import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuth } from './useAuth'
import { useUserStore } from '@/stores/userStore'
import { mockFetch, createMockResponse, mockLocation } from '@/test/setup'
import { authClient } from '@/lib/auth'

// Mock the auth client
vi.mock('@/lib/auth', () => ({
  authClient: {
    getSession: vi.fn(),
    signOut: vi.fn(),
  },
}))

describe('useAuth', () => {
  let userStore: ReturnType<typeof useUserStore>
  const mockAuthClient = authClient as {
    getSession: ReturnType<typeof vi.fn>
    signOut: ReturnType<typeof vi.fn>
  }

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    image: 'https://example.com/avatar.jpg',
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    userStore = useUserStore()
    vi.clearAllMocks()
    mockLocation.href = ''
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('checkSession', () => {
    it('should set current user when session exists', async () => {
      mockAuthClient.getSession.mockResolvedValueOnce({
        data: { user: mockUser },
      })
      mockFetch.mockResolvedValueOnce(createMockResponse({ success: true }))

      const { checkSession, currentUser, isSignedIn, isLoading } = useAuth()
      await checkSession()

      expect(currentUser.value).toEqual(mockUser)
      expect(isSignedIn.value).toBe(true)
      expect(isLoading.value).toBe(false)
    })

    it('should sync user to store when session exists', async () => {
      mockAuthClient.getSession.mockResolvedValueOnce({
        data: { user: mockUser },
      })
      mockFetch.mockResolvedValueOnce(createMockResponse({ success: true }))

      const { checkSession } = useAuth()
      await checkSession()

      expect(userStore.authUserId).toBe('user-123')
      expect(userStore.profile.email).toBe('test@example.com')
    })

    it('should clear user when no session', async () => {
      mockAuthClient.getSession.mockResolvedValueOnce({
        data: { user: null },
      })

      const { checkSession, currentUser, isSignedIn } = useAuth()
      await checkSession()

      expect(currentUser.value).toBeNull()
      expect(isSignedIn.value).toBe(false)
    })

    it('should handle session check error gracefully', async () => {
      mockAuthClient.getSession.mockRejectedValueOnce(new Error('Network error'))

      const { checkSession, currentUser, isLoading } = useAuth()
      await checkSession()

      expect(currentUser.value).toBeNull()
      expect(isLoading.value).toBe(false)
    })
  })

  describe('syncProfile', () => {
    it('should sync profile to backend when user is signed in', async () => {
      mockAuthClient.getSession.mockResolvedValueOnce({
        data: { user: mockUser },
      })
      mockFetch.mockResolvedValueOnce(createMockResponse({ success: true }))

      const { checkSession, syncProfile } = useAuth()
      await checkSession()

      mockFetch.mockResolvedValueOnce(createMockResponse({ success: true }))
      await syncProfile()

      // Should have called POST /user
      const postCalls = mockFetch.mock.calls.filter(
        (call) => JSON.parse(call[1]?.body || '{}').email !== undefined
      )
      expect(postCalls.length).toBeGreaterThan(0)
    })

    it('should not sync when user is not signed in', async () => {
      mockAuthClient.getSession.mockResolvedValueOnce({
        data: { user: null },
      })

      const { checkSession, syncProfile } = useAuth()
      await checkSession()
      mockFetch.mockClear()

      await syncProfile()

      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('savePreferences', () => {
    it('should save preferences to backend', async () => {
      mockAuthClient.getSession.mockResolvedValueOnce({
        data: { user: mockUser },
      })
      mockFetch.mockResolvedValueOnce(createMockResponse({ success: true }))

      const { checkSession, savePreferences } = useAuth()
      await checkSession()

      mockFetch.mockResolvedValueOnce(createMockResponse({ success: true }))
      userStore.updatePreferences({ nationality: 'US' })
      await savePreferences()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/user'),
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('prefs'),
        })
      )
    })

    it('should not save when user is not signed in', async () => {
      const { savePreferences } = useAuth()
      await savePreferences()

      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('signIn', () => {
    it('should redirect to sign-in page', () => {
      const { signIn } = useAuth()
      signIn()

      expect(mockLocation.href).toBe('/auth/sign-in')
    })

    it('should include redirect URL when provided', () => {
      const { signIn } = useAuth()
      signIn('/dashboard')

      expect(mockLocation.href).toBe('/auth/sign-in?redirect=%2Fdashboard')
    })
  })

  describe('signUp', () => {
    it('should redirect to sign-up page', () => {
      const { signUp } = useAuth()
      signUp()

      expect(mockLocation.href).toBe('/auth/sign-up')
    })

    it('should include redirect URL when provided', () => {
      const { signUp } = useAuth()
      signUp('/onboarding')

      expect(mockLocation.href).toBe('/auth/sign-up?redirect=%2Fonboarding')
    })
  })

  describe('signOut', () => {
    it('should sign out and redirect to home', async () => {
      mockAuthClient.getSession.mockResolvedValueOnce({
        data: { user: mockUser },
      })
      mockFetch.mockResolvedValueOnce(createMockResponse({ success: true }))
      mockAuthClient.signOut.mockResolvedValueOnce({})

      const { checkSession, signOut, currentUser } = useAuth()
      await checkSession()

      await signOut()

      expect(mockAuthClient.signOut).toHaveBeenCalled()
      expect(currentUser.value).toBeNull()
      expect(mockLocation.href).toBe('/')
    })

    it('should clear user store on sign out', async () => {
      mockAuthClient.getSession.mockResolvedValueOnce({
        data: { user: mockUser },
      })
      mockFetch.mockResolvedValueOnce(createMockResponse({ success: true }))
      mockAuthClient.signOut.mockResolvedValueOnce({})

      const { checkSession, signOut } = useAuth()
      await checkSession()
      userStore.updatePreferences({ nationality: 'US' })

      await signOut()

      // clearProfile sets nationality to empty string (default state)
      expect(userStore.profile.prefs.nationality).toBe('')
    })

    it('should handle sign out error gracefully', async () => {
      mockAuthClient.signOut.mockRejectedValueOnce(new Error('Sign out failed'))

      const { signOut } = useAuth()

      // Should not throw
      await signOut()

      // Redirect should not happen on error
      expect(mockLocation.href).not.toBe('/')
    })
  })

  describe('isSignedIn computed', () => {
    it('should be false when no current user', () => {
      const { isSignedIn } = useAuth()
      expect(isSignedIn.value).toBe(false)
    })

    it('should be true when current user exists', async () => {
      mockAuthClient.getSession.mockResolvedValueOnce({
        data: { user: mockUser },
      })
      mockFetch.mockResolvedValueOnce(createMockResponse({ success: true }))

      const { checkSession, isSignedIn } = useAuth()
      await checkSession()

      expect(isSignedIn.value).toBe(true)
    })
  })

  describe('isLoading state', () => {
    it('should be true initially during checkSession', async () => {
      let resolveSession: (value: unknown) => void
      const sessionPromise = new Promise((resolve) => {
        resolveSession = resolve
      })
      mockAuthClient.getSession.mockReturnValueOnce(sessionPromise)

      const { checkSession, isLoading } = useAuth()
      const checkPromise = checkSession()

      expect(isLoading.value).toBe(true)

      resolveSession!({ data: { user: null } })
      await checkPromise

      expect(isLoading.value).toBe(false)
    })
  })
})
