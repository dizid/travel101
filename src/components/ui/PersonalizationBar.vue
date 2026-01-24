<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useUserStore } from '@stores/userStore'
import {
  EditOutlined,
  CloseOutlined,
  CheckOutlined,
} from '@ant-design/icons-vue'

defineProps<{
  isEnabled: boolean
  context?: 'attractions' | 'heritage' | 'festivals'
}>()

const emit = defineEmits<{
  toggle: [value: boolean]
  edit: []
}>()

const userStore = useUserStore()

// Onboarding tooltip
const showTooltip = ref(false)
const tooltipDismissed = ref(false)

onMounted(() => {
  // Show tooltip for first-time users without profile
  const hasSeenTooltip = localStorage.getItem('personalization-tooltip-seen')
  if (!hasSeenTooltip && !userStore.hasProfile) {
    setTimeout(() => {
      showTooltip.value = true
      // Auto-hide after 6 seconds
      setTimeout(() => {
        dismissTooltip()
      }, 6000)
    }, 1000)
  }
})

// Hide tooltip when user completes profile
watch(() => userStore.hasProfile, (hasProfile) => {
  if (hasProfile && showTooltip.value) {
    dismissTooltip()
  }
})

function dismissTooltip() {
  showTooltip.value = false
  tooltipDismissed.value = true
  localStorage.setItem('personalization-tooltip-seen', 'true')
}

// Human-readable preference labels
const preferenceLabels: Record<string, Record<string, string>> = {
  interests: {
    beach: 'Beach lover',
    nightlife: 'Nightlife fan',
    temples: 'Temple explorer',
    food: 'Foodie',
    shopping: 'Shopper',
    nature: 'Nature seeker',
    wellness: 'Wellness focused',
  },
  travelStyle: {
    party: 'Party goer',
    adventure: 'Adventure seeker',
    relaxation: 'Relaxation',
    culture: 'Culture buff',
  },
  groupType: {
    solo: 'Solo traveler',
    couple: 'Couple',
    family: 'Family',
    friends: 'Friends group',
  },
  budget: {
    budget: 'Budget-friendly',
    mid: 'Mid-range',
    luxury: 'Luxury',
  },
  tripType: {
    holiday: 'Holiday',
    expat: 'Expat',
    digital_nomad: 'Digital nomad',
  },
}

// Get top 4 active preference tags
const activeTags = computed(() => {
  const prefs = userStore.profile.prefs
  const tags: string[] = []

  // Add interests (priority)
  prefs.interests.slice(0, 2).forEach(i => {
    if (preferenceLabels.interests[i]) {
      tags.push(preferenceLabels.interests[i])
    }
  })

  // Add travel style
  prefs.travelStyle.slice(0, 1).forEach(s => {
    if (preferenceLabels.travelStyle[s]) {
      tags.push(preferenceLabels.travelStyle[s])
    }
  })

  // Add group type
  if (prefs.groupType && preferenceLabels.groupType[prefs.groupType]) {
    tags.push(preferenceLabels.groupType[prefs.groupType])
  }

  return tags.slice(0, 4)
})

// Profile completeness
const profileProgress = computed(() => {
  const prefs = userStore.profile.prefs
  let score = 0
  if (prefs.nationality) score += 25
  if (prefs.travelStyle.length > 0) score += 25
  if (prefs.interests.length > 0) score += 25
  if (prefs.tripType) score += 25
  return score
})
</script>

