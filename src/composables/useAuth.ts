import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useApi } from './useApi'
import { authClient } from '@/lib/auth'

interface NeonUser {
  id: string
  email: string
  name?: string
  image?: string
}

// Pure navigation helpers — no composable state needed, so they're exported
// standalone. Importing them directly (rather than destructuring from
// useAuth()) avoids triggering useAuth's onMounted checkSession() a second
// time in components that just need to redirect to sign-in/sign-up (App.vue
// already calls useAuth() once at the root for the real session check).
export function signIn(redirectUrl?: string) {
  const url = redirectUrl ? `/auth/sign-in?redirect=${encodeURIComponent(redirectUrl)}` : '/auth/sign-in'
  window.location.href = url
}

export function signUp(redirectUrl?: string) {
  const url = redirectUrl ? `/auth/sign-up?redirect=${encodeURIComponent(redirectUrl)}` : '/auth/sign-up'
  window.location.href = url
}

export function useAuth() {
  const userStore = useUserStore()
  const { post, put } = useApi()
  const isLoading = ref(true)
  const currentUser = ref<NeonUser | null>(null)

  const isSignedIn = computed(() => !!currentUser.value)

  async function checkSession() {
    isLoading.value = true
    try {
      const result = await authClient.getSession()
      if (result.data?.user) {
        const user = result.data.user as NeonUser
        currentUser.value = user
        userStore.setAuthUser(user.id, user.email, user.name)
        await syncProfile()
      } else {
        currentUser.value = null
        userStore.clearAuthUser()
      }
    } catch (error) {
      console.error('Failed to check session:', error)
      currentUser.value = null
    } finally {
      isLoading.value = false
    }
  }

  async function syncProfile() {
    if (!userStore.authUserId) return

    try {
      await post('/user', {
        email: userStore.profile.email,
        prefs: userStore.profile.prefs,
      })
    } catch (error) {
      console.error('Failed to sync profile:', error)
    }
  }

  async function savePreferences() {
    if (!userStore.authUserId) return

    try {
      await put('/user', {
        prefs: userStore.profile.prefs,
      })
    } catch (error) {
      console.error('Failed to save preferences:', error)
    }
  }

  async function signOut() {
    try {
      await authClient.signOut()
      currentUser.value = null
      userStore.clearProfile()
      window.location.href = '/'
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  onMounted(() => {
    checkSession()
  })

  return {
    isLoading,
    isSignedIn,
    currentUser,
    signIn,
    signUp,
    signOut,
    syncProfile,
    savePreferences,
    checkSession,
  }
}
