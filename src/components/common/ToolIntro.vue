<script setup lang="ts">
/**
 * Public, static intro copy for a tool page (rendered for everyone, prerendered by vite-ssg).
 * Static text only: nothing here reads storage, dates or the user, so hydration stays safe.
 */
import { RouterLink } from 'vue-router'
import { toolIntros, type ToolIntroKey } from '@/data/toolPageIntros'

const props = defineProps<{ page: ToolIntroKey }>()
const intro = toolIntros[props.page]

/** Internal links start with "/" and use the router; everything else is an external source */
const isInternal = (href: string) => href.startsWith('/')
</script>

<template>
  <section class="card-thai mb-8" :aria-label="intro.heading">
    <h2 class="font-semibold text-gray-900 text-lg mb-3">{{ intro.heading }}</h2>
    <p v-for="(paragraph, index) in intro.paragraphs" :key="index" class="text-gray-600 mb-3 leading-relaxed">
      <template v-for="(segment, segmentIndex) in paragraph" :key="segmentIndex">
        <template v-if="typeof segment === 'string'">{{ segment }}</template>
        <RouterLink v-else-if="isInternal(segment.href)" :to="segment.href" class="text-primary-600 underline">{{ segment.text }}</RouterLink>
        <a v-else :href="segment.href" target="_blank" rel="noopener noreferrer" class="text-primary-600 underline">{{ segment.text }}</a>
      </template>
    </p>
    <p v-if="intro.proNote" class="text-sm text-gray-500">{{ intro.proNote }}</p>
  </section>
</template>
