<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@stores/userStore'
import { useSubscription } from '@composables/useSubscription'

defineProps<{
  featureName: string
}>()

const router = useRouter()
const userStore = useUserStore()
const { startCheckout, loading } = useSubscription()

const proFeatures = [
  'AI Itinerary Planner — multi-day plans, ICS & PDF export',
  'AI Packing Lists — weather + activity-aware',
  'Unlimited AI usage — no daily limits',
  'Smart Match favorites',
  'Onward Tickets — 2 free bookings/month',
  'Travel Alerts dashboard',
]
</script>

<template>
  <!-- Pass through slot content when user is Pro -->
  <slot v-if="userStore.isPro" />

  <!-- Upgrade screen for non-Pro users -->
  <div
    v-else
    class="flex flex-col items-center justify-center min-h-[60vh] px-6 py-12 text-center"
  >
    <div class="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
      <!-- Gradient header -->
      <div class="bg-gradient-to-br from-primary-500 to-accent-500 p-8 text-white">
        <div class="text-5xl mb-4">🔒</div>
        <h2 class="text-2xl font-bold mb-2">Pro Feature</h2>
        <p class="text-white/80 text-sm">
          {{ featureName }} is available with a Pro subscription.
        </p>
      </div>

      <!-- Benefits list -->
      <div class="p-8">
        <p class="text-gray-600 text-sm font-medium mb-4 uppercase tracking-wide">
          What you get with Pro
        </p>
        <ul class="space-y-3 mb-8 text-left">
          <li
            v-for="benefit in proFeatures"
            :key="benefit"
            class="flex items-center gap-3 text-gray-700"
          >
            <span class="w-5 h-5 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0">
              <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span class="text-sm font-medium">{{ benefit }}</span>
          </li>
        </ul>

        <!-- CTA button -->
        <button
          @click="startCheckout"
          :disabled="loading"
          class="w-full py-4 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-bold rounded-2xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
        >
          {{ loading ? 'Loading...' : 'Start 7-Day Free Trial' }}
        </button>

        <p class="text-gray-400 text-xs mt-3 mb-6">
          $10/month after trial &bull; Cancel anytime
        </p>

        <!-- Go back link -->
        <button
          @click="router.back()"
          class="text-gray-500 text-sm hover:text-gray-700 underline underline-offset-2 transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  </div>
</template>
