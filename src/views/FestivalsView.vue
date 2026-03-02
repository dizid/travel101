<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useFestivals } from '@/composables/useFestivals'
import { useGeolocation } from '@/composables/useGeolocation'
import { useUserStore } from '@/stores/userStore'
import type { Festival, UpcomingFestival, FestivalType, FestivalRegion } from '@/types'
import FestivalCard from '@/components/features/FestivalCard.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import ProBadge from '@/components/ui/ProBadge.vue'
import UpgradeModal from '@/components/ui/UpgradeModal.vue'
import {
  SearchOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  FilterOutlined,
  CloseOutlined,
} from '@ant-design/icons-vue'
import BreadcrumbNav from '@/components/ui/BreadcrumbNav.vue'
import { generateBreadcrumbSchema, injectStructuredData } from '@/utils/seo'

const {
  loading,
  error,
  fetchUpcoming,
  fetchAll,
  fetchFiltered,
  fetchTypes,
  fetchRegions,
  getMonthName,
  withDistances,
  sortByProximity,
} = useFestivals()

const userStore = useUserStore()
const { hasLocation, userLatitude, userLongitude, locationLoading, locationError, requestLocation } = useGeolocation()
const showUpgradeModal = ref(false)

// State
const festivals = ref<Festival[]>([])
const upcomingFestivals = ref<UpcomingFestival[]>([])
const total = ref(0)

// Filter state
const searchQuery = ref('')
const selectedType = ref<FestivalType | null>(null)
const selectedRegion = ref<FestivalRegion | null>(null)
const selectedMonth = ref<number | null>(null)
const hiddenGemsOnly = ref(false)

// Filter options from API
const typeOptions = ref<{ type: string; count: number }[]>([])
const regionOptions = ref<{ region: string; count: number }[]>([])

// Tab state
type FilterTab = 'all' | 'upcoming' | 'nearby' | 'hidden' | 'month'
const activeTab = ref<FilterTab>('all')

// Distance data for nearby tab
const nearbyFestivals = ref<(Festival & { distanceKm: number | null })[]>([])

const filterTabs: { key: FilterTab; label: string; icon: string; pro?: boolean }[] = [
  { key: 'all', label: 'All Festivals', icon: '🎉' },
  { key: 'upcoming', label: 'Upcoming', icon: '📅' },
  { key: 'nearby', label: 'Near You', icon: '📍', pro: true },
  { key: 'hidden', label: 'Hidden Gems', icon: '💎' },
  { key: 'month', label: 'By Month', icon: '🗓️' },
]

// Months for the month filter
const months = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: getMonthName(i + 1),
}))

// Build query params
const queryParams = computed(() => {
  const params: Record<string, string | boolean | number> = {}

  if (hiddenGemsOnly.value || activeTab.value === 'hidden') {
    params.hidden = true
  }

  if (selectedType.value) {
    params.type = selectedType.value
  }

  if (selectedRegion.value) {
    params.region = selectedRegion.value
  }

  if (selectedMonth.value) {
    params.month = selectedMonth.value
  }

  if (searchQuery.value.trim()) {
    params.search = searchQuery.value.trim()
  }

  return params
})

async function fetchFestivals() {
  try {
    if (activeTab.value === 'upcoming') {
      const upcoming = await fetchUpcoming(180)
      upcomingFestivals.value = upcoming
      festivals.value = upcoming
      total.value = upcoming.length
    } else if (activeTab.value === 'nearby' && hasLocation.value && userLatitude.value && userLongitude.value) {
      // Fetch all and sort by distance
      const all = await fetchAll()
      const withDist = withDistances(all, userLatitude.value, userLongitude.value)
      nearbyFestivals.value = sortByProximity(withDist)
      festivals.value = nearbyFestivals.value
      total.value = nearbyFestivals.value.length
    } else {
      const result = await fetchFiltered({
        type: selectedType.value || undefined,
        region: selectedRegion.value || undefined,
        hidden: hiddenGemsOnly.value || activeTab.value === 'hidden',
        month: selectedMonth.value || undefined,
        search: searchQuery.value.trim() || undefined,
      })
      festivals.value = result.festivals
      total.value = result.total
    }
  } catch (err) {
    console.error('Failed to fetch festivals:', err)
  }
}

async function fetchFilterOptions() {
  try {
    const [types, regions] = await Promise.all([
      fetchTypes(),
      fetchRegions(),
    ])
    typeOptions.value = types
    regionOptions.value = regions
  } catch (err) {
    console.error('Failed to fetch filter options:', err)
  }
}

