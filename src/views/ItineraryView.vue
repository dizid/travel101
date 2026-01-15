<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '@stores/userStore'
import { useAI } from '@/composables/useAI'
import AIChat from '@/components/features/AIChat.vue'
import {
  CalendarOutlined,
  PlusOutlined,
  LockOutlined,
  CrownFilled,
  EnvironmentOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  RocketOutlined,
  MessageOutlined,
} from '@ant-design/icons-vue'

const userStore = useUserStore()
const { ask } = useAI()
const showChat = ref(false)

const isPro = computed(() => userStore.isPro)

// Sample itinerary structure
const sampleItinerary = ref({
  name: 'My Thailand Adventure',
  startDate: '2024-02-15',
  endDate: '2024-02-28',
  days: [
    {
      date: '2024-02-15',
      location: 'Bangkok',
      activities: [
        { time: '09:00', title: 'Arrive at BKK', type: 'transport' },
        { time: '12:00', title: 'Check in at hotel', type: 'accommodation' },
        { time: '15:00', title: 'Visit Grand Palace', type: 'attraction' },
        { time: '19:00', title: 'Street food at Yaowarat', type: 'food' },
      ],
    },
    {
      date: '2024-02-16',
      location: 'Bangkok',
      activities: [
        { time: '08:00', title: 'Wat Arun at sunrise', type: 'attraction' },
        { time: '11:00', title: 'Chatuchak Market', type: 'shopping' },
        { time: '18:00', title: 'Rooftop bar at Lebua', type: 'nightlife' },
      ],
    },
  ],
})

const activityIcons: Record<string, string> = {
  transport: '✈️',
  accommodation: '🏨',
  attraction: '🏛️',
  food: '🍜',
  shopping: '🛍️',
  nightlife: '🌙',
  beach: '🏖️',
  nature: '🌿',
}

const isGenerating = ref(false)

