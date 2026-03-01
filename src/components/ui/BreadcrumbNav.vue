<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{
  items: { name: string; url?: string }[]
}>()
</script>

<template>
  <nav aria-label="Breadcrumb" class="text-sm text-gray-500 mb-4">
    <ol class="flex items-center gap-1.5 flex-wrap">
      <li v-for="(item, index) in items" :key="index" class="flex items-center gap-1.5">
        <span v-if="index > 0" class="text-gray-300">/</span>
        <RouterLink
          v-if="item.url && index < items.length - 1"
          :to="item.url"
          class="hover:text-primary-600 transition-colors"
        >
          {{ item.name }}
        </RouterLink>
        <span v-else class="text-gray-700 font-medium">{{ item.name }}</span>
      </li>
    </ol>
  </nav>
</template>
