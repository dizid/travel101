<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  used: number
  limit: number
  label?: string
  showLabel?: boolean
}>()

const percentage = computed(() => Math.min(100, (props.used / props.limit) * 100))
const remaining = computed(() => Math.max(0, props.limit - props.used))
const color = computed(() => {
  if (remaining.value === 0) return 'bg-red-500'
  if (remaining.value <= 1) return 'bg-amber-500'
  return 'bg-primary-500'
})
</script>

<template>
  <div class="flex items-center gap-2">
    <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        :class="['h-full transition-all duration-300 rounded-full', color]"
        :style="{ width: `${percentage}%` }"
      />
    </div>
    <span v-if="showLabel" class="text-xs text-gray-500 whitespace-nowrap">
      {{ used }}/{{ limit }}
    </span>
  </div>
</template>
