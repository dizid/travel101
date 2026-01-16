<script setup lang="ts">
import { computed } from 'vue'
import { generateAffiliateUrl, trackAffiliateClick, type AffiliatePartner } from '@/utils/affiliates'

const props = defineProps<{
  partner: AffiliatePartner
  destination: string
  attractionName?: string
  variant?: 'primary' | 'secondary' | 'minimal'
}>()

const partnerConfig: Record<AffiliatePartner, { label: string; icon: string; color: string; hoverColor: string }> = {
  klook: {
    label: 'Book on Klook',
    icon: '🎫',
    color: 'bg-orange-500 text-white',
    hoverColor: 'hover:bg-orange-600'
  },
  agoda: {
    label: 'Find Hotels',
    icon: '🏨',
    color: 'bg-red-500 text-white',
    hoverColor: 'hover:bg-red-600'
  },
  '12go': {
    label: 'Book Transport',
    icon: '🚌',
    color: 'bg-blue-500 text-white',
    hoverColor: 'hover:bg-blue-600'
  },
  getyourguide: {
    label: 'Book Tours',
    icon: '🗺️',
    color: 'bg-emerald-500 text-white',
    hoverColor: 'hover:bg-emerald-600'
  },
}

const config = computed(() => partnerConfig[props.partner])

const affiliateUrl = computed(() =>
  generateAffiliateUrl(props.partner, props.destination, props.attractionName)
)

const buttonClass = computed(() => {
  if (props.variant === 'minimal') {
    return 'text-sm text-gray-600 hover:text-gray-900 underline'
  }
  if (props.variant === 'secondary') {
    return 'px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium'
  }
  return `px-4 py-2.5 rounded-lg font-medium transition-colors ${config.value.color} ${config.value.hoverColor}`
})

function handleClick() {
  trackAffiliateClick(props.partner, props.destination, props.attractionName)
  window.open(affiliateUrl.value, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <button
    @click="handleClick"
    :class="buttonClass"
    class="inline-flex items-center justify-center gap-2 transition-colors"
  >
    <span v-if="variant !== 'minimal'">{{ config.icon }}</span>
    <span>{{ config.label }}</span>
  </button>
</template>
