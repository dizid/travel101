<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'
import { useUserStore } from '@/stores/userStore'
import { useWeather } from '@/composables/useWeather'
import {
  LoadingOutlined,
  CheckOutlined,
  PrinterOutlined,
  CopyOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue'
import ProBadge from '@components/ui/ProBadge.vue'

interface PackingItem {
  item: string
  category: string
  priority: 'essential' | 'recommended' | 'optional'
  reason?: string
}

interface PackingCategory {
  name: string
  icon: string
  items: PackingItem[]
}

interface PackingList {
  categories: PackingCategory[]
  tips: string[]
  warnings: string[]
}

const { post, loading } = useApi()
const userStore = useUserStore()
const { fetchWeather, weatherData, isMonsoon } = useWeather()

const packingList = ref<PackingList | null>(null)
const checkedItems = ref<Set<string>>(new Set())
const destinations = ref<string[]>(['Bangkok'])
const duration = ref(7)
const activities = ref<string[]>(['sightseeing', 'temples'])
const includeTemples = ref(true)
const copied = ref(false)

const availableDestinations = [
  'Bangkok', 'Chiang Mai', 'Phuket', 'Koh Samui', 'Krabi',
  'Pattaya', 'Hua Hin', 'Chiang Rai', 'Koh Phi Phi', 'Pai',
  'Koh Tao', 'Koh Phangan', 'Ayutthaya', 'Sukhothai', 'Railay'
]

const availableActivities = [
  { value: 'sightseeing', label: '🏛️ Sightseeing' },
  { value: 'temples', label: '⛩️ Temple visits' },
  { value: 'beach', label: '🏖️ Beach' },
  { value: 'hiking', label: '🥾 Hiking' },
  { value: 'nightlife', label: '🌙 Nightlife' },
  { value: 'shopping', label: '🛍️ Shopping' },
  { value: 'diving', label: '🤿 Diving/Snorkeling' },
  { value: 'wellness', label: '🧘 Spa/Wellness' },
  { value: 'food', label: '🍜 Food tours' },
]

const progress = computed(() => {
  if (!packingList.value) return 0
  const totalItems = packingList.value.categories.reduce((sum, cat) => sum + cat.items.length, 0)
  return totalItems > 0 ? Math.round((checkedItems.value.size / totalItems) * 100) : 0
})

async function generatePackingList() {
  // Fetch weather for first destination
  if (destinations.value.length > 0) {
    await fetchWeather(destinations.value[0])
  }

  const result = await post<{ packingList: PackingList }>('/packing', {
    destinations: destinations.value,
    duration: duration.value,
    activities: activities.value,
    weather: weatherData.value ? {
      avgTemp: weatherData.value.current.temp_c,
      rainChance: weatherData.value.forecast[0]?.chance_of_rain ?? 0,
      isMonsoon: isMonsoon.value,
    } : undefined,
    travelStyle: userStore.profile.prefs.budget,
    includeTemples: includeTemples.value,
  }, { requiresAuth: false })

  if (result?.packingList) {
    packingList.value = result.packingList
    checkedItems.value = new Set()
  }
}

function toggleItem(item: string) {
  if (checkedItems.value.has(item)) {
    checkedItems.value.delete(item)
  } else {
    checkedItems.value.add(item)
  }
  checkedItems.value = new Set(checkedItems.value) // Trigger reactivity
}

function copyToClipboard() {
  if (!packingList.value) return

  const text = packingList.value.categories
    .map(cat => `${cat.icon} ${cat.name}:\n${cat.items.map(i => `  ${checkedItems.value.has(i.item) ? '✓' : '○'} ${i.item}`).join('\n')}`)
    .join('\n\n')

  navigator.clipboard.writeText(text)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

function printList() {
  window.print()
}

function toggleDestination(dest: string) {
  const idx = destinations.value.indexOf(dest)
  if (idx === -1) {
    destinations.value.push(dest)
  } else if (destinations.value.length > 1) {
    destinations.value.splice(idx, 1)
  }
}

function toggleActivity(activity: string) {
  const idx = activities.value.indexOf(activity)
  if (idx === -1) {
    activities.value.push(activity)
  } else {
    activities.value.splice(idx, 1)
  }
}

const priorityStyles = {
  essential: 'bg-red-50 border-red-200 text-red-700',
  recommended: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  optional: 'bg-gray-50 border-gray-200 text-gray-600',
}

onMounted(() => {
  // Auto-generate if user has a profile
  if (userStore.hasProfile) {
    generatePackingList()
  }
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-primary-50/30 to-white print:bg-white">
    <!-- Header -->
    <div class="bg-white border-b border-gray-100 print:hidden">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div class="flex items-center gap-3 mb-2">
          <span class="text-3xl">🎒</span>
          <h1 class="text-2xl md:text-3xl font-display font-bold text-gray-900">
            AI Packing Assistant
          </h1>
          <ProBadge />
        </div>
        <p class="text-gray-600">
          Get a personalized packing list based on your destinations, activities, and weather forecast.
        </p>
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <!-- Trip Configuration -->
      <div class="card-thai mb-8 print:hidden">
        <h2 class="font-semibold text-gray-900 mb-4">Trip Details</h2>

        <!-- Destinations -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Destinations</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="dest in availableDestinations"
              :key="dest"
              @click="toggleDestination(dest)"
              class="px-3 py-1.5 text-sm rounded-full transition-colors"
              :class="destinations.includes(dest)
                ? 'bg-primary-100 text-primary-700 font-medium'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
            >
              {{ dest }}
            </button>
          </div>
        </div>

        <!-- Duration -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Duration: {{ duration }} days
          </label>
          <input
            v-model.number="duration"
            type="range"
            min="1"
            max="30"
            class="w-full"
          />
        </div>

        <!-- Activities -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Activities</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="act in availableActivities"
              :key="act.value"
              @click="toggleActivity(act.value)"
              class="px-3 py-1.5 text-sm rounded-full transition-colors"
              :class="activities.includes(act.value)
                ? 'bg-primary-100 text-primary-700 font-medium'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
            >
              {{ act.label }}
            </button>
          </div>
        </div>

        <!-- Temple toggle -->
        <div class="mb-6">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="includeTemples"
              type="checkbox"
              class="w-4 h-4 rounded border-gray-300 text-primary-600"
            />
            <span class="text-sm text-gray-700">Include temple-appropriate clothing</span>
          </label>
        </div>

        <!-- Generate button -->
        <button
          @click="generatePackingList"
          :disabled="loading"
          class="btn-thai w-full flex items-center justify-center gap-2"
        >
          <LoadingOutlined v-if="loading" class="animate-spin" />
          <ReloadOutlined v-else />
          {{ loading ? 'Generating...' : packingList ? 'Regenerate List' : 'Generate Packing List' }}
        </button>
      </div>

      <!-- Packing List -->
      <div v-if="packingList">
        <!-- Progress bar -->
        <div class="mb-6 print:hidden">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700">Packing Progress</span>
            <span class="text-sm text-primary-600 font-bold">{{ progress }}%</span>
          </div>
          <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-300"
              :style="{ width: `${progress}%` }"
            />
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 mb-6 print:hidden">
          <button
            @click="copyToClipboard"
            class="btn-thai-outline flex items-center gap-2"
          >
            <CopyOutlined />
            {{ copied ? 'Copied!' : 'Copy List' }}
          </button>
          <button
            @click="printList"
            class="btn-thai-outline flex items-center gap-2"
          >
            <PrinterOutlined />
            Print
          </button>
        </div>

        <!-- Categories -->
        <div class="space-y-6">
          <div
            v-for="category in packingList.categories"
            :key="category.name"
            class="card-thai"
          >
            <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span class="text-xl">{{ category.icon }}</span>
              {{ category.name }}
            </h3>

            <div class="space-y-2">
              <div
                v-for="item in category.items"
                :key="item.item"
                @click="toggleItem(item.item)"
                class="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors"
                :class="checkedItems.has(item.item) ? 'bg-green-50' : 'hover:bg-gray-50'"
              >
                <div
                  class="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
                  :class="checkedItems.has(item.item)
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300'"
                >
                  <CheckOutlined v-if="checkedItems.has(item.item)" class="text-xs" />
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span
                      :class="checkedItems.has(item.item) ? 'line-through text-gray-400' : 'text-gray-900'"
                    >
                      {{ item.item }}
                    </span>
                    <span
                      class="px-2 py-0.5 text-xs rounded-full border print:hidden"
                      :class="priorityStyles[item.priority]"
                    >
                      {{ item.priority }}
                    </span>
                  </div>
                  <p v-if="item.reason" class="text-xs text-gray-500 mt-1">
                    {{ item.reason }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tips -->
        <div v-if="packingList.tips.length" class="card-thai mt-6 bg-blue-50 border-blue-200">
          <h3 class="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            💡 Packing Tips
          </h3>
          <ul class="space-y-2">
            <li
              v-for="(tip, i) in packingList.tips"
              :key="i"
              class="text-sm text-blue-800 flex items-start gap-2"
            >
              <span class="text-blue-500">•</span>
              {{ tip }}
            </li>
          </ul>
        </div>

        <!-- Warnings -->
        <div v-if="packingList.warnings.length" class="card-thai mt-4 bg-amber-50 border-amber-200">
          <h3 class="font-semibold text-amber-900 mb-3 flex items-center gap-2">
            ⚠️ Important Notices
          </h3>
          <ul class="space-y-2">
            <li
              v-for="(warning, i) in packingList.warnings"
              :key="i"
              class="text-sm text-amber-800 flex items-start gap-2"
            >
              <span class="text-amber-500">•</span>
              {{ warning }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="!loading" class="text-center py-16">
        <span class="text-5xl mb-4 block">🎒</span>
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          Configure your trip details above
        </h3>
        <p class="text-gray-500">
          We'll generate a personalized packing list based on your destinations, activities, and weather.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media print {
  .print\\:hidden {
    display: none !important;
  }
  .print\\:bg-white {
    background: white !important;
  }
}
</style>
