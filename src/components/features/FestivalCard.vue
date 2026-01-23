<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { Festival, UpcomingFestival } from '@/types'
import { CalendarOutlined, EnvironmentOutlined } from '@ant-design/icons-vue'
import { useFestivals } from '@/composables/useFestivals'

const props = defineProps<{
  festival: Festival | UpcomingFestival
  showCountdown?: boolean
  compact?: boolean
}>()

const {
  getFestivalEmoji,
  getFestivalTypeColor,
  getCrowdLevelColor,
  formatFestivalDate,
  getCountdownText,
  getMonthName
} = useFestivals()

// Check if this festival has upcoming date info
const hasUpcomingInfo = computed(() =>
  'nextDate' in props.festival && 'daysUntil' in props.festival
)

const upcomingFestival = computed(() =>
  hasUpcomingInfo.value ? (props.festival as UpcomingFestival) : null
)

// Countdown urgency class
const urgencyClass = computed(() => {
  if (!upcomingFestival.value) return ''
  const days = upcomingFestival.value.daysUntil
  if (days <= 7) return 'bg-red-500'
  if (days <= 30) return 'bg-amber-500'
  return 'bg-blue-500'
})

// Gradient fallback based on festival type
const gradientClass = computed(() => {
  const type = props.festival.festivalType
  switch (type) {
    case 'religious': return 'from-amber-400 to-orange-500'
    case 'cultural': return 'from-purple-400 to-pink-500'
    case 'royal': return 'from-blue-400 to-indigo-500'
    case 'modern': return 'from-teal-400 to-cyan-500'
    case 'harvest': return 'from-green-400 to-emerald-500'
    case 'water': return 'from-cyan-400 to-blue-500'
    default: return 'from-amber-400 to-orange-500'
  }
})

// Format the display date
const displayDate = computed(() => {
  if (upcomingFestival.value?.nextDate) {
    return formatFestivalDate(upcomingFestival.value.nextDate, props.festival.durationDays)
  }
  if (props.festival.monthTypical) {
    return getMonthName(props.festival.monthTypical)
  }
  return 'Various dates'
})

// Primary location display
const primaryLocation = computed(() => {
  if (props.festival.isNationwide) return 'Nationwide'
  if (props.festival.bestLocations?.length) return props.festival.bestLocations[0]
  if (props.festival.provinces?.length) return props.festival.provinces[0]
  return props.festival.region || null
})

// Festival type display
const typeDisplay = computed(() => {
  const type = props.festival.festivalType
  if (!type) return null
  return type.charAt(0).toUpperCase() + type.slice(1)
})
</script>

<template>
  <RouterLink
    :to="`/festivals/${festival.slug}`"
    class="group block bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
  >
    <!-- Image Area -->
    <div class="relative h-40 overflow-hidden">
      <!-- Actual image or gradient fallback -->
      <img
        v-if="festival.imageUrl"
        :src="festival.imageUrl"
        :alt="festival.name"
        class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
      />
      <div
        v-else
        class="absolute inset-0 bg-gradient-to-br"
        :class="gradientClass"
      >
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-7xl opacity-40">{{ getFestivalEmoji(festival) }}</span>
        </div>
      </div>

      <!-- Dark overlay for text readability -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

      <!-- Hidden Gem Badge -->
      <div
        v-if="festival.isHiddenGem"
        class="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 bg-purple-600 text-white rounded-full text-xs font-semibold shadow-lg"
      >
        <span>💎</span>
        Hidden Gem
      </div>

      <!-- Countdown Badge -->
      <div
        v-if="showCountdown && upcomingFestival"
        class="absolute top-3 right-3 px-2.5 py-1 text-white rounded-full text-xs font-bold shadow-lg"
        :class="urgencyClass"
      >
        {{ getCountdownText(upcomingFestival.daysUntil) }}
      </div>

      <!-- Bottom info overlay -->
      <div class="absolute bottom-3 left-3 right-3 flex items-end justify-between">
        <!-- Festival Type -->
        <span
          v-if="typeDisplay"
          class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium backdrop-blur border"
          :class="getFestivalTypeColor(festival.festivalType)"
        >
          {{ getFestivalEmoji(festival) }}
          {{ typeDisplay }}
        </span>

        <!-- Crowd Level -->
        <div v-if="festival.crowdLevel" class="flex items-center gap-1.5">
          <span
            class="w-2 h-2 rounded-full"
            :class="getCrowdLevelColor(festival.crowdLevel)"
          />
          <span class="text-xs text-white/90 capitalize">{{ festival.crowdLevel }}</span>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="p-4">
      <div class="flex items-start justify-between gap-2 mb-1">
        <h3 class="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors text-lg leading-tight">
          {{ festival.name }}
        </h3>
        <span class="text-2xl flex-shrink-0">{{ getFestivalEmoji(festival) }}</span>
      </div>

      <!-- Thai Name -->
      <p v-if="festival.nameThai" class="text-sm text-gray-500 mb-2">
        {{ festival.nameThai }}
      </p>

      <!-- Date & Location -->
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 mb-2">
        <span class="flex items-center gap-1">
          <CalendarOutlined class="text-xs" />
          {{ displayDate }}
        </span>
        <span v-if="primaryLocation" class="flex items-center gap-1">
          <EnvironmentOutlined class="text-xs" />
          {{ primaryLocation }}
        </span>
      </div>

      <!-- Description -->
      <p v-if="festival.description && !compact" class="text-sm text-gray-600 line-clamp-2">
        {{ festival.description }}
      </p>

      <!-- Tags row -->
      <div v-if="!compact" class="mt-3 flex flex-wrap gap-1.5">
        <!-- Region tag -->
        <span
          v-if="festival.region"
          class="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600"
        >
          {{ festival.region }}
        </span>
        <!-- Religion tag -->
        <span
          v-if="festival.religion"
          class="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600 capitalize"
        >
          {{ festival.religion }}
        </span>
        <!-- Foreigner friendly -->
        <span
          v-if="festival.foreignerFriendly && festival.foreignerFriendly >= 4"
          class="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs"
        >
          Tourist Friendly
        </span>
      </div>
    </div>
  </RouterLink>
</template>
