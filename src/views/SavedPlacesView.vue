<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { HeartFilled, CompassOutlined } from '@ant-design/icons-vue'
import { useUserStore } from '@stores/userStore'
import { useCountryStore } from '@stores/countryStore'

const userStore = useUserStore()
const countryStore = useCountryStore()

// Get saved place slugs from user store (will implement in favorites system)
const savedSlugs = computed(() => userStore.profile.savedPlaces || [])

// Get full attraction data for saved places
const savedAttractions = computed(() => {
  return savedSlugs.value
    .map(slug => countryStore.attractions.find(a => a.slug === slug))
    .filter(Boolean)
})

const isEmpty = computed(() => savedAttractions.value.length === 0)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-amber-50 to-white py-8">
    <div class="max-w-4xl mx-auto px-4">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <HeartFilled class="text-rose-500" />
          Saved Places
        </h1>
        <p class="text-gray-600 mt-2">
          Your favorite destinations in Thailand
        </p>
      </div>

      <!-- Empty State -->
      <div v-if="isEmpty" class="card-thai text-center py-16">
        <HeartFilled class="text-6xl text-gray-300 mb-4" />
        <h2 class="text-xl font-semibold text-gray-700 mb-2">
          No saved places yet
        </h2>
        <p class="text-gray-500 mb-6 max-w-sm mx-auto">
          When you find places you love, tap the heart icon to save them here for easy access later.
        </p>
        <RouterLink
          to="/attractions"
          class="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-colors"
        >
          <CompassOutlined />
          Explore Places
        </RouterLink>
      </div>

      <!-- Saved Places Grid -->
      <div v-else class="grid gap-4 sm:grid-cols-2">
        <RouterLink
          v-for="attraction in savedAttractions"
          :key="attraction!.slug"
          :to="`/attractions/${attraction!.slug}`"
          class="card-thai group hover:shadow-lg transition-shadow"
        >
          <div class="flex gap-4">
            <div class="w-20 h-20 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-3xl flex-shrink-0">
              🏝️
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-900 group-hover:text-amber-600 transition-colors truncate">
                {{ attraction!.name }}
              </h3>
              <p class="text-sm text-gray-500 mb-1">
                {{ attraction!.province }}
              </p>
              <p class="text-sm text-gray-600 line-clamp-2">
                {{ attraction!.description }}
              </p>
            </div>
          </div>
        </RouterLink>
      </div>

      <!-- Stats -->
      <div v-if="!isEmpty" class="mt-8 text-center text-gray-500">
        {{ savedAttractions.length }} place{{ savedAttractions.length === 1 ? '' : 's' }} saved
      </div>
    </div>
  </div>
</template>
