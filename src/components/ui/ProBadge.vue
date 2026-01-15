<script setup lang="ts">
import { CrownFilled } from '@ant-design/icons-vue'

defineProps<{
  size?: 'sm' | 'md' | 'lg'
}>()
</script>

<template>
  <span
    class="inline-flex items-center gap-1 font-semibold rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white"
    :class="{
      'px-2 py-0.5 text-xs': size === 'sm' || !size,
      'px-3 py-1 text-sm': size === 'md',
      'px-4 py-1.5 text-base': size === 'lg',
    }"
  >
    <CrownFilled />
    <span>PRO</span>
  </span>
</template>
