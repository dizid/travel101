<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useFestivals } from '@/composables/useFestivals'
import type { Festival, UpcomingFestival, FestivalType, FestivalRegion } from '@/types'
import FestivalCard from '@/components/features/FestivalCard.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import {
  SearchOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  FilterOutlined,
  CloseOutlined,
} from '@ant-design/icons-vue'

const {
  loading,
  error,
  fetchUpcoming,
  fetchFiltered,
  fetchTypes,
  fetchRegions,
  getMonthName,
} = useFestivals()

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
type FilterTab = 'all' | 'upcoming' | 'hidden' | 'month'
const activeTab = ref<FilterTab>('all')

const filterTabs: { key: FilterTab; label: string; icon: string }[] = [
  { key: 'all', label: 'All Festivals', icon: '🎉' },
  { key: 'upcoming', label: 'Upcoming', icon: '📅' },
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
      // Fetch upcoming festivals (next 180 days)
      const upcoming = await fetchUpcoming(180)
      upcomingFestivals.value = upcoming
      festivals.value = upcoming
      total.value = upcoming.length
    } else {
      // Fetch with filters
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
  fetchFestivals()
  fetchFilterOptions()
  // Also fetch upcoming for the banner
  fetchUpcoming(90).then(upcoming => {
    upcomingFestivals.value = upcoming
  })
})

// Stats computed
const hiddenGemCount = computed(() =>
  festivals.value.filter(f => f.isHiddenGem).length
)
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Hero Section -->
    <div class="relative bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 text-white">
      <div class="absolute inset-0 bg-black/20" />

      <!-- Decorative elements -->
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute top-10 left-10 text-6xl opacity-20 animate-bounce">🎉</div>
        <div class="absolute top-20 right-20 text-5xl opacity-20 animate-pulse">🏮</div>
        <div class="absolute bottom-10 left-1/4 text-4xl opacity-20">💦</div>
        <div class="absolute bottom-20 right-1/3 text-5xl opacity-20">🪷</div>
      </div>

      <div class="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1 class="text-4xl sm:text-5xl font-bold mb-4">
            Thai Festivals & Events
          </h1>
          <p class="text-xl text-white/90 max-w-2xl mx-auto">
            Discover {{ total }} festivals from spectacular nationwide celebrations to hidden local gems.
            Plan your trip around Thailand's most vibrant cultural experiences.
          </p>
        </div>

        <!-- Stats Row -->
        <div class="mt-8 flex flex-wrap justify-center gap-6 text-center">
          <div class="px-6 py-3 bg-white/10 backdrop-blur rounded-xl">
            <div class="text-3xl font-bold">{{ total }}</div>
            <div class="text-sm text-white/80">Festivals</div>
          </div>
          <div class="px-6 py-3 bg-white/10 backdrop-blur rounded-xl">
            <div class="text-3xl font-bold">{{ upcomingFestivals.length }}</div>
            <div class="text-sm text-white/80">Coming Up</div>
          </div>
          <div class="px-6 py-3 bg-white/10 backdrop-blur rounded-xl">
            <div class="text-3xl font-bold">{{ hiddenGemCount }}</div>
            <div class="text-sm text-white/80">Hidden Gems</div>
          </div>
          <div class="px-6 py-3 bg-white/10 backdrop-blur rounded-xl">
            <div class="text-3xl font-bold">{{ regionOptions.length }}</div>
            <div class="text-sm text-white/80">Regions</div>
          </div>
        </div>
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

      <!-- Results Header -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold text-gray-900">
          <template v-if="activeTab === 'hidden'">
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
      <div v-if="loading" class="flex justify-center py-16">
        <LoadingSpinner size="lg" />
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
        />
      </div>
    </div>

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