<template>
  <div class="sticky top-16 md:top-20 z-40">
    <!-- Main bar -->
    <div
      class="relative overflow-hidden transition-all duration-300"
      :class="[
        userStore.hasProfile && isEnabled
          ? 'bg-gradient-to-r from-rose-50 via-coral-50 to-amber-50 border-b border-rose-100'
          : 'bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100'
      ]"
    >
      <!-- Subtle pattern overlay -->
      <div
        class="absolute inset-0 opacity-[0.03]"
        style="background-image: url(&quot;data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E&quot;);"
      />

      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-3 relative">
        <!-- Has profile + personalization enabled -->
        <div v-if="userStore.hasProfile && isEnabled" class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3 min-w-0">
            <!-- Sparkle icon with glow -->
            <div class="relative flex-shrink-0">
              <span class="text-lg">✨</span>
              <span class="absolute inset-0 animate-ping text-lg opacity-30">✨</span>
            </div>

            <!-- Text + tags -->
            <div class="flex items-center gap-2 flex-wrap min-w-0">
              <span class="text-sm font-medium text-gray-700 whitespace-nowrap">
                Personalized for you
              </span>
              <span class="text-gray-300 hidden sm:inline">·</span>
              <div class="hidden sm:flex items-center gap-1.5 flex-wrap">
                <span
                  v-for="tag in activeTags"
                  :key="tag"
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/80 text-rose-700 border border-rose-200/50 shadow-sm"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <button
              @click="emit('edit')"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white/60 rounded-lg transition-colors"
            >
              <EditOutlined class="text-xs" />
              <span class="hidden sm:inline">Edit</span>
            </button>
            <button
              @click="emit('toggle', false)"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-white/60 rounded-lg transition-colors"
              title="Turn off personalization"
            >
              <CloseOutlined class="text-xs" />
              <span class="hidden sm:inline">Off</span>
            </button>
          </div>
        </div>

        <!-- Has profile but personalization disabled -->
        <div v-else-if="userStore.hasProfile && !isEnabled" class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <span class="text-lg opacity-50">🎯</span>
            <span class="text-sm text-gray-600">
              Personalized results are turned off
            </span>
          </div>

          <button
            @click="emit('toggle', true)"
            class="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-coral-500 hover:from-rose-600 hover:to-coral-600 rounded-lg shadow-sm transition-all hover:shadow"
          >
            <CheckOutlined class="text-xs" />
            Turn On
          </button>
        </div>

        <!-- No profile yet -->
        <div v-else class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3 min-w-0">
            <div class="relative flex-shrink-0">
              <!-- Progress ring -->
              <svg class="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18" cy="18" r="15"
                  fill="none"
                  stroke="#e5e7eb"
                  stroke-width="3"
                />
                <circle
                  cx="18" cy="18" r="15"
                  fill="none"
                  stroke="url(#progress-gradient)"
                  stroke-width="3"
                  stroke-linecap="round"
                  :stroke-dasharray="`${profileProgress * 0.94} 100`"
                  class="transition-all duration-500"
                />
                <defs>
                  <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#f43f5e" />
                    <stop offset="100%" stop-color="#fb923c" />
                  </linearGradient>
                </defs>
              </svg>
              <span class="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-600">
                {{ profileProgress }}%
              </span>
            </div>

            <div class="min-w-0">
              <p class="text-sm font-medium text-gray-700">
                Complete your profile for personalized recommendations
              </p>
              <p class="text-xs text-gray-500 hidden sm:block">
                We'll match places to your travel style and interests
              </p>
            </div>
          </div>

          <RouterLink
            to="/profile"
            class="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-coral-500 hover:from-rose-600 hover:to-coral-600 rounded-lg shadow-sm transition-all hover:shadow flex-shrink-0"
          >
            Set Up Profile
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Onboarding tooltip -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="showTooltip && !userStore.hasProfile"
        class="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50"
      >
        <div class="relative bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl max-w-sm">
          <!-- Arrow -->
          <div class="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-900 rotate-45" />

          <div class="relative">
            <button
              @click="dismissTooltip"
              class="absolute -top-1 -right-1 p-1 text-gray-400 hover:text-white transition-colors"
            >
              <CloseOutlined class="text-xs" />
            </button>

            <p class="text-sm font-medium pr-4">
              ✨ New! Personalized recommendations
            </p>
            <p class="text-xs text-gray-300 mt-1">
              Complete your profile to see places matched to your travel style, interests, and budget.
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Custom coral color (between rose and orange) */
.from-coral-50 {
  --tw-gradient-from: #fff7ed;
}
.to-coral-500 {
  --tw-gradient-to: #f97316;
}
.from-coral-500 {
  --tw-gradient-from: #f97316;
}
.hover\:to-coral-600:hover {
  --tw-gradient-to: #ea580c;
}
.hover\:from-coral-600:hover {
  --tw-gradient-from: #ea580c;
}
</style>
