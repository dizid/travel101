<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  icon?: string
}>()
</script>

<template>
  <div class="mb-8">
    <div class="flex items-center gap-3 mb-2">
      <span v-if="icon" class="text-2xl">{{ icon }}</span>
      <h2 class="text-2xl md:text-3xl font-display font-bold text-gray-900">
        {{ title }}
      </h2>
    </div>
    <p v-if="subtitle" class="text-gray-600 max-w-2xl">
      {{ subtitle }}
    </p>
  </div>
</template>
