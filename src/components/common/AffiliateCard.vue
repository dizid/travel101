<script setup lang="ts">
import { computed } from 'vue'
import { affiliateContexts } from '@/utils/affiliates'
import AffiliateButton from './AffiliateButton.vue'

const props = defineProps<{
  context: keyof typeof affiliateContexts
  destination: string
  attractionName?: string
  title?: string
  compact?: boolean
}>()

const partners = computed(() => affiliateContexts[props.context] || [])

const displayTitle = computed(() => {
  if (props.title) return props.title
  const titles: Record<keyof typeof affiliateContexts, string> = {
    attractionDetail: 'Book Your Experience',
    heritageHotel: 'Book This Stay',
    activities: 'Find Activities',
    transport: 'Get There',
    destination: 'Plan Your Trip',
    itinerary: 'Book Your Trip',
    dashboard: 'Recommended for You',
    essentials: 'Travel Essentials',
    nomad: 'Nomad Must-Haves',
    visa: 'Protect Your Trip',
  }
  return titles[props.context] || 'Book Now'
})
</script>

<template>
  <div :class="compact ? 'p-3' : 'card-thai'">
    <h3 class="font-semibold text-gray-900 mb-3">{{ displayTitle }}</h3>
    <p v-if="!compact" class="text-sm text-gray-600 mb-4">
      Find the best deals for {{ destination }}.
    </p>
    <div :class="compact ? 'flex flex-wrap gap-2' : 'space-y-2'">
      <AffiliateButton
        v-for="partner in partners"
        :key="partner"
        :partner="partner"
        :destination="destination"
        :attraction-name="attractionName"
        :variant="compact ? 'secondary' : 'primary'"
        :class="{ 'w-full': !compact }"
      />
    </div>
    <p v-if="!compact" class="text-xs text-gray-400 mt-3 text-center">
      Affiliate links - we may earn a commission
    </p>
  </div>
</template>
