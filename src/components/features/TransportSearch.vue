<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  SearchOutlined,
  SwapOutlined,
  RightOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons-vue'

const props = defineProps<{
  fromCity?: string
  toCity?: string
  compact?: boolean
}>()

const origin = ref(props.fromCity || '')
const destination = ref(props.toCity || '')
const travelDate = ref('')

// Popular Thai cities for transport
const cities = [
  { name: 'Bangkok', slug: 'bangkok' },
  { name: 'Chiang Mai', slug: 'chiang-mai' },
  { name: 'Phuket', slug: 'phuket' },
  { name: 'Krabi', slug: 'krabi' },
  { name: 'Koh Samui', slug: 'koh-samui' },
  { name: 'Koh Phangan', slug: 'koh-phangan' },
  { name: 'Koh Tao', slug: 'koh-tao' },
  { name: 'Pattaya', slug: 'pattaya' },
  { name: 'Hua Hin', slug: 'hua-hin' },
  { name: 'Ayutthaya', slug: 'ayutthaya' },
  { name: 'Chiang Rai', slug: 'chiang-rai' },
  { name: 'Sukhothai', slug: 'sukhothai' },
  { name: 'Surat Thani', slug: 'surat-thani' },
  { name: 'Hat Yai', slug: 'hat-yai' },
  { name: 'Pai', slug: 'pai' },
  { name: 'Railay', slug: 'railay' },
  { name: 'Koh Lipe', slug: 'koh-lipe' },
]

// Popular routes with typical prices/times
const popularRoutes = [
  { from: 'Bangkok', to: 'Chiang Mai', modes: ['train', 'bus', 'flight'], price: '฿350-1,500' },
  { from: 'Bangkok', to: 'Phuket', modes: ['bus', 'flight'], price: '฿450-2,000' },
  { from: 'Bangkok', to: 'Koh Samui', modes: ['bus+ferry', 'flight'], price: '฿600-2,500' },
  { from: 'Surat Thani', to: 'Koh Phangan', modes: ['ferry'], price: '฿400-600' },
  { from: 'Krabi', to: 'Koh Lipe', modes: ['speedboat'], price: '฿1,200-1,800' },
  { from: 'Bangkok', to: 'Ayutthaya', modes: ['train', 'bus', 'minivan'], price: '฿15-100' },
]

const canSearch = computed(() => origin.value && destination.value)

function swapCities() {
  const temp = origin.value
  origin.value = destination.value
  destination.value = temp
}

function getSlug(cityName: string): string {
  return cities.find(c => c.name === cityName)?.slug || cityName.toLowerCase().replace(/\s+/g, '-')
}

function openBooking() {
  if (!canSearch.value) return

  const fromSlug = getSlug(origin.value)
  const toSlug = getSlug(destination.value)
  const dateParam = travelDate.value ? `?date=${travelDate.value}` : ''

  // 12Go Asia deep link
  const url = `https://12go.asia/en/travel/${fromSlug}/${toSlug}${dateParam}?z=4704308`
  window.open(url, '_blank')
}

function openPopularRoute(from: string, to: string) {
  origin.value = from
  destination.value = to
  openBooking()
}

const modeIcons: Record<string, string> = {
  train: '🚂',
  bus: '🚌',
  flight: '✈️',
  ferry: '⛴️',
  'bus+ferry': '🚌⛴️',
  speedboat: '🚤',
  minivan: '🚐',
}
</script>

<template>
  <div class="transport-search">
    <div class="card-thai">
      <div class="flex items-center gap-2 mb-4">
        <span class="text-2xl">🚆</span>
        <h3 class="font-semibold text-gray-900">Transport in Thailand</h3>
      </div>

      <p class="text-sm text-gray-600 mb-4">
        Search buses, trains, ferries & flights between Thai cities
      </p>

      <!-- Search Form -->
      <div class="space-y-3 mb-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-gray-500 mb-1">From</label>
            <select v-model="origin" class="input-thai w-full text-sm">
              <option value="">Select city...</option>
              <option v-for="city in cities" :key="city.slug" :value="city.name">
                {{ city.name }}
              </option>
            </select>
          </div>
          <div class="relative">
            <button
              @click="swapCities"
              class="absolute left-0 top-1/2 -translate-x-1/2 z-10 w-6 h-6 flex items-center justify-center bg-white border border-gray-300 rounded-full hover:bg-gray-50 shadow-sm"
              style="margin-top: 0.25rem;"
            >
              <SwapOutlined class="text-gray-400 text-xs" />
            </button>
            <label class="block text-xs text-gray-500 mb-1">To</label>
            <select v-model="destination" class="input-thai w-full text-sm">
              <option value="">Select city...</option>
              <option v-for="city in cities" :key="city.slug" :value="city.name">
                {{ city.name }}
              </option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs text-gray-500 mb-1">Date (optional)</label>
          <input
            v-model="travelDate"
            type="date"
            class="input-thai w-full text-sm"
            :min="new Date().toISOString().split('T')[0]"
          />
        </div>

        <button
          @click="openBooking"
          :disabled="!canSearch"
          class="btn-thai w-full flex items-center justify-center gap-2 text-sm"
        >
          <SearchOutlined />
          Search on 12Go
        </button>
      </div>

      <!-- Popular Routes -->
      <div v-if="!compact">
        <h4 class="text-sm font-medium text-gray-700 mb-3">Popular Routes</h4>
        <div class="space-y-2">
          <button
            v-for="route in popularRoutes.slice(0, 4)"
            :key="`${route.from}-${route.to}`"
            @click="openPopularRoute(route.from, route.to)"
            class="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
          >
            <div class="flex items-center gap-2">
              <EnvironmentOutlined class="text-gray-400" />
              <span class="text-sm">
                {{ route.from }}
                <RightOutlined class="text-xs text-gray-400 mx-1" />
                {{ route.to }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500">
                <span v-for="mode in route.modes" :key="mode" class="mr-1">
                  {{ modeIcons[mode] }}
                </span>
              </span>
              <span class="text-xs font-medium text-primary-600">{{ route.price }}</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Partner Badge -->
      <div class="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <span class="text-xs text-gray-400">Powered by 12Go Asia</span>
        <span class="text-xs text-gray-400">🔒 Secure booking</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.input-thai {
  @apply px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors;
}
</style>
