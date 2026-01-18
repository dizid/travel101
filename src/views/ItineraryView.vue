<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@stores/userStore'
import { useItinerary } from '@/composables/useItinerary'
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
  CheckOutlined,
  ArrowLeftOutlined,
  LoadingOutlined,
  StarFilled,
  DollarOutlined,
} from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const {
  itineraries,
  currentItinerary,
  loading,
  generating,
  isPro,
  fetchItineraries,
  fetchItinerary,
  createItinerary,
  generateItinerary,
  updateItinerary,
  deleteItinerary,
  addDay,
  updateDay,
  deleteDay,
  addActivity,
  updateActivity,
  deleteActivity,
  getTripDuration,
  getTotalBudget,
  getLocations,
} = useItinerary()

import type { ItineraryActivity } from '@/composables/useItinerary'

// UI state
const view = ref<'list' | 'detail' | 'create'>('list')
const showGenerateModal = ref(false)
const editingName = ref(false)
const editedName = ref('')

// Activity modal state
const showActivityModal = ref(false)
const activityModalMode = ref<'add' | 'edit'>('add')
const activityModalDayId = ref<string>('')
const activityForm = ref({
  id: '',
  title: '',
  description: '',
  timeSlot: '09:00',
  activityType: 'attraction',
  durationMinutes: 60,
  estimatedCostThb: 0,
})

// Day edit state
const editingDayId = ref<string | null>(null)
const editedLocation = ref('')

// Generate form state
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

const activityIcons: Record<string, string> = {
  transport: '✈️',
  accommodation: '🏨',
  attraction: '🏛️',
  food: '🍜',
  shopping: '🛍️',
  nightlife: '🌙',
  beach: '🏖️',
  nature: '🌿',
  wellness: '🧘',
}

onMounted(async () => {
  if (isPro.value) {
    await fetchItineraries()

    const id = route.query.id as string
    if (id) {
      await fetchItinerary(id)
      view.value = 'detail'
    }
  }
})

watch(() => route.query.id, async (newId) => {
  if (newId && isPro.value) {
    await fetchItinerary(newId as string)
    view.value = 'detail'
  } else {
    view.value = 'list'
  }
})

async function handleGenerate() {
  const destinations = [...generateForm.value.destinations]
  if (generateForm.value.customDestination) {
    destinations.push(generateForm.value.customDestination)
  }

  const result = await generateItinerary({
    duration: generateForm.value.duration,
    destinations,
    interests: userStore.profile.prefs.interests,
    travelStyle: userStore.profile.prefs.travelStyle,
    budget: userStore.profile.prefs.budget,
    groupType: userStore.profile.prefs.groupType,
  })

  if (result) {
    showGenerateModal.value = false
    router.push({ query: { id: result.itinerary.id } })
  }
}

async function handleCreateEmpty() {
  const itinerary = await createItinerary({
    name: 'New Thailand Trip',
    days: [
      { dayNumber: 1, location: 'Bangkok', activities: [] },
      { dayNumber: 2, location: 'Bangkok', activities: [] },
      { dayNumber: 3, location: 'Bangkok', activities: [] },
    ],
  })
  if (itinerary) {
    router.push({ query: { id: itinerary.id } })
  }
}

async function handleDelete(id: string) {
  if (confirm('Are you sure you want to delete this itinerary?')) {
    await deleteItinerary(id)
    view.value = 'list'
    router.push({ query: {} })
  }
}

async function handleSaveName() {
  if (currentItinerary.value && editedName.value.trim()) {
    await updateItinerary(currentItinerary.value.id, { name: editedName.value.trim() })
    editingName.value = false
  }
}

function startEditName() {
  if (currentItinerary.value) {
    editedName.value = currentItinerary.value.name
    editingName.value = true
  }
}

function goBack() {
  router.push({ query: {} })
  view.value = 'list'
  currentItinerary.value = null
}

