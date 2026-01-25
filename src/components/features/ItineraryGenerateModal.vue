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
  generate: [params: { duration: number; destinations: string[] }]
}>()

const generateForm = ref({
  duration: 7,
  destinations: ['Bangkok', 'Chiang Mai'],
  customDestination: '',
})

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

          <!-- Profile note -->
          <div class="p-4 rounded-xl bg-blue-50 border border-blue-200 mb-6">
            <p class="text-sm text-blue-700">
              Your trip will be tailored to your profile preferences:
              <span class="font-medium">{{ userPrefs.travelStyle?.join(', ') || 'relaxation' }}</span>,
              <span class="font-medium">{{ userPrefs.budget || 'mid' }} budget</span>,
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
