<script setup lang="ts">
defineProps<{
  icon: string
  title: string
  description: string
  actionLabel?: string
  actionTo?: string
}>()

defineEmits<{
  action: []
}>()
</script>

<template>
  <div class="text-center py-12">
    <div class="text-6xl mb-4">{{ icon }}</div>
    <h3 class="text-xl font-semibold text-gray-900 mb-2">{{ title }}</h3>
    <p class="text-gray-500 mb-6 max-w-sm mx-auto">{{ description }}</p>
    <RouterLink
      v-if="actionTo"
      :to="actionTo"
      class="btn-thai inline-flex"
    >
      {{ actionLabel }}
    </RouterLink>
    <button
      v-else-if="actionLabel"
      @click="$emit('action')"
      class="btn-thai"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>
