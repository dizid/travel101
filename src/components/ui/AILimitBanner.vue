<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ThunderboltOutlined, CrownOutlined } from '@ant-design/icons-vue'

const props = defineProps<{
  used: number
  limit: number
  featureName?: string
  compact?: boolean
}>()

const remaining = computed(() => Math.max(0, props.limit - props.used))
const percentage = computed(() => Math.min(100, (props.used / props.limit) * 100))
const isLow = computed(() => remaining.value <= 1 && remaining.value > 0)
const isExhausted = computed(() => remaining.value === 0)
</script>

<template>
  <div
    :class="[
      'rounded-lg border transition-all',
      isExhausted ? 'bg-amber-50 border-amber-200' : isLow ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200',
      compact ? 'px-3 py-2' : 'px-4 py-3'
    ]"
  >
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <ThunderboltOutlined :class="isExhausted ? 'text-amber-500' : 'text-gray-400'" />
        <span :class="['text-sm', isExhausted ? 'text-amber-700 font-medium' : 'text-gray-600']">
          <template v-if="isExhausted">
            Daily {{ featureName || 'AI' }} limit reached
          </template>
          <template v-else>
            {{ remaining }} {{ featureName || 'AI' }} {{ remaining === 1 ? 'use' : 'uses' }} left today
          </template>
        </span>
      </div>

      <RouterLink
        v-if="isExhausted || isLow"
        to="/dashboard#pro"
        class="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-semibold rounded-full hover:shadow-md transition-all"
      >
        <CrownOutlined class="text-xs" />
        Upgrade
      </RouterLink>
    </div>

    <!-- Progress bar -->
    <div v-if="!compact" class="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
      <div
        :class="[
          'h-full transition-all duration-300 rounded-full',
          isExhausted ? 'bg-amber-500' : isLow ? 'bg-yellow-500' : 'bg-primary-500'
        ]"
        :style="{ width: `${percentage}%` }"
      />
    </div>
  </div>
</template>
