<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { CloseOutlined, GiftOutlined, CheckCircleFilled } from '@ant-design/icons-vue'

const isVisible = ref(false)
const email = ref('')
const isSubmitting = ref(false)
const isSuccess = ref(false)
const error = ref('')

// Tracks whether the user has been on the page long enough to see the popup
const canShow = ref(false)

const STORAGE_KEY = 'exitPopupDismissed'
const DISMISS_COUNT_KEY = 'exitPopupDismissCount'
const MAX_DISMISSALS = 3
const DISMISS_DURATION_SHORT = 24 * 60 * 60 * 1000 // 24h — close button
const DISMISS_DURATION_LONG = 3 * 24 * 60 * 60 * 1000 // 72h — "Maybe Later"

function shouldShow(): boolean {
  // Stop showing after 3 dismissals
  const count = parseInt(localStorage.getItem(DISMISS_COUNT_KEY) || '0', 10)
  if (count >= MAX_DISMISSALS) return false

  const dismissed = localStorage.getItem(STORAGE_KEY)
  if (!dismissed) return true
  const dismissedAt = parseInt(dismissed, 10)
  // Default to 24h cooldown; duration written at dismiss time determines when it expires
  return Date.now() - dismissedAt > DISMISS_DURATION_SHORT
}

function incrementDismissCount() {
  const count = parseInt(localStorage.getItem(DISMISS_COUNT_KEY) || '0', 10)
  localStorage.setItem(DISMISS_COUNT_KEY, (count + 1).toString())
}

function handleMouseLeave(e: MouseEvent) {
  // Don't trigger on mobile — no mouse exit events are meaningful there
  if (window.innerWidth < 768) return
  // Only trigger on actual viewport exit (mouse leaves through the top)
  if (e.clientY <= 0 && canShow.value && shouldShow() && !isVisible.value) {
    isVisible.value = true
  }
}

function close() {
  isVisible.value = false
  incrementDismissCount()
  localStorage.setItem(STORAGE_KEY, Date.now().toString())
}

function maybeLater() {
  isVisible.value = false
  incrementDismissCount()
  // Store a timestamp offset by the difference between short and long durations
  // so shouldShow() (which subtracts DISMISS_DURATION_SHORT) correctly waits 72h
  const effectiveTimestamp = Date.now() + (DISMISS_DURATION_LONG - DISMISS_DURATION_SHORT)
  localStorage.setItem(STORAGE_KEY, effectiveTimestamp.toString())
}

async function handleSubmit() {
  if (!email.value || isSubmitting.value) return

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    error.value = 'Please enter a valid email'
    return
  }

  isSubmitting.value = true
  error.value = ''

  try {
    const response = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.value,
        source: 'exit-intent',
        leadMagnet: 'packing-checklist'
      })
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to subscribe')
    }

    isSuccess.value = true
    localStorage.setItem(STORAGE_KEY, Date.now().toString())
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Something went wrong'
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  document.addEventListener('mouseleave', handleMouseLeave)
  // Require 30 seconds on page before popup can show
  setTimeout(() => { canShow.value = true }, 30000)
})

onUnmounted(() => {
  document.removeEventListener('mouseleave', handleMouseLeave)
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isVisible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="close"
      >
        <Transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="isVisible"
            class="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <!-- Close controls: Maybe Later + X -->
            <div class="absolute top-4 right-4 flex items-center gap-2 z-10">
              <button
                @click="maybeLater"
                class="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1"
              >
                Maybe Later
              </button>
              <button
                @click="close"
                class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
              >
                <CloseOutlined />
              </button>
            </div>

            <!-- Success state -->
            <div v-if="isSuccess" class="p-8 text-center">
              <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircleFilled class="text-3xl text-green-500" />
              </div>
              <h3 class="text-xl font-bold text-gray-900 mb-2">
                Check Your Inbox!
              </h3>
              <p class="text-gray-600 mb-4">
                Your free Thailand Packing Checklist is on its way. Happy travels!
              </p>
              <button
                @click="close"
                class="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
              >
                Got it!
              </button>
            </div>

            <!-- Form state -->
            <template v-else>
              <!-- Header with gradient -->
              <div class="bg-gradient-to-br from-primary-500 to-accent-500 px-6 py-8 text-white text-center">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                  <GiftOutlined class="text-3xl" />
                </div>
                <h3 class="text-2xl font-bold mb-2">
                  Wait! Free Gift Inside
                </h3>
                <p class="text-white/90">
                  Get our ultimate Thailand Packing Checklist
                </p>
              </div>

              <!-- Content -->
              <div class="p-6">
                <ul class="space-y-2 mb-6">
                  <li class="flex items-center gap-2 text-sm text-gray-600">
                    <span class="text-primary-500">✓</span>
                    What to pack for every season
                  </li>
                  <li class="flex items-center gap-2 text-sm text-gray-600">
                    <span class="text-primary-500">✓</span>
                    Temple dress code essentials
                  </li>
                  <li class="flex items-center gap-2 text-sm text-gray-600">
                    <span class="text-primary-500">✓</span>
                    Beach & island must-haves
                  </li>
                  <li class="flex items-center gap-2 text-sm text-gray-600">
                    <span class="text-primary-500">✓</span>
                    Digital nomad gear guide
                  </li>
                </ul>

                <form @submit.prevent="handleSubmit" class="space-y-3">
                  <input
                    v-model="email"
                    type="email"
                    placeholder="Your email address"
                    class="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                    :disabled="isSubmitting"
                  />
                  <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
                  <button
                    type="submit"
                    :disabled="isSubmitting"
                    class="w-full py-3 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white font-semibold rounded-lg shadow-lg shadow-primary-500/25 transition-all disabled:opacity-50"
                  >
                    {{ isSubmitting ? 'Sending...' : 'Send Me The Checklist' }}
                  </button>
                </form>

                <p class="text-xs text-gray-400 text-center mt-4">
                  No spam, ever. Unsubscribe anytime.
                </p>
              </div>
            </template>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
