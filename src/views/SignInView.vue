<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { authClient } from '@/lib/auth'
import { useAuth } from '@/composables/useAuth'
import { LoadingOutlined, MailOutlined, LockOutlined } from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()
const { checkSession } = useAuth()

const email = ref('')
const password = ref('')
const submitting = ref(false)
const errorMsg = ref('')

const redirectTo = computed(() => {
  const r = route.query.redirect
  return typeof r === 'string' && r.startsWith('/') ? r : '/dashboard'
})

async function handleSubmit() {
  if (submitting.value) return
  errorMsg.value = ''
  submitting.value = true

  try {
    // SDK is loosely typed without explicit adapter — use Better Auth's signIn.email shape
    const signInWithEmail = (authClient.signIn as unknown as { email: (data: { email: string; password: string }) => Promise<{ data?: unknown; error?: { message?: string } | null }> }).email
    const result = await signInWithEmail({
      email: email.value,
      password: password.value,
    })

    if (result.error) {
      errorMsg.value = result.error.message || 'Sign in failed. Please check your email and password.'
      return
    }

    await checkSession()
    router.replace(redirectTo.value)
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : 'Sign in failed. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-primary-50/30 to-white flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <div class="text-center mb-6">
        <RouterLink to="/" class="inline-flex items-center gap-2 mb-4">
          <span class="text-3xl">🌴</span>
          <span class="text-xl font-display font-bold text-gray-900">HappyRoam</span>
        </RouterLink>
        <h1 class="text-2xl font-display font-bold text-gray-900">Welcome back</h1>
        <p class="text-gray-600 mt-1">Sign in to continue planning your Thailand trip</p>
      </div>

      <div class="card-thai p-6 sm:p-8">
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div class="relative">
              <MailOutlined class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="email"
                v-model="email"
                type="email"
                autocomplete="email"
                required
                class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div class="relative">
              <LockOutlined class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="password"
                v-model="password"
                type="password"
                autocomplete="current-password"
                required
                minlength="8"
                class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <p v-if="errorMsg" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {{ errorMsg }}
          </p>

          <button
            type="submit"
            :disabled="submitting"
            class="btn-thai w-full justify-center disabled:opacity-60"
          >
            <LoadingOutlined v-if="submitting" class="animate-spin" />
            <span>{{ submitting ? 'Signing in...' : 'Sign in' }}</span>
          </button>
        </form>
      </div>

      <p class="text-center text-sm text-gray-600 mt-6">
        Don't have an account?
        <RouterLink
          :to="{ path: '/auth/sign-up', query: route.query }"
          class="text-primary-600 hover:text-primary-700 font-medium"
        >
          Create one
        </RouterLink>
      </p>
    </div>
  </div>
</template>
