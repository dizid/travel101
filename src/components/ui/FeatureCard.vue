<script setup lang="ts">
defineProps<{
  icon: string
  title: string
  description: string
  to?: string
  badge?: string
  badgeColor?: 'gold' | 'teal' | 'coral' | 'primary'
}>()
</script>

<template>
  <component
    :is="to ? 'RouterLink' : 'div'"
    :to="to"
    class="card-thai group block"
    :class="{ 'hover:shadow-lg cursor-pointer': to }"
  >
    <div class="flex items-start gap-4">
      <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
        <span class="text-2xl">{{ icon }}</span>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <h3 class="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
            {{ title }}
          </h3>
          <span
            v-if="badge"
            class="px-2 py-0.5 text-xs font-medium rounded-full"
            :class="{
              'bg-amber-100 text-amber-700': badgeColor === 'gold',
              'bg-teal-100 text-teal-700': badgeColor === 'teal',
              'bg-coral-100 text-coral-700': badgeColor === 'coral',
              'bg-primary-100 text-primary-700': badgeColor === 'primary' || !badgeColor,
            }"
          >
            {{ badge }}
          </span>
        </div>
        <p class="text-sm text-gray-500">{{ description }}</p>
      </div>
    </div>
  </component>
</template>
