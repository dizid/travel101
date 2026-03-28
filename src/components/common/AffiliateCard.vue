<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { affiliateContexts } from '@/utils/affiliates'
import AffiliateButton from './AffiliateButton.vue'
import { CheckCircleOutlined, ThunderboltOutlined } from '@ant-design/icons-vue'

const props = defineProps<{
  context: keyof typeof affiliateContexts
  destination: string
  attractionName?: string
  title?: string
  compact?: boolean
  showAvailability?: boolean
}>()

const partners = computed(() => affiliateContexts[props.context] || [])

// Simulated availability status (in production, this would be fetched from APIs)
const availability = ref<Record<string, { available: boolean; deals: number; minPrice?: string }>>({})

onMounted(() => {
  if (props.showAvailability) {
    // Simulate availability check for each partner
    partners.value.forEach(partner => {
      availability.value[partner] = {
        available: true,
        deals: 0,
        minPrice: undefined,
      }
    })
  }
})

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

const contextIcon = computed(() => {
  const icons: Record<keyof typeof affiliateContexts, string> = {
    attractionDetail: '🎟️',
    heritageHotel: '🏨',
    activities: '🎯',
    transport: '🚌',
    destination: '✈️',
    itinerary: '📅',
    dashboard: '⭐',
    essentials: '🎒',
    nomad: '💻',
    visa: '🛡️',
  }
  return icons[props.context] || '📌'
})
</script>

<template>
  <div :class="compact ? 'p-3' : 'card-thai overflow-hidden'">
    <!-- Enhanced Header -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span class="text-xl">{{ contextIcon }}</span>
        <h3 class="font-semibold text-gray-900">{{ displayTitle }}</h3>
      </div>
      <span
        v-if="showAvailability && !compact"
        class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full"
      >
        <CheckCircleOutlined class="text-xs" />
        Available
      </span>
    </div>

    <p v-if="!compact" class="text-sm text-gray-600 mb-4">
      Find the best deals for {{ destination }}.
    </p>

    <!-- Partner Cards with Availability -->
    <div :class="compact ? 'flex flex-wrap gap-2' : 'space-y-2'">
      <div
        v-for="partner in partners"
        :key="partner"
        :class="[
          compact ? '' : 'relative',
          showAvailability && !compact ? 'group' : ''
        ]"
      >
        <!-- Availability Badge -->
        <div
          v-if="showAvailability && !compact && availability[partner]"
          class="absolute -top-1 -right-1 z-10"
        >
          <span
            v-if="availability[partner].deals"
            class="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-amber-400 text-amber-900 rounded-full shadow-sm"
          >
            <ThunderboltOutlined class="text-[8px]" />
            {{ availability[partner].deals }} deals
          </span>
        </div>

        <AffiliateButton
          :partner="partner"
          :destination="destination"
          :attraction-name="attractionName"
          :variant="compact ? 'secondary' : 'primary'"
          :class="{ 'w-full': !compact }"
        />

        <!-- Price hint -->
        <p
          v-if="showAvailability && !compact && availability[partner]?.minPrice"
          class="text-xs text-gray-500 text-center mt-1"
        >
          From {{ availability[partner].minPrice }}
        </p>
      </div>
    </div>

    <p v-if="!compact" class="text-xs text-gray-400 mt-3 text-center">
      Affiliate links - we may earn a commission
    </p>
  </div>
</template>
