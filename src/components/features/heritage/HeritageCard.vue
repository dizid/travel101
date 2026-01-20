<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { HeritageSite, HeritageImage } from '@/types'
import { EnvironmentOutlined, CameraOutlined, HistoryOutlined } from '@ant-design/icons-vue'

const props = defineProps<{
  site: HeritageSite
  primaryImage?: HeritageImage | null
  imageCount?: number
  eventCount?: number
}>()

const isUNESCO = computed(() =>
  props.site.heritageMetadata?.unescoStatus === 'world_heritage_site'
)

const era = computed(() => props.site.heritageMetadata?.constructionEra || null)

const heritageType = computed(() => {
  const type = props.site.heritageMetadata?.heritageType
  if (!type) return null
  // Capitalize first letter
  return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ')
})

// Heritage type colors
const typeColors: Record<string, string> = {
  temple: 'bg-amber-100 text-amber-700',
  palace: 'bg-purple-100 text-purple-700',
  ruins: 'bg-stone-100 text-stone-700',
  museum: 'bg-blue-100 text-blue-700',
  monument: 'bg-slate-100 text-slate-700',
  archaeological: 'bg-orange-100 text-orange-700',
  natural: 'bg-green-100 text-green-700',
  historical_park: 'bg-emerald-100 text-emerald-700',
}

const typeColor = computed(() =>
  typeColors[props.site.heritageMetadata?.heritageType || ''] || 'bg-gray-100 text-gray-700'
)

// Heritage type icons
const typeIcons: Record<string, string> = {
  temple: '🛕',
  palace: '🏛️',
  ruins: '🏚️',
  museum: '🏛️',
  monument: '🗿',
  archaeological: '⛏️',
  natural: '🌿',
  historical_park: '🏞️',
}

const typeIcon = computed(() =>
  typeIcons[props.site.heritageMetadata?.heritageType || ''] || '🏛️'
)

// Gradient fallback based on heritage type
const gradientClass = computed(() => {
  const gradients: Record<string, string> = {
    temple: 'from-amber-400 to-orange-500',
    palace: 'from-purple-400 to-indigo-500',
    ruins: 'from-stone-400 to-stone-600',
    museum: 'from-blue-400 to-indigo-500',
    monument: 'from-slate-400 to-slate-600',
    archaeological: 'from-orange-400 to-amber-600',
    natural: 'from-green-400 to-emerald-500',
    historical_park: 'from-emerald-400 to-teal-500',
  }
  return gradients[props.site.heritageMetadata?.heritageType || ''] || 'from-amber-400 to-orange-500'
})
</script>

<template>
  <RouterLink
    :to="`/heritage/${site.slug}`"
    class="group block bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
  >
    <!-- Image Area -->
    <div class="relative h-48 overflow-hidden">
      <!-- Actual image or gradient fallback -->
      <img
        v-if="primaryImage?.imageUrl"
        :src="primaryImage.imageUrl"
        :alt="primaryImage.altText || site.name"
        class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
      />
      <div
        v-else
        class="absolute inset-0 bg-gradient-to-br"
        :class="gradientClass"
      >
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-6xl opacity-40">{{ typeIcon }}</span>
        </div>
      </div>

      <!-- Dark overlay for text readability -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

      <!-- UNESCO Badge -->
      <div
        v-if="isUNESCO"
        class="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 text-white rounded-full text-xs font-semibold shadow-lg"
      >
        <span class="text-sm">🏆</span>
        UNESCO
      </div>

      <!-- Era Tag -->
      <div
        v-if="era"
        class="absolute top-3 right-3 px-2.5 py-1 bg-white/90 backdrop-blur rounded-full text-xs font-medium text-gray-700 shadow-sm"
      >
        {{ era }}
      </div>

      <!-- Bottom info overlay -->
      <div class="absolute bottom-3 left-3 right-3 flex items-end justify-between">
        <!-- Heritage Type -->
        <span
          v-if="heritageType"
          class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium backdrop-blur"
          :class="typeColor"
        >
          {{ typeIcon }}
          {{ heritageType }}
        </span>

        <!-- Counts -->
        <div class="flex items-center gap-2">
          <span
            v-if="imageCount && imageCount > 0"
            class="flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur rounded-full text-xs text-white"
          >
            <CameraOutlined />
            {{ imageCount }}
          </span>
          <span
            v-if="eventCount && eventCount > 0"
            class="flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur rounded-full text-xs text-white"
          >
            <HistoryOutlined />
            {{ eventCount }}
          </span>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="p-4">
      <h3 class="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors text-lg mb-1">
        {{ site.name }}
      </h3>

      <div class="flex items-center gap-1 text-sm text-gray-500 mb-2">
        <EnvironmentOutlined class="text-xs" />
        {{ site.province }}
      </div>

      <p class="text-sm text-gray-600 line-clamp-2">
        {{ site.description }}
      </p>

      <!-- Entry Fee if available -->
      <div
        v-if="site.heritageMetadata?.entryFeeForeignerTHB"
        class="mt-3 flex items-center gap-2 text-xs text-gray-500"
      >
        <span class="px-2 py-0.5 bg-gray-100 rounded">
          Entry: ฿{{ site.heritageMetadata.entryFeeForeignerTHB }} foreigners
        </span>
        <span
          v-if="site.heritageMetadata?.entryFeeTHB"
          class="px-2 py-0.5 bg-gray-100 rounded"
        >
          ฿{{ site.heritageMetadata.entryFeeTHB }} Thai
        </span>
      </div>
    </div>
  </RouterLink>
</template>
