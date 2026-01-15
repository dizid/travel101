<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCountryStore } from '@stores/countryStore'
import WarningCard from '@components/features/WarningCard.vue'
import type { WarningCategory } from '@/types'

const countryStore = useCountryStore()

const activeCategory = ref<WarningCategory | 'all'>('all')

const categories: { value: WarningCategory | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: 'All', icon: '📋' },
  { value: 'royal_family', label: 'Royal Family', icon: '👑' },
  { value: 'drug_laws', label: 'Laws', icon: '⚖️' },
  { value: 'scams', label: 'Scams', icon: '🎭' },
  { value: 'traffic', label: 'Transport', icon: '🛵' },
  { value: 'beach_safety', label: 'Beach', icon: '🏖️' },
  { value: 'nightlife', label: 'Nightlife', icon: '🌙' },
]

const filteredWarnings = computed(() => {
  if (activeCategory.value === 'all') {
    return countryStore.warnings
  }
  return countryStore.warnings.filter((w) => w.category === activeCategory.value)
})

const sortedWarnings = computed(() => {
  return [...filteredWarnings.value].sort((a, b) => b.severity - a.severity)
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-amber-50/50 to-white">
    <!-- Header -->
    <div class="bg-white border-b border-gray-100">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div class="text-center">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium mb-4">
            💡 Good to Know
          </div>
          <h1 class="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-3">
            Thai Customs & Tips
          </h1>
          <p class="text-gray-600 max-w-2xl mx-auto">
            Helpful information to make your Thailand trip smooth and respectful.
            We believe in informing, not scaring!
          </p>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <!-- Category filters -->
      <div class="flex flex-wrap gap-2 mb-8">
        <button
          v-for="cat in categories"
          :key="cat.value"
          @click="activeCategory = cat.value"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all"
          :class="activeCategory === cat.value
            ? 'bg-primary-100 text-primary-700 shadow-sm'
            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'"
        >
          <span>{{ cat.icon }}</span>
          {{ cat.label }}
        </button>
      </div>

      <!-- Warnings grid -->
      <div class="grid md:grid-cols-2 gap-6">
        <WarningCard
          v-for="warning in sortedWarnings"
          :key="warning.id"
          :warning="warning"
        />
      </div>

      <!-- Empty state -->
      <div
        v-if="sortedWarnings.length === 0"
        class="text-center py-12"
      >
        <p class="text-gray-500">No tips in this category yet.</p>
      </div>

      <!-- Bottom note -->
      <div class="mt-12 p-6 bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl">
        <div class="flex items-start gap-4">
          <span class="text-3xl">🇹🇭</span>
          <div>
            <h3 class="font-semibold text-gray-900 mb-1">Thailand is wonderful!</h3>
            <p class="text-gray-600 text-sm">
              These tips are here to help you have the best possible experience.
              Thai people are incredibly welcoming and friendly.
              A little awareness goes a long way in making meaningful connections.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
