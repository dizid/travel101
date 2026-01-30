<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  RocketOutlined,
  LoadingOutlined,
} from '@ant-design/icons-vue'

interface Props {
  visible: boolean
  generating: boolean
  userPrefs: {
    travelStyle?: string[]
    budget?: string
    interests?: string[]
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  generate: [params: {
    duration: number
    destinations: string[]
    budgetMode: 'budget' | 'comfort' | 'luxury'
    travelPace: 'relaxed' | 'moderate' | 'packed'
    tripFocus: string[]
  }]
}>()

const generateForm = ref({
  duration: 7,
  destinations: ['Bangkok', 'Chiang Mai'],
  customDestination: '',
  budgetMode: 'comfort' as 'budget' | 'comfort' | 'luxury',
  travelPace: 'moderate' as 'relaxed' | 'moderate' | 'packed',
  tripFocus: [] as string[],
})

const budgetModes = [
  { id: 'budget', label: 'Budget', icon: '💰', description: '฿500-1,000/day', dailyBudget: '500-1000 THB' },
  { id: 'comfort', label: 'Comfort', icon: '✨', description: '฿1,500-3,000/day', dailyBudget: '1500-3000 THB' },
  { id: 'luxury', label: 'Luxury', icon: '👑', description: '฿5,000+/day', dailyBudget: '5000+ THB' },
]

const travelPaces = [
  { id: 'relaxed', label: 'Relaxed', icon: '🧘', description: '2-3 activities/day' },
  { id: 'moderate', label: 'Moderate', icon: '🚶', description: '4-5 activities/day' },
  { id: 'packed', label: 'Packed', icon: '🏃', description: '6+ activities/day' },
]

const tripFocusOptions = [
  { id: 'beaches', label: 'Beaches', icon: '🏖️' },
  { id: 'culture', label: 'Culture', icon: '🏛️' },
  { id: 'adventure', label: 'Adventure', icon: '🧗' },
  { id: 'food', label: 'Food', icon: '🍜' },
  { id: 'nightlife', label: 'Nightlife', icon: '🌙' },
  { id: 'nature', label: 'Nature', icon: '🌿' },
  { id: 'wellness', label: 'Wellness', icon: '🧘' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
]

function toggleTripFocus(focus: string) {
  const idx = generateForm.value.tripFocus.indexOf(focus)
  if (idx >= 0) {
    generateForm.value.tripFocus.splice(idx, 1)
  } else if (generateForm.value.tripFocus.length < 3) {
    generateForm.value.tripFocus.push(focus)
  }
}

const destinationOptions = [
  'Bangkok',
  'Chiang Mai',
  'Phuket',
  'Krabi',
  'Koh Samui',
  'Pattaya',
  'Hua Hin',
  'Koh Phangan',
  'Koh Tao',
  'Pai',
  'Chiang Rai',
  'Ayutthaya',
]

function toggleDestination(dest: string) {
  const idx = generateForm.value.destinations.indexOf(dest)
  if (idx >= 0) {
    generateForm.value.destinations.splice(idx, 1)
  } else {
    generateForm.value.destinations.push(dest)
  }
}

function handleGenerate() {
  const destinations = [...generateForm.value.destinations]
  if (generateForm.value.customDestination) {
    destinations.push(generateForm.value.customDestination)
  }
  emit('generate', {
    duration: generateForm.value.duration,
    destinations,
    budgetMode: generateForm.value.budgetMode,
    travelPace: generateForm.value.travelPace,
    tripFocus: generateForm.value.tripFocus,
  })
}

const canGenerate = computed(() => {
  return !props.generating && generateForm.value.destinations.length > 0
})
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    leave-active-class="transition-opacity duration-200"
    leave-to-class="opacity-0"
  >
    <div
      v-if="visible"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="emit('close')"
    >
      <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
              <RocketOutlined class="text-xl" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-900">Generate AI Itinerary</h2>
              <p class="text-sm text-gray-500">We'll create a personalized trip based on your preferences</p>
            </div>
          </div>

          <!-- Duration -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Trip Duration</label>
            <div class="flex gap-2">
              <button
                v-for="days in [3, 5, 7, 10, 14]"
                :key="days"
                @click="generateForm.duration = days"
                :class="[
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  generateForm.duration === days
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                ]"
              >
                {{ days }} days
              </button>
            </div>
          </div>

