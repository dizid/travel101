<script setup lang="ts">
defineProps<{
  size?: 'sm' | 'md' | 'lg'
  text?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3">
    <div
      class="animate-spin rounded-full border-4 border-primary-200 border-t-primary-500"
      :class="{
        'w-6 h-6': size === 'sm',
        'w-10 h-10': size === 'md' || !size,
        'w-16 h-16': size === 'lg',
      }"
    />
    <p v-if="text" class="text-gray-500 text-sm">{{ text }}</p>
  </div>
</template>
