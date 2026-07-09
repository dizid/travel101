<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useWeather } from '@/composables/useWeather'
import { LoadingOutlined, CloudOutlined } from '@ant-design/icons-vue'

const props = defineProps<{
  location?: string
  compact?: boolean
  /** Skip the outer card-thai wrapper when embedding inside a parent card. */
  bare?: boolean
}>()

const {
  loading,
  weatherData,
  fetchWeather,
  currentTemp,
  currentCondition,
  weatherIcon,
  uvLevel,
  rainChanceToday,
  isMonsoon,
  forecast,
} = useWeather()

const showForecast = ref(false)

onMounted(async () => {
  await fetchWeather(props.location || 'Bangkok')
})

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}
</script>

<template>
  <div :class="bare ? '' : 'card-thai'">
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <LoadingOutlined class="text-2xl text-primary-500 animate-spin" />
    </div>

    <!-- Weather content -->
    <div v-else-if="weatherData">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold text-gray-900 flex items-center gap-2">
          <CloudOutlined class="text-blue-500" />
          Weather
        </h3>
        <span class="text-sm text-gray-500">{{ weatherData.location }}</span>
      </div>

      <!-- Current weather -->
      <div class="flex items-center gap-4 mb-4">
        <span class="text-5xl">{{ weatherIcon }}</span>
        <div>
          <div class="text-3xl font-bold text-gray-900">
            {{ Math.round(currentTemp || 0) }}°C
          </div>
          <div class="text-sm text-gray-500">{{ currentCondition }}</div>
        </div>
      </div>

      <!-- Quick stats -->
      <div class="grid grid-cols-3 gap-2 text-center mb-4">
        <div class="bg-gray-50 rounded-lg p-2">
          <div class="text-xs text-gray-500">Rain</div>
          <div class="font-medium" :class="rainChanceToday > 50 ? 'text-blue-600' : 'text-gray-900'">
            {{ rainChanceToday }}%
          </div>
        </div>
        <div class="bg-gray-50 rounded-lg p-2">
          <div class="text-xs text-gray-500">UV</div>
          <div class="font-medium" :class="uvLevel.color">
            {{ uvLevel.level }}
          </div>
        </div>
        <div class="bg-gray-50 rounded-lg p-2">
          <div class="text-xs text-gray-500">Humidity</div>
          <div class="font-medium text-gray-900">
            {{ weatherData.current.humidity }}%
          </div>
        </div>
      </div>

      <!-- Monsoon alert -->
      <div
        v-if="isMonsoon"
        class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4"
      >
        <div class="flex items-center gap-2 text-blue-700 text-sm">
          <span>🌧️</span>
          <span class="font-medium">Monsoon Season</span>
        </div>
        <p class="text-xs text-blue-600 mt-1">
          Expect afternoon showers. Plan outdoor activities for mornings.
        </p>
      </div>

      <!-- Forecast toggle -->
      <button
        v-if="!compact"
        @click="showForecast = !showForecast"
        class="w-full text-sm text-primary-600 hover:text-primary-700 font-medium py-2"
      >
        {{ showForecast ? 'Hide' : 'Show' }} 7-Day Forecast
      </button>

      <!-- Forecast -->
      <div v-if="showForecast && !compact" class="space-y-2 mt-2">
        <div
          v-for="day in forecast"
          :key="day.date"
          class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
        >
          <span class="text-sm text-gray-600 w-24">{{ formatDate(day.date) }}</span>
          <span class="text-lg">
            {{ day.condition.includes('rain') ? '🌧️' : day.condition.includes('cloud') ? '☁️' : '☀️' }}
          </span>
          <div class="text-sm">
            <span class="font-medium">{{ Math.round(day.maxtemp_c) }}°</span>
            <span class="text-gray-400 mx-1">/</span>
            <span class="text-gray-500">{{ Math.round(day.mintemp_c) }}°</span>
          </div>
          <div class="text-xs text-blue-500 w-12 text-right">
            <span v-if="day.chance_of_rain > 0">{{ day.chance_of_rain }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else class="text-center py-6 text-gray-500">
      <CloudOutlined class="text-3xl mb-2" />
      <p class="text-sm">Weather data unavailable</p>
    </div>
  </div>
</template>
