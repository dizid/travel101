<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useCountryStore } from '@stores/countryStore'
import {
  EnvironmentOutlined,
  StarFilled,
  LeftOutlined,
  HeartOutlined,
  ShareAltOutlined,
} from '@ant-design/icons-vue'

const route = useRoute()
const countryStore = useCountryStore()

const attraction = computed(() => {
  return countryStore.getAttractionById(route.params.id as string)
})

const categoryLabels: Record<string, { icon: string; label: string }> = {
  beach: { icon: '🏖️', label: 'Beach' },
  culture: { icon: '🏛️', label: 'Culture' },
  nightlife: { icon: '🌙', label: 'Nightlife' },
  nature: { icon: '🌿', label: 'Nature' },
  island: { icon: '🏝️', label: 'Island' },
  foodie: { icon: '🍜', label: 'Foodie' },
  nomad: { icon: '💻', label: 'Nomad Hub' },
  wellness: { icon: '🧘', label: 'Wellness' },
  adventure: { icon: '⛰️', label: 'Adventure' },
  family: { icon: '👨‍👩‍👧', label: 'Family' },
  romantic: { icon: '💕', label: 'Romantic' },
  budget: { icon: '💰', label: 'Budget' },
  luxury: { icon: '✨', label: 'Luxury' },
}

const gradientClass = computed(() => {
  if (!attraction.value) return 'from-gray-400 to-gray-500'
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
  return gradients[attraction.value.category] || 'from-gray-400 to-gray-500'
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Back button -->
    <div class="bg-white border-b border-gray-100">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-4">
        <RouterLink
          to="/attractions"
          class="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <LeftOutlined class="text-xs" />
          Back to Places
        </RouterLink>
      </div>
    </div>

    <div v-if="attraction" class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <!-- Hero image -->
      <div class="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-8">
        <div
          class="absolute inset-0 bg-gradient-to-br"
          :class="gradientClass"
        />
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-8xl opacity-30">
            {{ categoryLabels[attraction.category]?.icon || '🗺️' }}
          </span>
        </div>

        <!-- Badges -->
        <div class="absolute top-4 left-4 flex gap-2">
          <span
            v-if="attraction.isHiddenGem"
            class="inline-flex items-center gap-1 px-3 py-1.5 bg-white/90 backdrop-blur rounded-full text-sm font-medium text-primary-600"
          >
            <StarFilled class="text-primary-500" />
            Hidden Gem
          </span>
          <span class="inline-flex items-center gap-1 px-3 py-1.5 bg-white/90 backdrop-blur rounded-full text-sm font-medium text-gray-700">
            {{ categoryLabels[attraction.category]?.icon }}
            {{ categoryLabels[attraction.category]?.label }}
          </span>
        </div>

        <!-- Actions -->
        <div class="absolute top-4 right-4 flex gap-2">
          <button class="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-colors">
            <HeartOutlined class="text-gray-600" />
          </button>
          <button class="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-colors">
            <ShareAltOutlined class="text-gray-600" />
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="grid md:grid-cols-3 gap-8">
        <div class="md:col-span-2">
          <h1 class="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-3">
            {{ attraction.name }}
          </h1>

          <div class="flex items-center gap-2 text-gray-500 mb-6">
            <EnvironmentOutlined />
            <span>{{ attraction.province }}, Thailand</span>
          </div>

          <div class="prose prose-gray max-w-none">
            <p class="text-lg text-gray-600 leading-relaxed">
              {{ attraction.description }}
            </p>

            <h2 class="text-xl font-semibold text-gray-900 mt-8 mb-4">About this place</h2>
            <p class="text-gray-600">
              {{ attraction.name }} is one of Thailand's
              {{ attraction.isHiddenGem ? 'hidden treasures' : 'popular destinations' }},
              located in {{ attraction.province }} province.
              It's particularly known for its {{ attraction.category }} offerings and attracts
              visitors looking for authentic Thai experiences.
            </p>

            <h2 class="text-xl font-semibold text-gray-900 mt-8 mb-4">Best for</h2>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="(score, category) in attraction.categories"
                :key="category"
                v-show="score > 0.5"
                class="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {{ category.replace('_', ' ') }}
              </span>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Book activities card -->
          <div class="card-thai">
            <h3 class="font-semibold text-gray-900 mb-4">Book Activities</h3>
            <p class="text-sm text-gray-600 mb-4">
              Find tours and experiences in {{ attraction.name }}.
            </p>
            <a
              href="#"
              class="btn-thai w-full justify-center"
            >
              View on Klook
            </a>
            <p class="text-xs text-gray-400 mt-2 text-center">Affiliate link</p>
          </div>

          <!-- Book hotels card -->
          <div class="card-thai">
            <h3 class="font-semibold text-gray-900 mb-4">Find Hotels</h3>
            <p class="text-sm text-gray-600 mb-4">
              Best places to stay in {{ attraction.province }}.
            </p>
            <a
              href="#"
              class="btn-accent w-full justify-center"
            >
              View on Agoda
            </a>
            <p class="text-xs text-gray-400 mt-2 text-center">Affiliate link</p>
          </div>

          <!-- Location card -->
          <div class="card-thai">
            <h3 class="font-semibold text-gray-900 mb-2">Location</h3>
            <div class="flex items-start gap-2">
              <EnvironmentOutlined class="text-gray-400 mt-1" />
              <div>
                <p class="text-gray-900">{{ attraction.location }}</p>
                <p class="text-sm text-gray-500">{{ attraction.province }} Province</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Not found -->
    <div v-else class="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
      <span class="text-6xl mb-4 block">🔍</span>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Place not found</h1>
      <p class="text-gray-500 mb-6">We couldn't find this attraction.</p>
      <RouterLink to="/attractions" class="btn-thai">
        Browse All Places
      </RouterLink>
    </div>
  </div>
</template>