function setTab(tab: FilterTab) {
  if (tab === 'nearby') {
    if (!userStore.isPro) {
      showUpgradeModal.value = true
      return
    }
    // Request location if not yet granted
    if (!hasLocation.value) {
      requestLocation().then(granted => {
        if (granted) {
          activeTab.value = 'nearby'
          fetchFestivals()
        }
      })
      return
    }
  }

  activeTab.value = tab
  // Reset filters when switching tabs
  if (tab === 'hidden') {
    hiddenGemsOnly.value = true
  } else {
    hiddenGemsOnly.value = false
  }
  if (tab !== 'month') {
    selectedMonth.value = null
  }
}

function clearFilters() {
  searchQuery.value = ''
  selectedType.value = null
  selectedRegion.value = null
  selectedMonth.value = null
  hiddenGemsOnly.value = false
  activeTab.value = 'all'
}

const hasActiveFilters = computed(() =>
  searchQuery.value ||
  selectedType.value ||
  selectedRegion.value ||
  selectedMonth.value ||
  hiddenGemsOnly.value ||
  activeTab.value !== 'all'
)

// Watch for filter changes
watch([queryParams, activeTab], () => {
  fetchFestivals()
}, { deep: true })

onMounted(() => {
  // Inject breadcrumb schema for SEO
  injectStructuredData(
    'breadcrumb-schema',
    generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Festivals', url: '/festivals' },
    ])
  )

  fetchFestivals()
  fetchFilterOptions()
  // Also fetch upcoming for the banner
  fetchUpcoming(90).then(upcoming => {
    upcomingFestivals.value = upcoming
  })
})


