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
  viator: {
    label: 'Book on Viator',
    icon: '🎭',
    color: 'bg-teal-600 text-white',
    hoverColor: 'hover:bg-teal-700'
  },
  safetywing: {
    label: 'Get Insurance',
    icon: '🛡️',
    color: 'bg-sky-500 text-white',
    hoverColor: 'hover:bg-sky-600'
  },
  nordvpn: {
    label: 'Get VPN',
    icon: '🔐',
    color: 'bg-indigo-500 text-white',
    hoverColor: 'hover:bg-indigo-600'
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

function trackClick() {
  trackAffiliateClick(props.partner, props.destination, props.attractionName)
}
</script>

<template>
  <a
    :href="affiliateUrl"
    target="_blank"
    rel="nofollow noopener noreferrer"
    @click="trackClick"
    :class="buttonClass"
    class="inline-flex items-center justify-center gap-2 transition-colors"
  >
    <span v-if="variant !== 'minimal'">{{ config.icon }}</span>
    <span>{{ config.label }}</span>
  </a>
</template>