function toggleDestination(dest: string) {
  const idx = generateForm.value.destinations.indexOf(dest)
  if (idx >= 0) {
    generateForm.value.destinations.splice(idx, 1)
  } else {
    generateForm.value.destinations.push(dest)
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatBudget(thb: number) {
  if (thb >= 1000) {
    return `฿${(thb / 1000).toFixed(1)}k`
  }
  return `฿${thb}`
}

// Day handlers
async function handleAddDay() {
  if (!currentItinerary.value) return
  const lastDay = currentItinerary.value.days?.slice(-1)[0]
  await addDay(currentItinerary.value.id, {
    location: lastDay?.location || 'Bangkok',
  })
}

async function handleDeleteDay(dayId: string) {
  if (confirm('Delete this day and all its activities?')) {
    await deleteDay(dayId)
  }
}

function startEditDayLocation(dayId: string, currentLocation: string) {
  editingDayId.value = dayId
  editedLocation.value = currentLocation
}

async function saveEditDayLocation(dayId: string) {
  if (editedLocation.value.trim()) {
    await updateDay(dayId, { location: editedLocation.value.trim() })
  }
  editingDayId.value = null
}

// Activity handlers
function openAddActivityModal(dayId: string) {
  activityModalMode.value = 'add'
  activityModalDayId.value = dayId
  activityForm.value = {
    id: '',
    title: '',
    description: '',
    timeSlot: '09:00',
    activityType: 'attraction',
    durationMinutes: 60,
    estimatedCostThb: 0,
  }
  showActivityModal.value = true
}

function openEditActivityModal(activity: ItineraryActivity, dayId: string) {
  activityModalMode.value = 'edit'
  activityModalDayId.value = dayId
  activityForm.value = {
    id: activity.id,
    title: activity.title,
    description: activity.description || '',
    timeSlot: activity.timeSlot || '09:00',
    activityType: activity.activityType || 'attraction',
    durationMinutes: activity.durationMinutes || 60,
    estimatedCostThb: activity.estimatedCostThb || 0,
  }
  showActivityModal.value = true
}

async function handleSaveActivity() {
  if (!activityForm.value.title.trim()) return

  if (activityModalMode.value === 'add') {
    await addActivity(activityModalDayId.value, {
      title: activityForm.value.title.trim(),
      description: activityForm.value.description.trim() || undefined,
      timeSlot: activityForm.value.timeSlot,
      activityType: activityForm.value.activityType,
      durationMinutes: activityForm.value.durationMinutes || undefined,
      estimatedCostThb: activityForm.value.estimatedCostThb || undefined,
    })
  } else {
    await updateActivity(activityForm.value.id, {
      title: activityForm.value.title.trim(),
      description: activityForm.value.description.trim() || undefined,
      timeSlot: activityForm.value.timeSlot,
      activityType: activityForm.value.activityType,
      durationMinutes: activityForm.value.durationMinutes || undefined,
      estimatedCostThb: activityForm.value.estimatedCostThb || undefined,
    })
  }

  showActivityModal.value = false
}

async function handleDeleteActivity(activityId: string) {
  if (confirm('Delete this activity?')) {
    await deleteActivity(activityId)
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
            <button
              v-if="view === 'detail'"
              @click="goBack"
              class="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ArrowLeftOutlined />
            </button>
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white shadow-thai">
              <CalendarOutlined class="text-2xl" />
            </div>
            <div>
              <h1 class="text-2xl font-display font-bold text-gray-900">
                {{ view === 'detail' && currentItinerary ? currentItinerary.name : 'Trip Planner' }}
              </h1>
              <p class="text-gray-500">
                {{ view === 'detail' ? 'Edit your itinerary' : 'Plan your perfect Thailand adventure' }}
              </p>
            </div>
          </div>

          <div v-if="isPro && view === 'list'" class="flex gap-2">
            <button
              @click="showGenerateModal = true"
              class="btn-thai flex items-center gap-2"
            >
              <RocketOutlined />
              Generate with AI
            </button>
            <button
              @click="handleCreateEmpty"
              class="btn-thai-outline flex items-center gap-2"
            >
              <PlusOutlined />
              Blank Trip
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <!-- Pro Gate -->
      <div v-if="!isPro" class="card-thai text-center py-12">
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

      <!-- Loading -->
      <div v-else-if="loading" class="text-center py-12">
        <LoadingOutlined class="text-4xl text-primary-500 animate-spin" />
        <p class="text-gray-500 mt-4">Loading your trips...</p>
      </div>

      <!-- List View -->
      <div v-else-if="view === 'list'" class="space-y-6">
        <!-- Empty State -->
        <div v-if="itineraries.length === 0" class="card-thai text-center py-12">
          <span class="text-5xl block mb-4">🗺️</span>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">No trips yet</h3>
          <p class="text-gray-500 mb-6">Create your first AI-powered itinerary or start from scratch.</p>
          <div class="flex justify-center gap-3">
            <button @click="showGenerateModal = true" class="btn-thai">
              <RocketOutlined />
              Generate with AI
            </button>
            <button @click="handleCreateEmpty" class="btn-thai-outline">
              <PlusOutlined />
              Start Blank
            </button>
          </div>
        </div>

        <!-- Itinerary Cards -->
        <div v-else class="grid gap-4">
          <div
            v-for="itinerary in itineraries"
            :key="itinerary.id"
            @click="router.push({ query: { id: itinerary.id } })"
            class="card-thai cursor-pointer hover:shadow-lg transition-all group"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <h3 class="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {{ itinerary.name }}
                  </h3>
                  <span v-if="itinerary.aiGenerated" class="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                    AI Generated
                  </span>
                  <span
                    :class="[
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      itinerary.status === 'active' ? 'bg-green-100 text-green-700' :
                      itinerary.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    ]"
                  >
                    {{ itinerary.status }}
                  </span>
                </div>

                <div class="flex flex-wrap gap-4 text-sm text-gray-500">
                  <span v-if="itinerary.startDate" class="flex items-center gap-1">
                    <CalendarOutlined />
                    {{ formatDate(itinerary.startDate) }}
                    <span v-if="itinerary.endDate"> → {{ formatDate(itinerary.endDate) }}</span>
                  </span>
                  <span v-if="itinerary.dayCount" class="flex items-center gap-1">
                    <ClockCircleOutlined />
                    {{ itinerary.dayCount }} days
                  </span>
                </div>
              </div>

              <button
                @click.stop="handleDelete(itinerary.id)"
                class="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <DeleteOutlined />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Detail View -->
      <div v-else-if="view === 'detail' && currentItinerary" class="space-y-6">
        <!-- Itinerary Header Card -->
        <div class="card-thai">
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <div v-if="editingName" class="flex items-center gap-2">
                <input
                  v-model="editedName"
                  @keyup.enter="handleSaveName"
                  class="input-thai text-xl font-semibold"
                  autofocus
                />
                <button @click="handleSaveName" class="btn-thai-ghost p-2">
                  <CheckOutlined />
                </button>
              </div>
              <h2 v-else class="text-xl font-semibold text-gray-900 flex items-center gap-2">
                {{ currentItinerary.name }}
                <button @click="startEditName" class="p-1 text-gray-400 hover:text-gray-600">
                  <EditOutlined class="text-sm" />
                </button>
              </h2>

              <div class="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                <span v-if="currentItinerary.startDate" class="flex items-center gap-1">
                  <CalendarOutlined />
                  {{ formatDate(currentItinerary.startDate) }}
                  <span v-if="currentItinerary.endDate"> → {{ formatDate(currentItinerary.endDate) }}</span>
                </span>
                <span class="flex items-center gap-1">
                  <ClockCircleOutlined />
                  {{ getTripDuration(currentItinerary) }} days
                </span>
                <span v-if="getTotalBudget(currentItinerary)" class="flex items-center gap-1">
                  <DollarOutlined />
                  {{ formatBudget(getTotalBudget(currentItinerary)) }} estimated
                </span>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <span v-if="currentItinerary.aiGenerated" class="badge-thai flex items-center gap-1">
                <StarFilled class="text-xs" />
                AI Generated
              </span>
            </div>
          </div>

          <!-- Locations -->
          <div v-if="getLocations(currentItinerary).length > 0" class="flex flex-wrap gap-2">
            <span
              v-for="location in getLocations(currentItinerary)"
              :key="location"
              class="px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-sm"
            >
              <EnvironmentOutlined class="mr-1" />
              {{ location }}
            </span>
          </div>

          <!-- Notes/Tips -->
          <div v-if="currentItinerary.notes" class="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <h4 class="font-medium text-amber-800 mb-2">Pro Tips</h4>
            <p class="text-sm text-amber-700 whitespace-pre-line">• {{ currentItinerary.notes }}</p>
          </div>
        </div>

        <!-- Days -->
        <div v-if="currentItinerary.days" class="space-y-4">
          <div
            v-for="(day, index) in currentItinerary.days"
            :key="day.id"
            class="card-thai"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                  <span class="font-bold text-primary-600">{{ index + 1 }}</span>
                </div>
                <div class="flex-1">
                  <h3 class="font-semibold text-gray-900">Day {{ day.dayNumber }}</h3>
                  <div v-if="editingDayId === day.id" class="flex items-center gap-2 mt-1">
                    <input
                      v-model="editedLocation"
                      @keyup.enter="saveEditDayLocation(day.id)"
                      @blur="saveEditDayLocation(day.id)"
                      class="input-thai text-sm py-1"
                      autofocus
                    />
                  </div>
                  <p v-else class="text-sm text-gray-500 flex items-center gap-1 cursor-pointer hover:text-primary-600" @click="startEditDayLocation(day.id, day.location)">
                    <EnvironmentOutlined />
                    {{ day.location }}
                    <EditOutlined class="text-xs opacity-0 group-hover:opacity-100" />
                    <span v-if="day.date" class="ml-2 text-gray-400">{{ formatDate(day.date) }}</span>
                  </p>
                </div>
              </div>
              <button
                @click="handleDeleteDay(day.id)"
                class="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Delete day"
              >
                <DeleteOutlined />
              </button>
            </div>

            <div class="space-y-3">
              <div
                v-for="activity in day.activities"
                :key="activity.id"
                class="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group cursor-pointer"
                @click="openEditActivityModal(activity, day.id)"
              >
                <span class="text-xl">{{ activityIcons[activity.activityType || 'attraction'] || '📌' }}</span>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900">{{ activity.title }}</p>
                  <p v-if="activity.description" class="text-sm text-gray-600 mt-1">{{ activity.description }}</p>
                  <div class="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                    <span v-if="activity.timeSlot" class="flex items-center gap-1">
                      <ClockCircleOutlined />
                      {{ activity.timeSlot }}
                    </span>
                    <span v-if="activity.durationMinutes" class="flex items-center gap-1">
                      ⏱️ {{ activity.durationMinutes }}min
                    </span>
                    <span v-if="activity.estimatedCostThb" class="flex items-center gap-1">
                      💰 ฿{{ activity.estimatedCostThb }}
                    </span>
                  </div>
                </div>
                <button
                  @click.stop="handleDeleteActivity(activity.id)"
                  class="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete activity"
                >
                  <DeleteOutlined />
                </button>
              </div>

              <button
                @click="openAddActivityModal(day.id)"
                class="w-full p-3 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-all flex items-center justify-center gap-2"
              >
                <PlusOutlined />
                Add activity
              </button>
            </div>
          </div>

          <!-- Add day button -->
          <button
            @click="handleAddDay"
            class="w-full p-4 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-primary-300 hover:text-primary-600 transition-all flex items-center justify-center gap-2 bg-white"
          >
            <PlusOutlined />
            Add another day
          </button>
        </div>
      </div>
    </div>

    <!-- Generate Modal -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-200"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showGenerateModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        @click.self="showGenerateModal = false"
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
                <span class="font-medium">{{ userStore.profile.prefs.travelStyle?.join(', ') || 'relaxation' }}</span>,
                <span class="font-medium">{{ userStore.profile.prefs.budget || 'mid' }} budget</span>,
                interested in <span class="font-medium">{{ userStore.profile.prefs.interests?.join(', ') || 'culture, food' }}</span>
              </p>
            </div>

            <!-- Actions -->
            <div class="flex gap-3">
              <button
                @click="showGenerateModal = false"
                class="flex-1 btn-thai-outline"
              >
                Cancel
              </button>
              <button
                @click="handleGenerate"
                :disabled="generating || generateForm.destinations.length === 0"
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

    <!-- Activity Modal -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-200"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showActivityModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        @click.self="showActivityModal = false"
      >
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full">
          <div class="p-6">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white">
                {{ activityIcons[activityForm.activityType] || '📌' }}
              </div>
              <div>
                <h2 class="text-xl font-bold text-gray-900">
                  {{ activityModalMode === 'add' ? 'Add Activity' : 'Edit Activity' }}
                </h2>
                <p class="text-sm text-gray-500">Fill in the details below</p>
              </div>
            </div>

            <!-- Title -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Activity Title</label>
              <input
                v-model="activityForm.title"
                type="text"
                placeholder="e.g., Visit Grand Palace"
                class="input-thai"
              />
            </div>

            <!-- Activity Type -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="(icon, type) in activityIcons"
                  :key="type"
                  @click="activityForm.activityType = type"
                  :class="[
                    'px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1',
                    activityForm.activityType === type
                      ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  ]"
                >
                  {{ icon }} {{ type }}
                </button>
              </div>
            </div>

            <!-- Time & Duration -->
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  v-model="activityForm.timeSlot"
                  type="time"
                  class="input-thai"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                <input
                  v-model.number="activityForm.durationMinutes"
                  type="number"
                  min="0"
                  step="15"
                  class="input-thai"
                />
              </div>
            </div>

            <!-- Cost -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Estimated Cost (THB)</label>
              <input
                v-model.number="activityForm.estimatedCostThb"
                type="number"
                min="0"
                step="100"
                placeholder="0"
                class="input-thai"
              />
            </div>

            <!-- Description -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                v-model="activityForm.description"
                rows="2"
                placeholder="Any tips or details..."
                class="input-thai"
              />
            </div>

            <!-- Actions -->
            <div class="flex gap-3">
              <button
                @click="showActivityModal = false"
                class="flex-1 btn-thai-outline"
              >
                Cancel
              </button>
              <button
                @click="handleSaveActivity"
                :disabled="!activityForm.title.trim()"
                class="flex-1 btn-thai flex items-center justify-center gap-2"
              >
                <CheckOutlined />
                {{ activityModalMode === 'add' ? 'Add Activity' : 'Save Changes' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