</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Hero Section -->
    <div class="relative overflow-hidden bg-gradient-to-br from-purple-700 via-primary-700 to-accent-600 text-white h-64 md:h-80">
      <!-- Decorative blur blobs -->
      <div class="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      <div class="absolute bottom-0 left-0 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl" />

      <!-- Subtle floating emoji accents -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div class="absolute top-8 left-10 text-5xl opacity-15">🎉</div>
        <div class="absolute top-16 right-16 text-4xl opacity-15">🏮</div>
        <div class="absolute bottom-12 left-1/4 text-3xl opacity-15">🪷</div>
      </div>

      <!-- Content -->
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center h-full text-center">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur rounded-full text-sm font-medium mb-4">
          🎉 Cultural Calendar
        </div>
        <h1 class="text-3xl md:text-5xl font-display font-bold mb-3">
          Thai Festivals &amp; Events
        </h1>
        <p class="text-white/90 max-w-xl mx-auto text-base md:text-lg">
          50+ festivals — from Songkran to Loy Krathong
        </p>
      </div>

      <!-- Wave divider -->
      <div class="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full" preserveAspectRatio="none">
          <path d="M0 40L48 34.7C96 29.3 192 18.7 288 16C384 13.3 480 18.7 576 21.3C672 24 768 24 864 21.3C960 18.7 1056 13.3 1152 13.3C1248 13.3 1344 18.7 1392 21.3L1440 24V40H1392C1344 40 1248 40 1152 40C1056 40 960 40 864 40C768 40 672 40 576 40C480 40 384 40 288 40C192 40 96 40 48 40H0Z" fill="rgb(249 250 251)" />
        </svg>
      </div>
    </div>

    <!-- Filters Section -->
    <div class="sticky top-0 z-20 bg-white border-b shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Tab Navigation -->
        <div class="flex items-center gap-1 py-3 overflow-x-auto">
          <button
            v-for="tab in filterTabs"
            :key="tab.key"
            @click="setTab(tab.key)"
            class="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all"
            :class="activeTab === tab.key
              ? 'bg-purple-100 text-purple-700'
              : 'text-gray-600 hover:bg-gray-100'"
          >
            <span>{{ tab.icon }}</span>
            {{ tab.label }}
            <ProBadge v-if="tab.pro && !userStore.isPro" size="sm" />
          </button>

          <div class="flex-1" />

          <!-- Clear Filters -->
          <button
            v-if="hasActiveFilters"
            @click="clearFilters"
            class="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <CloseOutlined />
            Clear
          </button>
        </div>

        <!-- Filter Row -->
        <div class="flex flex-wrap items-center gap-3 pb-4">
          <!-- Search -->
          <div class="relative flex-1 min-w-[200px] max-w-md">
            <SearchOutlined class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search festivals..."
              class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <!-- Type Filter -->
          <div class="relative">
            <select
              v-model="selectedType"
              class="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer"
            >
              <option :value="null">All Types</option>
              <option v-for="opt in typeOptions" :key="opt.type" :value="opt.type">
                {{ opt.type.charAt(0).toUpperCase() + opt.type.slice(1) }} ({{ opt.count }})
              </option>
            </select>
            <FilterOutlined class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <!-- Region Filter -->
          <div class="relative">
            <select
              v-model="selectedRegion"
              class="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer"
            >
              <option :value="null">All Regions</option>
              <option v-for="opt in regionOptions" :key="opt.region" :value="opt.region">
                {{ opt.region }} ({{ opt.count }})
              </option>
            </select>
            <EnvironmentOutlined class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <!-- Month Filter (shown when month tab active) -->
          <div v-if="activeTab === 'month'" class="relative">
            <select
              v-model="selectedMonth"
              class="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer"
            >
              <option :value="null">Select Month</option>
              <option v-for="m in months" :key="m.value" :value="m.value">
                {{ m.label }}
              </option>
            </select>
            <CalendarOutlined class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <!-- Breadcrumb navigation -->
      <BreadcrumbNav :items="[{ name: 'Home', url: '/' }, { name: 'Festivals' }]" />

      <!-- Upcoming Banner (only on All tab) -->
      <div v-if="activeTab === 'all' && upcomingFestivals.length > 0" class="mb-8">
        <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>📅</span>
          Coming Up Next
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FestivalCard
            v-for="festival in upcomingFestivals.slice(0, 3)"
            :key="festival.slug"
            :festival="festival"
            :show-countdown="true"
            :compact="true"
          />
        </div>
      </div>

      <!-- Location loading state for nearby tab -->
      <div v-if="activeTab === 'nearby' && locationLoading" class="text-center py-12">
        <LoadingSpinner size="lg" />
        <p class="text-gray-500 mt-4">Getting your location...</p>
      </div>

      <!-- Location error for nearby tab -->
      <div v-else-if="activeTab === 'nearby' && locationError" class="text-center py-12">
        <div class="text-5xl mb-4">📍</div>
        <p class="text-gray-600 mb-2">{{ locationError }}</p>
        <p class="text-sm text-gray-400">Enable location access in your browser settings to use this feature.</p>
      </div>

      <template v-else>
      <!-- Results Header -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold text-gray-900">
          <template v-if="activeTab === 'nearby'">
            📍 Festivals Near You
          </template>
          <template v-else-if="activeTab === 'hidden'">
            💎 Hidden Gem Festivals
          </template>
          <template v-else-if="activeTab === 'upcoming'">
            📅 Upcoming Festivals
          </template>
          <template v-else-if="activeTab === 'month' && selectedMonth">
            🗓️ {{ getMonthName(selectedMonth) }} Festivals
          </template>
          <template v-else>
            🎉 All Festivals
          </template>
          <span class="text-gray-400 font-normal ml-2">({{ festivals.length }})</span>
        </h2>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SkeletonLoader variant="card" :count="6" />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-16">
        <div class="text-5xl mb-4">😕</div>
        <p class="text-gray-600">{{ error }}</p>
        <button
          @click="fetchFestivals"
          class="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Try Again
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="festivals.length === 0" class="text-center py-16">
        <div class="text-5xl mb-4">🔍</div>
        <p class="text-gray-600 mb-4">No festivals found matching your filters.</p>
        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Clear Filters
        </button>
      </div>

      <!-- Festival Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <FestivalCard
          v-for="festival in festivals"
          :key="festival.slug"
          :festival="festival"
          :show-countdown="activeTab === 'upcoming'"
          :distance-km="activeTab === 'nearby' ? (festival as any).distanceKm : undefined"
        />
      </div>
      </template>
    </div>

    <!-- Upgrade Modal -->
    <UpgradeModal
      :is-open="showUpgradeModal"
      feature-name="Near You"
      trigger-reason="pro_feature"
      @close="showUpgradeModal = false"
    />

    <!-- Legend/Footer -->
    <div class="bg-white border-t mt-12">
      <div class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h3 class="text-sm font-medium text-gray-900 mb-4">Festival Types</h3>
        <div class="flex flex-wrap gap-3">
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm">
            🙏 Religious
          </span>
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm">
            🎭 Cultural
          </span>
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm">
            👑 Royal
          </span>
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-100 text-teal-700 rounded-full text-sm">
            🎉 Modern
          </span>
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm">
            🌾 Harvest
          </span>
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-100 text-cyan-700 rounded-full text-sm">
            💧 Water
          </span>
        </div>

        <h3 class="text-sm font-medium text-gray-900 mb-4 mt-6">Crowd Levels</h3>
        <div class="flex flex-wrap gap-3">
          <span class="inline-flex items-center gap-1.5 text-sm text-gray-600">
            <span class="w-3 h-3 bg-green-500 rounded-full" /> Low
          </span>
          <span class="inline-flex items-center gap-1.5 text-sm text-gray-600">
            <span class="w-3 h-3 bg-yellow-500 rounded-full" /> Medium
          </span>
          <span class="inline-flex items-center gap-1.5 text-sm text-gray-600">
            <span class="w-3 h-3 bg-orange-500 rounded-full" /> High
          </span>
          <span class="inline-flex items-center gap-1.5 text-sm text-gray-600">
            <span class="w-3 h-3 bg-red-500 rounded-full" /> Extreme
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
