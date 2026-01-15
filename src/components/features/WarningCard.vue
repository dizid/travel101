<script setup lang="ts">
import { computed } from 'vue'
import type { Warning, SeverityLevel } from '@/types'

const props = defineProps<{
  warning: Warning
  compact?: boolean
}>()

const severityConfig: Record<SeverityLevel, { icon: string; label: string; class: string }> = {
  1: { icon: '💡', label: 'Tip', class: 'severity-tip' },
  2: { icon: '📋', label: 'Note', class: 'severity-note' },
  3: { icon: '⚠️', label: 'Heads Up', class: 'severity-warning' },
  4: { icon: '🚨', label: 'Important', class: 'severity-critical' },
}

const config = computed(() => severityConfig[props.warning.severity])

const categoryLabels: Record<string, string> = {
  royal_family: 'Royal Family',
  drug_laws: 'Laws',
  scams: 'Scams',
  traffic: 'Transport',
  beach_safety: 'Beach Safety',
  nightlife: 'Nightlife',
}
</script>

<template>
  <article
    class="card-thai group"
    :class="[config.class, compact ? 'p-4' : 'p-6']"
  >
    <div class="flex items-start gap-4">
      <!-- Severity icon -->
      <div
        class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl"
        :class="{
          'bg-blue-100': warning.severity === 1,
          'bg-gray-100': warning.severity === 2,
          'bg-amber-100': warning.severity === 3,
          'bg-red-100': warning.severity === 4,
        }"
      >
        {{ config.icon }}
      </div>

      <div class="flex-1 min-w-0">
        <!-- Header -->
        <div class="flex items-center gap-2 mb-1">
          <span
            class="text-xs font-medium px-2 py-0.5 rounded-full"
            :class="{
              'bg-blue-100 text-blue-700': warning.severity === 1,
              'bg-gray-100 text-gray-700': warning.severity === 2,
              'bg-amber-100 text-amber-700': warning.severity === 3,
              'bg-red-100 text-red-700': warning.severity === 4,
            }"
          >
            {{ config.label }}
          </span>
          <span class="text-xs text-gray-400">
            {{ categoryLabels[warning.category] || warning.category }}
          </span>
        </div>

        <!-- Title -->
        <h3
          class="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors"
          :class="compact ? 'text-base' : 'text-lg'"
        >
          {{ warning.title }}
        </h3>

        <!-- Content -->
        <p
          class="text-gray-600 mt-2"
          :class="compact ? 'text-sm line-clamp-2' : 'text-sm'"
        >
          {{ warning.content }}
        </p>

        <!-- Tags -->
        <div v-if="!compact && warning.tags.length" class="flex flex-wrap gap-2 mt-3">
          <span
            v-for="tag in warning.tags"
            :key="tag"
            class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full"
          >
            #{{ tag }}
          </span>
        </div>
      </div>
    </div>
  </article>
</template>
