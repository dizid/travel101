<script setup lang="ts">
import { computed } from 'vue'
import type { HeritageEvent } from '@/types'

const props = defineProps<{
  events: HeritageEvent[]
}>()

// Group events by era
const groupedEvents = computed(() => {
  const groups: Record<string, HeritageEvent[]> = {}

  props.events.forEach(event => {
    const era = event.eventEra || 'Unknown Era'
    if (!groups[era]) {
      groups[era] = []
    }
    groups[era].push(event)
  })

  // Sort eras chronologically
  const eraOrder = [
    'Prehistoric',
    'Dvaravati Period',
    'Srivijaya Period',
    'Khmer Period',
    'Sukhothai Period',
    'Ayutthaya Period',
    'Thonburi Period',
    'Rattanakosin Period',
    'Modern',
    'Unknown Era',
  ]

  return Object.entries(groups)
    .sort(([a], [b]) => {
      const aIndex = eraOrder.indexOf(a)
      const bIndex = eraOrder.indexOf(b)
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    })
    .map(([era, events]) => ({
      era,
      events: events.sort((a, b) => {
        // Sort by year, nulls last
        const aYear = a.eventYear ?? null
        const bYear = b.eventYear ?? null
        if (aYear === null && bYear === null) return 0
        if (aYear === null) return 1
        if (bYear === null) return -1
        return aYear - bYear
      }),
    }))
})

// Event type styling
const eventTypeConfig: Record<string, { icon: string; color: string; bgColor: string }> = {
  construction: {
    icon: '🏗️',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  destruction: {
    icon: '💥',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  restoration: {
    icon: '🔧',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  designation: {
    icon: '🏆',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  event: {
    icon: '📜',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  discovery: {
    icon: '🔍',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
  },
}

const defaultEventConfig = {
  icon: '📅',
  color: 'text-gray-600',
  bgColor: 'bg-gray-100',
}

function getEventConfig(type: string | null | undefined) {
  return eventTypeConfig[type || ''] || defaultEventConfig
}

function formatYear(event: HeritageEvent): string {
  if (!event.eventYear) return 'Unknown'

  const prefix = event.isApproximate ? 'c. ' : ''

  if (event.eventYearEnd && event.eventYearEnd !== event.eventYear) {
    return `${prefix}${event.eventYear} - ${event.eventYearEnd}`
  }

  return `${prefix}${event.eventYear}`
}

// Era colors for the era badges
const eraColors: Record<string, string> = {
  'Prehistoric': 'bg-stone-600',
  'Dvaravati Period': 'bg-amber-700',
  'Srivijaya Period': 'bg-teal-700',
  'Khmer Period': 'bg-red-800',
  'Sukhothai Period': 'bg-emerald-700',
  'Ayutthaya Period': 'bg-orange-700',
  'Thonburi Period': 'bg-blue-800',
  'Rattanakosin Period': 'bg-purple-700',
  'Modern': 'bg-gray-700',
}
</script>

<template>
  <div v-if="events.length > 0" class="relative">
    <!-- Era Groups -->
    <div
      v-for="group in groupedEvents"
      :key="group.era"
      class="mb-8 last:mb-0"
    >
      <!-- Era Header -->
      <div class="flex items-center gap-3 mb-4">
        <div
          class="px-3 py-1.5 rounded-full text-white text-sm font-semibold"
          :class="eraColors[group.era] || 'bg-gray-700'"
        >
          {{ group.era }}
        </div>
        <div class="flex-1 h-px bg-gray-200" />
      </div>

      <!-- Timeline Events -->
      <div class="relative pl-8">
        <!-- Vertical line -->
        <div class="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />

        <!-- Events -->
        <div
          v-for="event in group.events"
          :key="event.id"
          class="relative mb-6 last:mb-0"
        >
          <!-- Timeline dot -->
          <div
            class="absolute -left-5 top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
            :class="getEventConfig(event.eventType).bgColor"
          >
            <span class="text-[10px]">{{ getEventConfig(event.eventType).icon }}</span>
          </div>

          <!-- Event Card -->
          <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
            <!-- Year & Type -->
            <div class="flex items-center gap-2 mb-2">
              <span class="text-sm font-semibold text-gray-900">
                {{ formatYear(event) }}
              </span>
              <span
                v-if="event.eventType"
                class="text-xs px-2 py-0.5 rounded-full"
                :class="[getEventConfig(event.eventType).bgColor, getEventConfig(event.eventType).color]"
              >
                {{ event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1) }}
              </span>
              <span
                v-if="event.isApproximate"
                class="text-xs text-gray-400"
                title="Approximate date"
              >
                ~
              </span>
            </div>

            <!-- Title -->
            <h4 class="font-medium text-gray-900 mb-1">
              {{ event.title }}
            </h4>

            <!-- Description -->
            <p class="text-sm text-gray-600 leading-relaxed">
              {{ event.description }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Empty State -->
  <div
    v-else
    class="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-xl"
  >
    <span class="text-4xl mb-3">📜</span>
    <p class="text-gray-500 text-sm">No historical timeline available yet</p>
  </div>
</template>
