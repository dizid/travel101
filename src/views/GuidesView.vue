<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { SearchOutlined, ReadOutlined } from '@ant-design/icons-vue'
import GuideCard from '@/components/features/GuideCard.vue'
import BreadcrumbNav from '@/components/ui/BreadcrumbNav.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useGuides } from '@/composables/useGuides'
import { updateMetaTags, getPageMeta, generateBreadcrumbSchema, injectStructuredData } from '@/utils/seo'

const { guides, loading, error, fetchAll, fetchByCategory, searchGuides, getCategoryConfig } = useGuides()

const activeCategory = ref<string>('')
const searchQuery = ref('')

const categories = [
  { key: '', label: 'All Guides' },
  { key: 'practical', label: 'Practical' },
  { key: 'destination', label: 'Destinations' },
  { key: 'budget', label: 'Budget' },
  { key: 'food', label: 'Food' },
  { key: 'culture', label: 'Culture' },
]

const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Travel Guides' },
]

async function loadGuides() {
  if (searchQuery.value.trim()) {
    const results = await searchGuides(searchQuery.value)
    guides.value = results
  } else if (activeCategory.value) {
    await fetchByCategory(activeCategory.value)
  } else {
    await fetchAll()
  }
}

function selectCategory(key: string) {
  activeCategory.value = key
  searchQuery.value = ''
  loadGuides()
}

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout>
watch(searchQuery, (val) => {
  clearTimeout(searchTimeout)
  if (!val.trim()) {
    loadGuides()
    return
  }
  searchTimeout = setTimeout(() => loadGuides(), 300)
})

onMounted(() => {
  const meta = getPageMeta('guides' as any)
  if (meta) updateMetaTags({ ...meta, url: '/guides' })

  injectStructuredData('breadcrumb-schema', generateBreadcrumbSchema(
    breadcrumbs.filter(b => b.url).map(b => ({ name: b.name, url: b.url! }))
      .concat([{ name: 'Travel Guides', url: '/guides' }])
  ))

  loadGuides()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Hero section -->
    <section class="relative bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 overflow-hidden">
      <!-- Decorative blobs -->
      <div class="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      <div class="absolute bottom-0 left-0 w-80 h-80 bg-accent-400/10 rounded-full blur-3xl" />

      <div class="relative max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur text-white/90 text-sm mb-6">
          <ReadOutlined />
          In-depth Thailand travel guides
        </div>
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
          Travel Guides
        </h1>
        <p class="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
          Practical, honest guides written for real travelers — from budget tips to island hopping routes
        </p>
      </div>

      <!-- Wave divider -->
      <svg class="absolute bottom-0 w-full" viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <path d="M0 60L60 55C120 50 240 40 360 36.7C480 33 600 37 720 38.3C840 40 960 40 1080 36.7C1200 33 1320 27 1380 23.3L1440 20V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0Z" fill="#f9fafb"/>
      </svg>
    </section>

    <div class="max-w-6xl mx-auto px-4 py-8">
      <!-- Breadcrumb -->
      <BreadcrumbNav :items="breadcrumbs" />

      <!-- Filters row -->
      <div class="flex flex-col md:flex-row gap-4 mb-8">
        <!-- Category pills -->
        <div class="flex flex-wrap gap-2 flex-1">
          <button
            v-for="cat in categories"
            :key="cat.key"
            @click="selectCategory(cat.key)"
            class="px-4 py-2 rounded-full text-sm font-medium transition-all"
            :class="activeCategory === cat.key
              ? 'bg-primary-500 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'"
          >
            <span v-if="cat.key" class="mr-1">{{ getCategoryConfig(cat.key).icon }}</span>
            {{ cat.label }}
          </button>
        </div>

        <!-- Search -->
        <div class="relative w-full md:w-72">
          <SearchOutlined class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search guides..."
            class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
          />
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-20">
        <LoadingSpinner size="lg" text="Loading guides..." />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="text-center py-20">
        <p class="text-red-500 mb-4">{{ error }}</p>
        <button @click="loadGuides" class="btn-thai">Try Again</button>
      </div>

      <!-- Empty state -->
      <EmptyState
        v-else-if="guides.length === 0"
        icon="📚"
        title="No guides found"
        description="Try adjusting your search or category filter"
      />

      <!-- Guide grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <GuideCard
          v-for="guide in guides"
          :key="guide.id"
          :guide="guide"
        />
      </div>
    </div>
  </div>
</template>
