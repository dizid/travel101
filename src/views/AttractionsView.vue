<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useCountryStore } from '@stores/countryStore'
import AttractionCard from '@components/features/AttractionCard.vue'
import type { AttractionCategory } from '@/types'
import { SearchOutlined, StarFilled } from '@ant-design/icons-vue'

const route = useRoute()
const countryStore = useCountryStore()

const searchQuery = ref('')
const activeCategory = ref<AttractionCategory | 'all' | 'hidden'>('all')
const showHiddenOnly = ref(route.query.hidden === 'true')

const categories: { value: AttractionCategory | 'all' | 'hidden'; label: string; icon: string }[] = [
  { value: 'all', label: 'All Places', icon: '🗺️' },
  { value: 'hidden', label: 'Hidden Gems', icon: '💎' },
  { value: 'beach', label: 'Beaches', icon: '🏖️' },
  { value: 'island', label: 'Islands', icon: '🏝️' },
  { value: 'culture', label: 'Culture', icon: '🏛️' },
  { value: 'nature', label: 'Nature', icon: '🌿' },
  { value: 'nightlife', label: 'Nightlife', icon: '🌙' },
  { value: 'foodie', label: 'Foodie', icon: '🍜' },
  { value: 'nomad', label: 'Nomad Hubs', icon: '💻' },
  { value: 'wellness', label: 'Wellness', icon: '🧘' },
  { value: 'adventure', label: 'Adventure', icon: '⛰️' },
]

const filteredAttractions = computed(() => {
  let results = countryStore.attractions

  // Filter by hidden gems
  if (activeCategory.value === 'hidden' || showHiddenOnly.value) {
    results = results.filter((a) => a.isHiddenGem)
  } else if (activeCategory.value !== 'all') {
    results = results.filter((a) => a.category === activeCategory.value)
  }

  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    results = results.filter(
      (a) =>
        a.name.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query) ||
        a.province.toLowerCase().includes(query)
    )
  }

  return results
})

function setCategory(cat: typeof activeCategory.value) {
  activeCategory.value = cat
  if (cat === 'hidden') {
    showHiddenOnly.value = true
  } else {
    showHiddenOnly.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-rose-50/30 to-white">
    <!-- Header -->
    <div class="bg-white border-b border-gray-100">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div class="text-center">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-100 text-rose-700 rounded-full text-sm font-medium mb-4">
            🗺️ Explore Thailand
          </div>
          <h1 class="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-3">
            Places to Visit
          </h1>
          <p class="text-gray-600 max-w-2xl mx-auto">
            From famous beaches to secret spots only locals know about.
            Find your perfect Thai adventure.
          </p>
        </div>

        <!-- Search -->
        <div class="max-w-xl mx-auto mt-8">
          <div class="relative">
            <SearchOutlined class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search places, provinces..."
              class="input-thai pl-11"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <!-- Category filters -->
      <div class="flex flex-wrap gap-2 mb-8 overflow-x-auto pb-2">
        <button
          v-for="cat in categories"
          :key="cat.value"
          @click="setCategory(cat.value)"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap"
          :class="activeCategory === cat.value || (cat.value === 'hidden' && showHiddenOnly)
            ? 'bg-primary-100 text-primary-700 shadow-sm'
            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'"
        >
          <span>{{ cat.icon }}</span>
          {{ cat.label }}
        </button>
      </div>

      <!-- Hidden gems banner -->
      <div
        v-if="showHiddenOnly"
        class="mb-8 p-6 bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl"
      >
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-white shadow-soft flex items-center justify-center">
            <StarFilled class="text-primary-500 text-xl" />
          </div>
          <div>
            <h3 class="font-semibold text-gray-900">Hidden Gems</h3>
            <p class="text-sm text-gray-600">
              Off-the-beaten-path destinations that most tourists never discover.
              These are Thailand's best-kept secrets!
            </p>
          </div>
        </div>
      </div>

      <!-- Results count -->
      <p class="text-sm text-gray-500 mb-4">
        {{ filteredAttractions.length }} places found
      </p>

      <!-- Attractions grid -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AttractionCard
          v-for="attraction in filteredAttractions"
          :key="attraction.id"
          :attraction="attraction"
        />
      </div>

      <!-- Empty state -->
      <div
        v-if="filteredAttractions.length === 0"
        class="text-center py-16"
      >
        <span class="text-5xl mb-4 block">🔍</span>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No places found</h3>
        <p class="text-gray-500">Try adjusting your search or filters.</p>
      </div>
    </div>
  </div>
</template>