          <!-- Destinations -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Destinations</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="dest in destinationOptions"
                :key="dest"
                @click="toggleDestination(dest)"
                :class="[
                  'px-3 py-1.5 rounded-lg text-sm transition-all',
                  generateForm.destinations.includes(dest)
                    ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-500'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                ]"
              >
                {{ dest }}
              </button>
            </div>
            <input
              v-model="generateForm.customDestination"
              placeholder="Add another destination..."
              class="input-thai mt-3 text-sm"
            />
          </div>

          <!-- Budget Mode -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Budget Level</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="mode in budgetModes"
                :key="mode.id"
                @click="generateForm.budgetMode = mode.id as typeof generateForm.budgetMode"
                :class="[
                  'p-3 rounded-xl text-center transition-all border-2',
                  generateForm.budgetMode === mode.id
                    ? 'bg-primary-50 border-primary-500 text-primary-700'
                    : 'bg-gray-50 border-transparent text-gray-600 hover:bg-gray-100'
                ]"
              >
                <span class="text-xl block mb-1">{{ mode.icon }}</span>
                <span class="text-sm font-medium block">{{ mode.label }}</span>
                <span class="text-xs text-gray-500 block">{{ mode.description }}</span>
              </button>
            </div>
          </div>

          <!-- Travel Pace -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Travel Pace</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="pace in travelPaces"
                :key="pace.id"
                @click="generateForm.travelPace = pace.id as typeof generateForm.travelPace"
                :class="[
                  'p-3 rounded-xl text-center transition-all border-2',
                  generateForm.travelPace === pace.id
                    ? 'bg-primary-50 border-primary-500 text-primary-700'
                    : 'bg-gray-50 border-transparent text-gray-600 hover:bg-gray-100'
                ]"
              >
                <span class="text-xl block mb-1">{{ pace.icon }}</span>
                <span class="text-sm font-medium block">{{ pace.label }}</span>
                <span class="text-xs text-gray-500 block">{{ pace.description }}</span>
              </button>
            </div>
          </div>

          <!-- Trip Focus -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Trip Focus <span class="text-gray-400 font-normal">(optional, max 3)</span></label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="focus in tripFocusOptions"
                :key="focus.id"
                @click="toggleTripFocus(focus.id)"
                :class="[
                  'px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-1.5',
                  generateForm.tripFocus.includes(focus.id)
                    ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-500'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                  generateForm.tripFocus.length >= 3 && !generateForm.tripFocus.includes(focus.id)
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                ]"
              >
                <span>{{ focus.icon }}</span>
                {{ focus.label }}
              </button>
            </div>
          </div>

          <!-- Profile note -->
          <div class="p-4 rounded-xl bg-blue-50 border border-blue-200 mb-6">
            <p class="text-sm text-blue-700">
              Your trip will also incorporate your profile preferences:
              <span class="font-medium">{{ userPrefs.travelStyle?.join(', ') || 'relaxation' }}</span> style,
              interested in <span class="font-medium">{{ userPrefs.interests?.join(', ') || 'culture, food' }}</span>
            </p>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              @click="emit('close')"
              class="flex-1 btn-thai-outline"
            >
              Cancel
            </button>
            <button
              @click="handleGenerate"
              :disabled="!canGenerate"
              class="flex-1 btn-thai flex items-center justify-center gap-2"
            >
              <LoadingOutlined v-if="generating" class="animate-spin" />
              <RocketOutlined v-else />
              {{ generating ? 'Generating...' : 'Generate Trip' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