async function generateWithAI() {
  isGenerating.value = true
  try {
    const prefs = userStore.profile.prefs
    const prompt = `Create a detailed ${sampleItinerary.value.days.length}-day Thailand itinerary for a ${prefs.tripType} traveler.
Travel style: ${prefs.travelStyle.join(', ') || 'relaxation'}
Interests: ${prefs.interests.join(', ') || 'culture, food'}
Budget: ${prefs.budget}
Group: ${prefs.groupType}

Please provide a day-by-day plan with specific times, locations, and activities.`

    const response = await ask(prompt)
    if (response) {
      console.log('AI Generated itinerary:', response)
    }
  } finally {
    isGenerating.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-50 to-white">
    <!-- Header -->
    <div class="bg-white border-b border-gray-100">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white shadow-thai">
              <CalendarOutlined class="text-2xl" />
            </div>
            <div>
              <h1 class="text-2xl font-display font-bold text-gray-900">
                Trip Planner
              </h1>
              <p class="text-gray-500">
                Plan your perfect Thailand adventure
              </p>
            </div>
          </div>

          <div v-if="isPro" class="flex gap-2">
            <button
              @click="generateWithAI"
              :disabled="isGenerating"
              class="btn-thai flex items-center gap-2"
            >
              <RocketOutlined :class="{ 'animate-spin': isGenerating }" />
              {{ isGenerating ? 'Generating...' : 'Generate with AI' }}
            </button>
            <button
              @click="showChat = !showChat"
              class="btn-thai-outline flex items-center gap-2"
            >
              <MessageOutlined />
              Ask AI
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <!-- Pro Gate -->
      <div
        v-if="!isPro"
        class="card-thai text-center py-12"
      >
        <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
          <LockOutlined class="text-3xl text-amber-600" />
        </div>
        <h2 class="text-2xl font-display font-bold text-gray-900 mb-3">
          Unlock AI Trip Planning
        </h2>
        <p class="text-gray-600 max-w-md mx-auto mb-6">
          Get personalized itineraries crafted by AI based on your travel style, interests, and budget. Perfect for first-timers and seasoned travelers alike!
        </p>

        <div class="grid sm:grid-cols-3 gap-4 max-w-xl mx-auto mb-8">
          <div class="p-4 rounded-xl bg-gray-50">
            <span class="text-2xl block mb-2">🎯</span>
            <span class="text-sm font-medium text-gray-700">Personalized</span>
          </div>
          <div class="p-4 rounded-xl bg-gray-50">
            <span class="text-2xl block mb-2">📍</span>
            <span class="text-sm font-medium text-gray-700">Day-by-day</span>
          </div>
          <div class="p-4 rounded-xl bg-gray-50">
            <span class="text-2xl block mb-2">💡</span>
            <span class="text-sm font-medium text-gray-700">Smart Tips</span>
          </div>
        </div>

        <RouterLink
          to="/dashboard#pro"
          class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          <CrownFilled />
          Upgrade to Pro - $10/mo
        </RouterLink>
      </div>

      <!-- Itinerary Builder (Pro users) -->
      <div v-else class="space-y-6">
        <!-- Quick actions -->
        <div class="flex flex-wrap gap-3">
          <button class="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50 transition-all flex items-center gap-2">
            <PlusOutlined />
            New Itinerary
          </button>
          <button class="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50 transition-all flex items-center gap-2">
            <EditOutlined />
            Edit Current
          </button>
        </div>

        <!-- Itinerary header -->
        <div class="card-thai">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h2 class="text-xl font-semibold text-gray-900">
                {{ sampleItinerary.name }}
              </h2>
              <p class="text-gray-500 flex items-center gap-2 mt-1">
                <CalendarOutlined />
                {{ sampleItinerary.startDate }} → {{ sampleItinerary.endDate }}
              </p>
            </div>
            <span class="badge-thai text-xs">
              {{ sampleItinerary.days.length }} days
            </span>
          </div>

          <div class="flex flex-wrap gap-2">
            <span class="px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-sm">
              Bangkok
            </span>
            <span class="px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-sm">
              Chiang Mai
            </span>
            <span class="px-3 py-1 rounded-full bg-coral-100 text-coral-700 text-sm">
              Phuket
            </span>
          </div>
        </div>

        <!-- Day by day -->
        <div class="space-y-4">
          <div
            v-for="(day, index) in sampleItinerary.days"
            :key="day.date"
            class="card-thai"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                  <span class="font-bold text-primary-600">{{ index + 1 }}</span>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900">Day {{ index + 1 }}</h3>
                  <p class="text-sm text-gray-500 flex items-center gap-1">
                    <EnvironmentOutlined />
                    {{ day.location }}
                  </p>
                </div>
              </div>
              <span class="text-sm text-gray-400">{{ day.date }}</span>
            </div>

            <div class="space-y-3">
              <div
                v-for="activity in day.activities"
                :key="activity.time"
                class="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
              >
                <span class="text-xl">{{ activityIcons[activity.type] || '📌' }}</span>
                <div class="flex-1">
                  <p class="font-medium text-gray-900">{{ activity.title }}</p>
                  <p class="text-sm text-gray-500 flex items-center gap-1">
                    <ClockCircleOutlined />
                    {{ activity.time }}
                  </p>
                </div>
                <button class="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all">
                  <DeleteOutlined />
                </button>
              </div>

              <button class="w-full p-3 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-all flex items-center justify-center gap-2">
                <PlusOutlined />
                Add activity
              </button>
            </div>
          </div>
        </div>

        <!-- Add day button -->
        <button class="w-full p-4 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-primary-300 hover:text-primary-600 transition-all flex items-center justify-center gap-2 bg-white">
          <PlusOutlined />
          Add another day
        </button>
      </div>
    </div>

    <!-- AI Chat Drawer -->
    <Transition
      enter-active-class="transition-transform duration-300"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-300"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div
        v-if="showChat"
        class="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 shadow-2xl"
      >
        <div class="absolute inset-0 bg-black/20" @click="showChat = false" />
        <div class="absolute right-0 top-0 bottom-0 w-full max-w-md">
          <AIChat class="h-full" />
        </div>
      </div>
    </Transition>
  </div>
</template>
