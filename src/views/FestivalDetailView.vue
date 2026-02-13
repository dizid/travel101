<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useFestivals } from '@/composables/useFestivals'
import type { UpcomingFestival } from '@/types'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import ShareButton from '@/components/ui/ShareButton.vue'
import {
  CalendarOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  LeftOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()

const {
  loading,
  error,
  fetchBySlug,
  getFestivalEmoji,
  getCrowdLevelColor,
  formatFestivalDate,
  getCountdownText,
  getMonthName,
} = useFestivals()

const festival = ref<UpcomingFestival | null>(null)

// Current tab for content sections
type ContentTab = 'overview' | 'activities' | 'tips' | 'locations'
const activeContentTab = ref<ContentTab>('overview')

const contentTabs: { key: ContentTab; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: '📖' },
  { key: 'activities', label: 'Activities', icon: '🎯' },
  { key: 'tips', label: 'Visitor Tips', icon: '💡' },
  { key: 'locations', label: 'Best Locations', icon: '📍' },
]

async function loadFestival() {
  const slug = route.params.slug as string
  if (!slug) {
    router.push('/festivals')
    return
  }

  const data = await fetchBySlug(slug)
  if (!data) {
    router.push('/festivals')
    return
  }

  festival.value = data
}

// Computed helpers
const displayDate = computed(() => {
  if (!festival.value) return ''
  if (festival.value.nextDate) {
    return formatFestivalDate(festival.value.nextDate, festival.value.durationDays)
  }
  if (festival.value.monthTypical) {
    return getMonthName(festival.value.monthTypical)
  }
  return 'Various dates'
})

const urgencyClass = computed(() => {
  if (!festival.value?.daysUntil) return 'bg-gray-500'
  const days = festival.value.daysUntil
  if (days <= 0) return 'bg-green-500'
  if (days <= 7) return 'bg-red-500'
  if (days <= 30) return 'bg-amber-500'
  return 'bg-blue-500'
})

const gradientClass = computed(() => {
  const type = festival.value?.festivalType
  switch (type) {
    case 'religious': return 'from-amber-500 via-orange-500 to-red-500'
    case 'cultural': return 'from-purple-500 via-pink-500 to-rose-500'
    case 'royal': return 'from-blue-500 via-indigo-500 to-purple-500'
    case 'modern': return 'from-teal-500 via-cyan-500 to-blue-500'
    case 'harvest': return 'from-green-500 via-emerald-500 to-teal-500'
    case 'water': return 'from-cyan-500 via-blue-500 to-indigo-500'
    default: return 'from-purple-500 via-pink-500 to-orange-500'
  }
})

const primaryLocation = computed(() => {
  if (!festival.value) return null
  if (festival.value.isNationwide) return 'Celebrated Nationwide'
  if (festival.value.bestLocations?.length) return festival.value.bestLocations[0]
  if (festival.value.provinces?.length) return festival.value.provinces[0]
  return festival.value.region || null
})

const typeDisplay = computed(() => {
  const type = festival.value?.festivalType
  if (!type) return null
  return type.charAt(0).toUpperCase() + type.slice(1)
})

// Watch for route changes
watch(() => route.params.slug, () => {
  loadFestival()
})

