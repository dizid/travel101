<script setup lang="ts">
import { computed } from 'vue'
import type { Itinerary } from '@/composables/useItinerary'

interface Props {
  itinerary: Itinerary
}

const props = defineProps<Props>()

const activityIcons: Record<string, string> = {
  transport: '✈️',
  accommodation: '🏨',
  attraction: '🏛️',
  food: '🍜',
  shopping: '🛍️',
  nightlife: '🌙',
  beach: '🏖️',
  nature: '🌿',
  wellness: '🧘',
}

const dailyCosts = computed(() => {
  if (!props.itinerary?.days) return []
  return props.itinerary.days.map(day => ({
    dayNumber: day.dayNumber,
    location: day.location,
    total: day.activities.reduce((sum, a) => sum + (a.estimatedCostThb || 0), 0),
    byType: day.activities.reduce((acc, a) => {
      const type = a.activityType || 'other'
      acc[type] = (acc[type] || 0) + (a.estimatedCostThb || 0)
      return acc
    }, {} as Record<string, number>),
  }))
})

const totalTripCost = computed(() => {
  return dailyCosts.value.reduce((sum, day) => sum + day.total, 0)
})

const costByCategory = computed(() => {
  const categories: Record<string, number> = {}
  dailyCosts.value.forEach(day => {
    Object.entries(day.byType).forEach(([type, cost]) => {
      categories[type] = (categories[type] || 0) + cost
    })
  })
  return Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .map(([type, cost]) => ({ type, cost, icon: activityIcons[type] || '📌' }))
})

const maxDailyCost = computed(() => {
  return Math.max(...dailyCosts.value.map(d => d.total), 1)
})
</script>

<template>
  <div
    v-if="totalTripCost > 0"
    class="card-thai bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200"
  >
    <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <span class="text-xl">💰</span>
      Trip Budget
    </h3>

    <!-- Total Cost -->
    <div class="mb-6 p-4 bg-white rounded-xl border border-emerald-200">
      <div class="flex items-center justify-between">
        <span class="text-gray-600">Estimated Total</span>
        <span class="text-2xl font-bold text-emerald-600">฿{{ totalTripCost.toLocaleString() }}</span>
      </div>
      <p class="text-sm text-gray-500 mt-1">~${{ Math.round(totalTripCost / 35).toLocaleString() }} USD</p>
    </div>

    <!-- Daily Breakdown Chart -->
    <div class="mb-6">
      <h4 class="text-sm font-medium text-gray-700 mb-3">Daily Spending</h4>
      <div class="space-y-2">
        <div v-for="day in dailyCosts" :key="day.dayNumber" class="flex items-center gap-3">
          <span class="text-xs text-gray-500 w-12">Day {{ day.dayNumber }}</span>
          <div class="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-end px-2"
              :style="{ width: `${(day.total / maxDailyCost) * 100}%`, minWidth: day.total > 0 ? '40px' : '0' }"
            >
              <span v-if="day.total > 0" class="text-xs font-medium text-white">฿{{ day.total.toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Category Breakdown -->
    <div v-if="costByCategory.length > 0">
      <h4 class="text-sm font-medium text-gray-700 mb-3">By Category</h4>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div
          v-for="cat in costByCategory"
          :key="cat.type"
          class="p-3 bg-white rounded-lg border border-gray-100"
        >
          <div class="flex items-center gap-2 mb-1">
            <span>{{ cat.icon }}</span>
            <span class="text-sm text-gray-600 capitalize">{{ cat.type }}</span>
          </div>
          <p class="text-lg font-semibold text-gray-900">฿{{ cat.cost.toLocaleString() }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
