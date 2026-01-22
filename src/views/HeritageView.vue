<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useApi } from '@/composables/useApi'
import type { HeritageSite, HeritageImage } from '@/types'
import HeritageCard from '@/components/features/heritage/HeritageCard.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import {
  SearchOutlined,
  EnvironmentOutlined,
  HistoryOutlined,
} from '@ant-design/icons-vue'

const { get } = useApi()

// State
const sites = ref<(HeritageSite & { primaryImage?: HeritageImage; imageCount?: number; eventCount?: number })[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const total = ref(0)
const hasMore = ref(false)

// Filters
const selectedEra = ref<string | null>(null)
const selectedRegion = ref<string | null>(null)
const unescoOnly = ref(false)
const searchQuery = ref('')

// Filter options
const eras = ref<string[]>([])
const regions = ref<{ name: string; count: number }[]>([])

// Filter tabs
type FilterTab = 'all' | 'unesco' | 'temples' | 'museums'
const activeTab = ref<FilterTab>('all')

const filterTabs: { key: FilterTab; label: string; icon: string }[] = [
  { key: 'all', label: 'All Sites', icon: '🏛️' },
  { key: 'unesco', label: 'UNESCO', icon: '🏆' },
  { key: 'temples', label: 'Temples', icon: '🛕' },
  { key: 'museums', label: 'Museums', icon: '🏛️' },
]

// Build query params
const queryParams = computed(() => {
  const params: Record<string, string> = {}

  if (activeTab.value === 'unesco') {
    params.unesco = 'true'
  } else if (activeTab.value === 'temples') {
    params.type = 'temple'
  } else if (activeTab.value === 'museums') {
    params.type = 'museum'
  }

  if (selectedEra.value) {
    params.era = selectedEra.value
  }

  if (selectedRegion.value) {
    params.region = selectedRegion.value
  }

  if (searchQuery.value.trim()) {
    params.search = searchQuery.value.trim()
  }

  return params
})

async function fetchSites() {
  loading.value = true
  error.value = null

  try {
    const params = new URLSearchParams(queryParams.value)
    const response = await get<{
      sites: (HeritageSite & { primaryImage?: HeritageImage; imageCount?: number; eventCount?: number })[]
      total: number
      hasMore: boolean
    }>(`/heritage?${params.toString()}`)

    if (response) {
      sites.value = response.sites
      total.value = response.total
      hasMore.value = response.hasMore
    }
  } catch (err) {
    console.error('Failed to fetch heritage sites:', err)
    error.value = 'Failed to load heritage sites'
  } finally {
    loading.value = false
  }
}

async function fetchFilterOptions() {
  try {
    const [erasResponse, regionsResponse] = await Promise.all([
      get<{ eras: string[] }>('/heritage/eras'),
      get<{ regions: { name: string; count: number }[] }>('/heritage/regions'),
    ])

    if (erasResponse) {
      eras.value = erasResponse.eras
    }
    if (regionsResponse) {
      regions.value = regionsResponse.regions
    }
  } catch (err) {
    console.error('Failed to fetch filter options:', err)
  }
}

function setTab(tab: FilterTab) {
  activeTab.value = tab
  // Reset other filters when changing tabs
  if (tab === 'unesco') {
    unescoOnly.value = true
  } else {
    unescoOnly.value = false
  }
}

function clearFilters() {
  selectedEra.value = null
  selectedRegion.value = null
  searchQuery.value = ''
  activeTab.value = 'all'
  unescoOnly.value = false
}

const hasActiveFilters = computed(() =>
  selectedEra.value || selectedRegion.value || searchQuery.value || activeTab.value !== 'all'
)

// Watch for filter changes
watch([queryParams], () => {
  fetchSites()
}, { deep: true })

onMounted(() => {
  fetchSites()
  fetchFilterOptions()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Hero Section -->
    <div class="relative bg-gradient-to-br from-amber-600 via-orange-600 to-red-700 text-white">
      <div class="absolute inset-0 bg-black/20" />
      <div class="absolute inset-0 bg-[url('/patterns/thai-pattern.svg')] opacity-10" />

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div class="text-center">
          <span class="text-5xl mb-4 block">🏛️</span>
          <h1 class="text-4xl md:text-5xl font-display font-bold mb-4">
            Thailand's Living Heritage
          </h1>
          <p class="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            Explore ancient temples, royal palaces, and UNESCO World Heritage sites that tell the story of Thailand's rich history
          </p>
        </div>
      </div>
    </div>

    <!-- Filter Section -->
    <div class="sticky top-16 md:top-20 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Tab Navigation -->
        <div class="flex items-center gap-1 py-3 overflow-x-auto">
          <button
            v-for="tab in filterTabs"
            :key="tab.key"
            @click="setTab(tab.key)"
            class="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
            :class="activeTab === tab.key
              ? 'bg-primary-100 text-primary-700'
              : 'text-gray-600 hover:bg-gray-100'"
          >
            <span>{{ tab.icon }}</span>
            {{ tab.label }}
          </button>

          <div class="flex-1" />

          <!-- Search -->
          <div class="relative">
            <SearchOutlined class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search sites..."
              class="pl-9 pr-4 py-2 w-48 md:w-64 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <!-- Extended Filters -->
        <div class="flex items-center gap-3 py-3 border-t border-gray-100 overflow-x-auto">
          <!-- Era Filter -->
          <div class="relative">
            <select
              v-model="selectedEra"
              class="appearance-none pl-3 pr-8 py-1.5 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option :value="null">All Eras</option>
              <option v-for="era in eras" :key="era" :value="era">
                {{ era }}
              </option>
            </select>
            <HistoryOutlined class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <!-- Region Filter -->
          <div class="relative">
            <select
              v-model="selectedRegion"
              class="appearance-none pl-3 pr-8 py-1.5 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option :value="null">All Regions</option>
              <option v-for="region in regions" :key="region.name" :value="region.name">
                {{ region.name }} ({{ region.count }})
              </option>
            </select>
            <EnvironmentOutlined class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <!-- Clear Filters -->
          <button
            v-if="hasActiveFilters"
            @click="clearFilters"
            class="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Clear filters
          </button>

          <div class="flex-1" />

          <!-- Results Count -->
          <span class="text-sm text-gray-500 whitespace-nowrap">
            {{ total }} sites
          </span>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-20">
        <span class="text-4xl mb-4 block">😕</span>
        <p class="text-gray-600 mb-4">{{ error }}</p>
        <button
          @click="fetchSites"
          class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          Try Again
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="sites.length === 0" class="text-center py-20">
        <span class="text-4xl mb-4 block">🏛️</span>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">No heritage sites found</h3>
        <p class="text-gray-600 mb-4">Try adjusting your filters or search query</p>
        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Clear all filters
        </button>
      </div>

      <!-- Sites Grid -->
      <div
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <HeritageCard
          v-for="site in sites"
          :key="site.id"
          :site="site"
          :primary-image="site.primaryImage"
          :image-count="site.imageCount"
          :event-count="site.eventCount"
        />
      </div>

      <!-- Load More -->
      <div v-if="hasMore && !loading" class="text-center mt-8">
        <button
          class="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Load more sites
        </button>
      </div>
    </div>
  </div>
</template>