onMounted(() => {
  loadFestival()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <LoadingSpinner size="lg" />
    </div>

    <!-- Error State -->
    <div v-else-if="error || !festival" class="flex flex-col items-center justify-center min-h-screen">
      <div class="text-5xl mb-4">😕</div>
      <p class="text-gray-600 mb-4">Festival not found</p>
      <RouterLink
        to="/festivals"
        class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        Back to Festivals
      </RouterLink>
    </div>

    <!-- Festival Content -->
    <template v-else>
      <!-- Hero Section -->
      <div class="relative">
        <!-- Background -->
        <div
          class="absolute inset-0 bg-gradient-to-br"
          :class="gradientClass"
        >
          <div class="absolute inset-0 bg-black/30" />
          <!-- Decorative emoji -->
          <div class="absolute inset-0 flex items-center justify-center opacity-10">
            <span class="text-[20rem]">{{ getFestivalEmoji(festival) }}</span>
          </div>
        </div>

        <!-- Content -->
        <div class="relative max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <!-- Back Button -->
          <RouterLink
            to="/festivals"
            class="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <LeftOutlined />
            Back to Festivals
          </RouterLink>

          <div class="grid lg:grid-cols-3 gap-8">
            <!-- Main Info -->
            <div class="lg:col-span-2 text-white">
              <!-- Badges -->
              <div class="flex flex-wrap items-center gap-2 mb-4">
                <span
                  v-if="festival.isHiddenGem"
                  class="inline-flex items-center gap-1 px-3 py-1 bg-purple-600 rounded-full text-sm font-medium"
                >
                  💎 Hidden Gem
                </span>
                <span
                  v-if="typeDisplay"
                  class="inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium"
                >
                  {{ getFestivalEmoji(festival) }}
                  {{ typeDisplay }}
                </span>
                <span
                  v-if="festival.religion"
                  class="inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium capitalize"
                >
                  {{ festival.religion }}
                </span>
              </div>

              <!-- Title -->
              <h1 class="text-4xl sm:text-5xl font-bold mb-2">
                {{ festival.name }}
              </h1>

              <!-- Thai Name -->
              <p v-if="festival.nameThai" class="text-2xl text-white/80 mb-6">
                {{ festival.nameThai }}
              </p>

              <!-- Quick Info -->
              <div class="flex flex-wrap items-center gap-4 text-white/90">
                <span class="flex items-center gap-2">
                  <CalendarOutlined />
                  {{ displayDate }}
                </span>
                <span v-if="festival.durationDays > 1" class="flex items-center gap-2">
                  <ClockCircleOutlined />
                  {{ festival.durationDays }} days
                </span>
                <span v-if="primaryLocation" class="flex items-center gap-2">
                  <EnvironmentOutlined />
                  {{ primaryLocation }}
                </span>
              </div>

              <!-- Province Pills -->
              <div v-if="!festival.isNationwide && festival.provinces?.length" class="mt-4 flex flex-wrap gap-2">
                <span
                  v-for="province in festival.provinces.slice(0, 4)"
                  :key="province"
                  class="inline-flex items-center gap-1 px-2.5 py-1 bg-white/20 backdrop-blur rounded-full text-sm text-white"
                >
                  <EnvironmentOutlined class="text-xs" />
                  {{ province }}
                </span>
                <span
                  v-if="festival.provinces.length > 4"
                  class="inline-flex items-center px-2.5 py-1 bg-white/10 backdrop-blur rounded-full text-sm text-white/80"
                >
                  +{{ festival.provinces.length - 4 }} more
                </span>
              </div>
              <div v-else-if="festival.isNationwide" class="mt-4">
                <span class="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur rounded-full text-sm text-white">
                  <TeamOutlined class="text-xs" />
                  Celebrated Nationwide
                </span>
              </div>
            </div>

            <!-- Countdown Card -->
            <div class="lg:col-span-1">
              <div class="bg-white rounded-2xl shadow-xl p-6">
                <!-- Countdown -->
                <div v-if="festival.daysUntil !== undefined" class="text-center mb-6">
                  <div
                    class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-bold"
                    :class="urgencyClass"
                  >
                    <CalendarOutlined />
                    {{ getCountdownText(festival.daysUntil) }}
                  </div>
                </div>

                <!-- Quick Facts -->
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <span class="text-gray-500">Crowd Level</span>
                    <span class="flex items-center gap-2 font-medium capitalize">
                      <span
                        class="w-3 h-3 rounded-full"
                        :class="getCrowdLevelColor(festival.crowdLevel)"
                      />
                      {{ festival.crowdLevel || 'Unknown' }}
                    </span>
                  </div>

                  <div v-if="festival.foreignerFriendly" class="flex items-center justify-between">
                    <span class="text-gray-500">Tourist Friendly</span>
                    <span class="font-medium">
                      {{ '⭐'.repeat(festival.foreignerFriendly) }}
                    </span>
                  </div>

                  <div v-if="festival.dressCode" class="flex items-center justify-between">
                    <span class="text-gray-500">Dress Code</span>
                    <span class="font-medium text-sm text-right">{{ festival.dressCode }}</span>
                  </div>

                  <div v-if="festival.provinces?.length && !festival.isNationwide" class="flex items-start justify-between">
                    <span class="text-gray-500">Where</span>
                    <span class="font-medium text-sm text-right max-w-[60%]">
                      {{ festival.provinces.slice(0, 2).join(', ') }}
                      <span v-if="festival.provinces.length > 2" class="text-gray-400">
                        +{{ festival.provinces.length - 2 }}
                      </span>
                    </span>
                  </div>

                  <div v-if="festival.region" class="flex items-center justify-between">
                    <span class="text-gray-500">Region</span>
                    <span class="font-medium">{{ festival.region }}</span>
                  </div>
                </div>

                <!-- Share Button -->
                <div class="mt-6 flex justify-center">
                  <ShareButton
                    :title="festival.name"
                    :description="festival.description || `Discover the ${festival.name} festival in Thailand`"
                    :hashtags="['Thailand', 'Festival', festival.festivalType || 'Travel']"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Content Tabs -->
      <div class="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center gap-1 py-3 overflow-x-auto">
            <button
              v-for="tab in contentTabs"
              :key="tab.key"
              @click="activeContentTab = tab.key"
              class="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all"
              :class="activeContentTab === tab.key
                ? 'bg-purple-100 text-purple-700'
                : 'text-gray-600 hover:bg-gray-100'"
            >
              <span>{{ tab.icon }}</span>
              {{ tab.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div class="grid lg:grid-cols-3 gap-8">
          <!-- Main Content -->
          <div class="lg:col-span-2">
            <!-- Overview Tab -->
            <div v-if="activeContentTab === 'overview'" class="prose prose-lg max-w-none">
              <p class="text-gray-700 text-lg leading-relaxed">
                {{ festival.description }}
              </p>

              <!-- Date Information -->
              <div class="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-100">
                <h3 class="flex items-center gap-2 text-lg font-semibold text-blue-900 mb-4">
                  <CalendarOutlined />
                  Festival Dates
                </h3>
                <div class="space-y-2 text-blue-800">
                  <p>
                    <strong>Date Type:</strong>
                    {{ festival.dateType === 'lunar' ? 'Follows lunar calendar (dates vary yearly)' :
                       festival.dateType === 'fixed' ? 'Fixed date each year' : 'Variable dates' }}
                  </p>
                  <p v-if="festival.date2025">
                    <strong>2025:</strong> {{ formatFestivalDate(festival.date2025, festival.durationDays) }}
                  </p>
                  <p v-if="festival.date2026">
                    <strong>2026:</strong> {{ formatFestivalDate(festival.date2026, festival.durationDays) }}
                  </p>
                  <p v-if="festival.durationDays > 1">
                    <strong>Duration:</strong> {{ festival.durationDays }} days
                  </p>
                </div>
              </div>

              <!-- Best Locations Callout -->
              <div v-if="festival.bestLocations?.length" class="mt-8 p-6 bg-green-50 rounded-xl border border-green-100">
                <h3 class="flex items-center gap-2 text-lg font-semibold text-green-900 mb-4">
                  <EnvironmentOutlined />
                  Best Places to Experience
                </h3>
                <div class="space-y-2">
                  <div
                    v-for="(location, index) in festival.bestLocations.slice(0, 3)"
                    :key="index"
                    class="flex items-center gap-2 text-green-800"
                  >
                    <span class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-green-700">
                      {{ index + 1 }}
                    </span>
                    <span>{{ location }}</span>
                    <span v-if="index === 0" class="text-xs text-green-600 font-medium ml-1">Top Pick</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Activities Tab -->
            <div v-if="activeContentTab === 'activities'">
              <h2 class="text-2xl font-bold text-gray-900 mb-6">What to Expect</h2>

              <div v-if="festival.activities?.length" class="space-y-4">
                <div
                  v-for="(activity, index) in festival.activities"
                  :key="index"
                  class="flex items-start gap-4 p-4 bg-white rounded-xl border hover:shadow-md transition-shadow"
                >
                  <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircleOutlined class="text-purple-600" />
                  </div>
                  <p class="text-gray-700 pt-2">{{ activity }}</p>
                </div>
              </div>

              <div v-else class="text-center py-12 text-gray-500">
                <InfoCircleOutlined class="text-4xl mb-4" />
                <p>No activities information available yet.</p>
              </div>
            </div>

            <!-- Tips Tab -->
            <div v-if="activeContentTab === 'tips'">
              <h2 class="text-2xl font-bold text-gray-900 mb-6">Visitor Tips</h2>

              <div v-if="festival.tips?.length" class="space-y-4">
                <div
                  v-for="(tip, index) in festival.tips"
                  :key="index"
                  class="flex items-start gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100"
                >
                  <div class="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span class="text-lg">💡</span>
                  </div>
                  <p class="text-gray-700 pt-2">{{ tip }}</p>
                </div>
              </div>

              <!-- Dress Code -->
              <div v-if="festival.dressCode" class="mt-8 p-6 bg-gray-50 rounded-xl border">
                <h3 class="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-2">
                  👔 Dress Code
                </h3>
                <p class="text-gray-700">{{ festival.dressCode }}</p>
              </div>

              <div v-if="!festival.tips?.length && !festival.dressCode" class="text-center py-12 text-gray-500">
                <InfoCircleOutlined class="text-4xl mb-4" />
                <p>No tips available yet.</p>
              </div>
            </div>

            <!-- Locations Tab -->
            <div v-if="activeContentTab === 'locations'">
              <h2 class="text-2xl font-bold text-gray-900 mb-6">Best Places to Experience</h2>

              <!-- Best Locations -->
              <div v-if="festival.bestLocations?.length" class="space-y-4 mb-8">
                <div
                  v-for="(location, index) in festival.bestLocations"
                  :key="index"
                  class="flex items-center gap-4 p-4 bg-white rounded-xl border hover:shadow-md transition-shadow"
                >
                  <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <EnvironmentOutlined class="text-green-600" />
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">{{ location }}</p>
                    <p v-if="index === 0" class="text-sm text-green-600">Top Recommended</p>
                  </div>
                </div>
              </div>

              <!-- Provinces -->
              <div v-if="festival.provinces?.length" class="mt-8">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Provinces</h3>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="province in festival.provinces"
                    :key="province"
                    class="px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700"
                  >
                    {{ province }}
                  </span>
                </div>
              </div>

              <!-- Nationwide -->
              <div v-if="festival.isNationwide" class="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-100">
                <div class="flex items-center gap-3">
                  <TeamOutlined class="text-2xl text-blue-600" />
                  <div>
                    <p class="font-semibold text-blue-900">Celebrated Nationwide</p>
                    <p class="text-sm text-blue-700">This festival is celebrated throughout Thailand</p>
                  </div>
                </div>
              </div>

              <div v-if="!festival.bestLocations?.length && !festival.provinces?.length && !festival.isNationwide" class="text-center py-12 text-gray-500">
                <InfoCircleOutlined class="text-4xl mb-4" />
                <p>No location information available yet.</p>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="lg:col-span-1">
            <!-- Quick Links Card -->
            <div class="bg-white rounded-2xl shadow-md p-6 sticky top-20">
              <h3 class="font-semibold text-gray-900 mb-4">Quick Navigation</h3>
              <div class="space-y-2">
                <button
                  v-for="tab in contentTabs"
                  :key="tab.key"
                  @click="activeContentTab = tab.key"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors"
                  :class="activeContentTab === tab.key
                    ? 'bg-purple-100 text-purple-700'
                    : 'hover:bg-gray-100 text-gray-600'"
                >
                  <span>{{ tab.icon }}</span>
                  {{ tab.label }}
                </button>
              </div>

              <!-- Back to All Festivals -->
              <RouterLink
                to="/festivals"
                class="block w-full mt-6 text-center px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
              >
                View All Festivals
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
