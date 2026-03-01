<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ClockCircleOutlined, EyeOutlined } from '@ant-design/icons-vue'
import type { Guide } from '@/composables/useGuides'
import { useGuides } from '@/composables/useGuides'

const props = defineProps<{
  guide: Guide
}>()

const { getCategoryConfig, formatDate } = useGuides()

const categoryConfig = computed(() => getCategoryConfig(props.guide.category))

// Category gradient fallbacks when no image
const gradientMap: Record<string, string> = {
  destination: 'from-blue-500 to-cyan-400',
  practical: 'from-green-500 to-emerald-400',
  culture: 'from-purple-500 to-violet-400',
  food: 'from-orange-500 to-amber-400',
  budget: 'from-emerald-500 to-teal-400',
}

const gradientClass = computed(() => gradientMap[props.guide.category] || 'from-primary-500 to-accent-400')
</script>

<template>
  <RouterLink
    :to="`/guides/${guide.slug}`"
    class="group block card-thai p-0 overflow-hidden hover:shadow-thai-lg transition-all duration-300"
  >
    <!-- Image / Gradient header -->
    <div class="relative h-48 overflow-hidden">
      <img
        v-if="guide.imageUrl"
        :src="guide.imageUrl"
        :alt="guide.imageAlt || guide.title + ' - Thailand travel guide'"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
      />
      <div
        v-else
        class="absolute inset-0 bg-gradient-to-br"
        :class="gradientClass"
      />
      <!-- Dark overlay for text readability -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

      <!-- Category badge -->
      <div class="absolute top-3 left-3">
        <span
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/90 backdrop-blur"
          :class="categoryConfig.color"
        >
          {{ categoryConfig.icon }} {{ categoryConfig.label }}
        </span>
      </div>

      <!-- Reading time -->
      <div class="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur rounded-full text-xs text-white">
        <ClockCircleOutlined />
        {{ guide.readingTimeMin }} min read
      </div>

      <!-- Title overlay -->
      <div class="absolute bottom-0 left-0 right-0 p-4">
        <h3 class="text-lg font-bold text-white leading-tight line-clamp-2">
          {{ guide.title }}
        </h3>
      </div>
    </div>

    <!-- Content -->
    <div class="p-4">
      <p v-if="guide.excerpt" class="text-sm text-gray-600 line-clamp-2 mb-3">
        {{ guide.excerpt }}
      </p>
      <p v-else-if="guide.subtitle" class="text-sm text-gray-600 line-clamp-2 mb-3">
        {{ guide.subtitle }}
      </p>

      <!-- Meta row -->
      <div class="flex items-center justify-between text-xs text-gray-400">
        <span>{{ formatDate(guide.publishedAt) }}</span>
        <div class="flex items-center gap-3">
          <span v-if="guide.viewCount > 0" class="flex items-center gap-1">
            <EyeOutlined />
            {{ guide.viewCount.toLocaleString() }}
          </span>
          <span v-if="guide.province" class="text-primary-500 font-medium">
            {{ guide.province }}
          </span>
        </div>
      </div>

      <!-- Tags -->
      <div v-if="guide.tags && guide.tags.length > 0" class="flex flex-wrap gap-1.5 mt-3">
        <span
          v-for="tag in guide.tags.slice(0, 3)"
          :key="tag"
          class="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500"
        >
          {{ tag }}
        </span>
      </div>
    </div>
  </RouterLink>
</template>
