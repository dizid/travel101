<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { Attraction, AttractionCategory } from '@/types'
import { EnvironmentOutlined, StarFilled, HeartOutlined, HeartFilled } from '@ant-design/icons-vue'
import { generateAffiliateUrl, generateHeritageHotelUrl, trackAffiliateClick } from '@/utils/affiliates'
import { useFavorites } from '@/composables/useFavorites'

const props = defineProps<{
  attraction: Attraction
  showMatch?: boolean
  matchScore?: number
  matchReason?: string
}>()

const { toggleFavorite, isFavorite } = useFavorites()
const isLiked = computed(() => isFavorite(props.attraction.slug))

function handleFavoriteClick(event: Event) {
  event.preventDefault()
  event.stopPropagation()
  toggleFavorite(props.attraction.slug)
}

const isHeritage = computed(() => props.attraction.placeType === 'heritage')

const affiliateUrl = computed(() => {
  if (isHeritage.value) {
    return generateHeritageHotelUrl(props.attraction.name, props.attraction.province || 'Thailand')
  }
  return generateAffiliateUrl('klook', props.attraction.province || 'Thailand', props.attraction.name)
})

function handleBookClick(event: Event) {
  event.preventDefault()
  event.stopPropagation()
  const partner = isHeritage.value ? 'agoda' : 'klook'
  trackAffiliateClick(partner, props.attraction.province || 'Thailand', props.attraction.slug)
  window.open(affiliateUrl.value, '_blank', 'noopener,noreferrer')
}

const categoryConfig: Partial<Record<AttractionCategory, { icon: string; label: string; color: string }>> = {
  beach: { icon: '🏖️', label: 'Beach', color: 'bg-blue-100 text-blue-700' },
  culture: { icon: '🏛️', label: 'Culture', color: 'bg-purple-100 text-purple-700' },
  nightlife: { icon: '🌙', label: 'Nightlife', color: 'bg-pink-100 text-pink-700' },
  nature: { icon: '🌿', label: 'Nature', color: 'bg-green-100 text-green-700' },
  island: { icon: '🏝️', label: 'Island', color: 'bg-teal-100 text-teal-700' },
  foodie: { icon: '🍜', label: 'Foodie', color: 'bg-orange-100 text-orange-700' },
  nomad: { icon: '💻', label: 'Nomad Hub', color: 'bg-indigo-100 text-indigo-700' },
  wellness: { icon: '🧘', label: 'Wellness', color: 'bg-emerald-100 text-emerald-700' },
  adventure: { icon: '⛰️', label: 'Adventure', color: 'bg-amber-100 text-amber-700' },
  family: { icon: '👨‍👩‍👧', label: 'Family', color: 'bg-cyan-100 text-cyan-700' },
  romantic: { icon: '💕', label: 'Romantic', color: 'bg-rose-100 text-rose-700' },
  budget: { icon: '💰', label: 'Budget', color: 'bg-lime-100 text-lime-700' },
  luxury: { icon: '✨', label: 'Luxury', color: 'bg-yellow-100 text-yellow-700' },
}

const defaultConfig = { icon: '📍', label: 'Place', color: 'bg-gray-100 text-gray-700' }
const config = computed(() => categoryConfig[props.attraction.category] || defaultConfig)

// Generate a placeholder gradient based on category
const gradientClass = computed(() => {
  const gradients: Record<string, string> = {
    beach: 'from-blue-400 to-cyan-500',
    culture: 'from-purple-400 to-indigo-500',
    nightlife: 'from-pink-400 to-rose-500',
    nature: 'from-green-400 to-emerald-500',
    island: 'from-teal-400 to-cyan-500',
    foodie: 'from-orange-400 to-amber-500',
    nomad: 'from-indigo-400 to-blue-500',
    wellness: 'from-emerald-400 to-teal-500',
    adventure: 'from-amber-400 to-orange-500',
    family: 'from-cyan-400 to-blue-500',
    romantic: 'from-rose-400 to-pink-500',
    budget: 'from-lime-400 to-green-500',
    luxury: 'from-yellow-400 to-amber-500',
  }
  return gradients[props.attraction.category] || 'from-gray-400 to-gray-500'
})
</script>

<template>
  <RouterLink
    :to="`/attractions/${attraction.slug || attraction.id}`"
    class="group block card-thai p-0 overflow-hidden hover:shadow-thai-lg transition-all duration-300"
  >
    <!-- Image placeholder -->
    <div class="relative h-40 overflow-hidden">
      <div
        class="absolute inset-0 bg-gradient-to-br opacity-80 group-hover:opacity-90 transition-opacity"
        :class="gradientClass"
      />
      <div class="absolute inset-0 flex items-center justify-center">
        <span class="text-5xl opacity-50">{{ config.icon }}</span>
      </div>

      <!-- Hidden gem badge -->
      <div
        v-if="attraction.isHiddenGem"
        class="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur rounded-full text-xs font-medium text-primary-600"
      >
        <StarFilled class="text-primary-500" />
        Hidden Gem
      </div>

      <!-- Top right area: favorite button + match score -->
      <div class="absolute top-3 right-3 flex items-center gap-2">
        <!-- Favorite button -->
        <button
          @click="handleFavoriteClick"
          class="w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur rounded-full shadow-sm hover:bg-white transition-colors"
          :class="isLiked ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'"
          :title="isLiked ? 'Remove from saved' : 'Save this place'"
        >
          <HeartFilled v-if="isLiked" class="text-lg" />
          <HeartOutlined v-else class="text-lg" />
        </button>

        <!-- Match score -->
        <div
          v-if="showMatch && matchScore"
          class="flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur rounded-full text-xs font-semibold"
          :class="{
            'text-green-600': matchScore >= 80,
            'text-amber-600': matchScore >= 50 && matchScore < 80,
            'text-gray-600': matchScore < 50,
          }"
        >
          {{ matchScore }}% match
        </div>
      </div>

      <!-- Category badge -->
      <div class="absolute bottom-3 left-3">
        <span
          class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium backdrop-blur"
          :class="config.color"
        >
          {{ config.icon }}
          {{ config.label }}
        </span>
      </div>

      <!-- Hover affiliate button -->
      <div
        class="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      >
        <button
          @click="handleBookClick"
          class="px-3 py-1.5 bg-white/95 hover:bg-white text-gray-800 text-xs font-medium rounded-full shadow-lg backdrop-blur transition-colors"
        >
          {{ isHeritage ? 'Book Stay' : 'Book Activity' }}
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="p-4">
      <h3 class="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors mb-1">
        {{ attraction.name }}
      </h3>

      <div class="flex items-center gap-1 text-sm text-gray-500 mb-2">
        <EnvironmentOutlined class="text-xs" />
        {{ attraction.province }}
      </div>

      <p class="text-sm text-gray-600 line-clamp-2">
        {{ attraction.description }}
      </p>

      <!-- Match reason -->
      <div v-if="showMatch && matchReason" class="mt-2">
        <span class="text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
          {{ matchReason }}
        </span>
      </div>
    </div>
  </RouterLink>
</template>
