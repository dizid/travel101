<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { CloseOutlined, GiftOutlined, CheckCircleFilled } from '@ant-design/icons-vue'

const isVisible = ref(false)
const email = ref('')
const isSubmitting = ref(false)
const isSuccess = ref(false)
const error = ref('')

const STORAGE_KEY = 'exitPopupDismissed'
const DISMISS_DURATION = 24 * 60 * 60 * 1000 // 24 hours

function shouldShow(): boolean {
  const dismissed = localStorage.getItem(STORAGE_KEY)
  if (!dismissed) return true
  const dismissedAt = parseInt(dismissed, 10)
  return Date.now() - dismissedAt > DISMISS_DURATION
}

function handleMouseLeave(e: MouseEvent) {
  // Only trigger when mouse moves to top of viewport
  if (e.clientY <= 5 && shouldShow() && !isVisible.value) {
    isVisible.value = true
  }
}

function close() {
  isVisible.value = false
  localStorage.setItem(STORAGE_KEY, Date.now().toString())
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
            <!-- Close button -->
            <button
              @click="close"
              class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors z-10"
            >
              <CloseOutlined />
            </button>

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
