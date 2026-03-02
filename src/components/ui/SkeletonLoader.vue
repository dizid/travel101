<script setup lang="ts">
defineProps<{
  variant: 'card' | 'text-block' | 'hero' | 'list-item' | 'stat-card'
  count?: number
}>()
</script>

<template>
  <template v-for="i in (count ?? 1)" :key="i">
    <!-- card: matches card-thai style (rounded-2xl, shadow, p-6) -->
    <div
      v-if="variant === 'card'"
      class="bg-white rounded-2xl shadow-md p-6 animate-pulse"
    >
      <!-- Image placeholder -->
      <div class="bg-gray-200 rounded-xl h-48 w-full mb-4" />
      <!-- Primary text line -->
      <div class="bg-gray-200 rounded h-5 w-3/4 mb-3" />
      <!-- Secondary text line -->
      <div class="bg-gray-200 rounded h-4 w-full mb-2" />
      <!-- Small text -->
      <div class="bg-gray-200 rounded h-3 w-1/2" />
    </div>

    <!-- text-block: 3–4 lines of varying width -->
    <div
      v-else-if="variant === 'text-block'"
      class="animate-pulse space-y-3"
    >
      <div class="bg-gray-200 rounded h-4 w-full" />
      <div class="bg-gray-200 rounded h-4 w-5/6" />
      <div class="bg-gray-200 rounded h-4 w-11/12" />
      <div class="bg-gray-200 rounded h-4 w-2/3" />
    </div>

    <!-- hero: large full-width header skeleton -->
    <div
      v-else-if="variant === 'hero'"
      class="animate-pulse w-full"
    >
      <div class="bg-gray-200 rounded-2xl h-64 md:h-96 w-full mb-6" />
      <div class="bg-gray-200 rounded h-8 w-1/2 mx-auto mb-3" />
      <div class="bg-gray-200 rounded h-5 w-2/3 mx-auto" />
    </div>

    <!-- list-item: horizontal layout with small image + text lines -->
    <div
      v-else-if="variant === 'list-item'"
      class="flex items-center gap-4 animate-pulse"
    >
      <div class="bg-gray-200 rounded-xl h-16 w-16 flex-shrink-0" />
      <div class="flex-1 space-y-2">
        <div class="bg-gray-200 rounded h-4 w-3/4" />
        <div class="bg-gray-200 rounded h-3 w-1/2" />
      </div>
    </div>

    <!-- stat-card: small card with number + label -->
    <div
      v-else-if="variant === 'stat-card'"
      class="bg-white rounded-2xl shadow-md p-6 animate-pulse"
    >
      <div class="bg-gray-200 rounded h-8 w-1/2 mb-2" />
      <div class="bg-gray-200 rounded h-4 w-3/4" />
    </div>
  </template>
</template>
