<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@stores/userStore'
import { useItinerary } from '@/composables/useItinerary'
import { useApi } from '@/composables/useApi'
import { downloadIcsCalendar, copyItineraryToClipboard, printItinerary } from '@/utils/export'
import ItineraryGenerateModal from '@/components/features/ItineraryGenerateModal.vue'
import ItineraryActivityModal from '@/components/features/ItineraryActivityModal.vue'
import ItineraryCostAnalytics from '@/components/features/ItineraryCostAnalytics.vue'
import ProGate from '@components/ui/ProGate.vue'
import AffiliateButton from '@/components/common/AffiliateButton.vue'
import AffiliateCard from '@/components/common/AffiliateCard.vue'
import { getContextualAffiliate } from '@/utils/affiliates'
import type { ItineraryActivity } from '@/composables/useItinerary'
import {
  CalendarOutlined,
  PlusOutlined,
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
  DownloadOutlined,
  CopyOutlined,
  PrinterOutlined,
  BulbOutlined,
  CloseOutlined,
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

// Cache contextual affiliate lookup per activity to avoid triple calls in template
function getActivityAffiliate(activity: ItineraryActivity, location: string) {
  return getContextualAffiliate(activity.activityType || 'attraction', activity.title, location)
}

// UI state
const view = ref<'list' | 'detail' | 'create'>('list')
const showGenerateModal = ref(false)
const editingName = ref(false)
const editedName = ref('')

// Activity modal state
const showActivityModal = ref(false)
const activityModalMode = ref<'add' | 'edit'>('add')
const activityModalDayId = ref<string>('')
const editingActivity = ref<ItineraryActivity | null>(null)

// Day edit state
const editingDayId = ref<string | null>(null)
const editedLocation = ref('')

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

async function handleGenerate(params: {
  duration: number
  destinations: string[]
  budgetMode: 'budget' | 'comfort' | 'luxury'
  travelPace: 'relaxed' | 'moderate' | 'packed'
  tripFocus: string[]
}) {
  const result = await generateItinerary({
    duration: params.duration,
    destinations: params.destinations,
    interests: userStore.profile.prefs.interests,
    travelStyle: userStore.profile.prefs.travelStyle,
    budget: userStore.profile.prefs.budget,
    groupType: userStore.profile.prefs.groupType,
    budgetMode: params.budgetMode,
    travelPace: params.travelPace,
    tripFocus: params.tripFocus,
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

// Calculate total trip cost for AI suggestions
const totalTripCost = computed(() => {
  if (!currentItinerary.value?.days) return 0
  return currentItinerary.value.days.reduce((sum, day) => {
    return sum + day.activities.reduce((daySum, a) => daySum + (a.estimatedCostThb || 0), 0)
  }, 0)
})

// Export functions
const showCopiedToast = ref(false)

async function handleExportCalendar() {
  if (!currentItinerary.value) return
  downloadIcsCalendar(currentItinerary.value)
}

async function handleCopyItinerary() {
  if (!currentItinerary.value) return
  const success = await copyItineraryToClipboard(currentItinerary.value)
  if (success) {
    showCopiedToast.value = true
    setTimeout(() => {
      showCopiedToast.value = false
    }, 2000)
  }
}

function handlePrint() {
  printItinerary()
}

// AI Suggestions
const { post: postAI } = useApi()
const showAISuggestions = ref(false)
const aiSuggestionsLoading = ref(false)
const aiSuggestions = ref<{ type: string; title: string; description: string }[]>([])

async function getAISuggestions() {
  if (!currentItinerary.value) return

  aiSuggestionsLoading.value = true
  showAISuggestions.value = true
  aiSuggestions.value = []

  try {
    const itineraryData = {
      name: currentItinerary.value.name,
      duration: getTripDuration(currentItinerary.value),
      locations: getLocations(currentItinerary.value),
      totalBudget: totalTripCost.value,
      days: currentItinerary.value.days?.map(day => ({
        dayNumber: day.dayNumber,
        location: day.location,
        activities: day.activities.map(a => ({
          title: a.title,
          type: a.activityType,
          time: a.timeSlot,
        })),
      })),
    }

    const response = await postAI<{ response: string }>('/ai?type=itinerary', {
      message: `Analyze this Thailand itinerary and give me 3-4 specific, actionable suggestions to improve it. Focus on:
1. Missing experiences based on the locations visited
2. Timing or route optimization
3. Budget tips
4. Hidden gems near the planned activities

Itinerary: ${JSON.stringify(itineraryData)}

User preferences: ${JSON.stringify(userStore.profile.prefs)}

Format your response as a JSON array of objects with "type" (optimize/missing/tip/gem), "title" (short), and "description" (1-2 sentences). Only output the JSON array, no other text.`,
      userProfile: userStore.profile.prefs,
      saveToDb: false,
    })

    if (response?.response) {
      try {
        // Try to parse JSON from the response
        const jsonMatch = response.response.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          aiSuggestions.value = JSON.parse(jsonMatch[0])
        }
      } catch {
        // If parsing fails, create a single suggestion from the response
        aiSuggestions.value = [{
          type: 'tip',
          title: 'AI Suggestions',
          description: response.response.slice(0, 200),
        }]
      }
    }
  } catch (error) {
    console.error('Failed to get AI suggestions:', error)
  } finally {
    aiSuggestionsLoading.value = false
  }
}

const suggestionIcons: Record<string, string> = {
  optimize: '🗺️',
  missing: '✨',
  tip: '💡',
  gem: '💎',
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
  editingActivity.value = null
  showActivityModal.value = true
}

function openEditActivityModal(activity: ItineraryActivity, dayId: string) {
  activityModalMode.value = 'edit'
  activityModalDayId.value = dayId
  editingActivity.value = activity
  showActivityModal.value = true
}

async function handleSaveActivity(data: {
  id?: string
  title: string
  description?: string
  timeSlot: string
  activityType: string
  durationMinutes?: number
  estimatedCostThb?: number
}) {
  if (activityModalMode.value === 'add') {
    await addActivity(activityModalDayId.value, {
      title: data.title,
      description: data.description,
      timeSlot: data.timeSlot,
      activityType: data.activityType,
      durationMinutes: data.durationMinutes,
      estimatedCostThb: data.estimatedCostThb,
    })
  } else if (data.id) {
    await updateActivity(data.id, {
      title: data.title,
      description: data.description,
      timeSlot: data.timeSlot,
      activityType: data.activityType,
      durationMinutes: data.durationMinutes,
      estimatedCostThb: data.estimatedCostThb,
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
      <ProGate featureName="AI-Powered Itineraries">
        <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
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

              <!-- Export Actions -->
              <div class="flex items-center gap-1 ml-4">
                <button
                  @click="getAISuggestions"
                  :disabled="aiSuggestionsLoading"
                  class="p-2 rounded-lg hover:bg-amber-100 text-amber-600 hover:text-amber-700 transition-colors disabled:opacity-50"
                  title="Get AI Suggestions"
                >
                  <LoadingOutlined v-if="aiSuggestionsLoading" class="animate-spin" />
                  <BulbOutlined v-else />
                </button>
                <button
                  @click="handleExportCalendar"
                  class="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-primary-600 transition-colors"
                  title="Export to Calendar"
                >
                  <DownloadOutlined />
                </button>
                <button
                  @click="handleCopyItinerary"
                  class="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-primary-600 transition-colors"
                  title="Copy to Clipboard"
                >
                  <CopyOutlined />
                </button>
                <button
                  @click="handlePrint"
                  class="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-primary-600 transition-colors"
                  title="Print Itinerary"
                >
                  <PrinterOutlined />
                </button>
              </div>
            </div>
          </div>

          <!-- AI Suggestions Panel -->
          <Transition
            enter-active-class="transition-all duration-300"
            enter-from-class="opacity-0 -translate-y-2"
            leave-active-class="transition-all duration-300"
            leave-to-class="opacity-0 -translate-y-2"
          >
            <div
              v-if="showAISuggestions"
              class="card-thai bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200"
            >
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <BulbOutlined class="text-amber-500" />
                  AI Suggestions
                </h3>
                <button
                  @click="showAISuggestions = false"
                  class="p-1 rounded hover:bg-amber-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <CloseOutlined />
                </button>
              </div>

              <div v-if="aiSuggestionsLoading" class="text-center py-8">
                <LoadingOutlined class="text-2xl text-amber-500 animate-spin mb-2" />
                <p class="text-gray-500 text-sm">Analyzing your itinerary...</p>
              </div>

              <div v-else-if="aiSuggestions.length > 0" class="space-y-3">
                <div
                  v-for="(suggestion, index) in aiSuggestions"
                  :key="index"
                  class="p-3 bg-white rounded-lg border border-amber-100"
                >
                  <div class="flex items-start gap-3">
                    <span class="text-xl">{{ suggestionIcons[suggestion.type] || '💡' }}</span>
                    <div>
                      <h4 class="font-medium text-gray-900">{{ suggestion.title }}</h4>
                      <p class="text-sm text-gray-600 mt-1">{{ suggestion.description }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="text-center py-4 text-gray-500">
                <p>No suggestions available. Try adding more activities to your itinerary.</p>
              </div>
            </div>
          </Transition>

          <!-- Copied Toast -->
          <div
            v-if="showCopiedToast"
            class="fixed bottom-4 right-4 px-4 py-2 bg-gray-900 text-white rounded-lg shadow-lg flex items-center gap-2 z-50"
          >
            <CheckOutlined class="text-green-400" />
            Copied to clipboard!
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

        <!-- Cost Analytics -->
        <ItineraryCostAnalytics :itinerary="currentItinerary" />

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
                  <!-- Contextual booking link based on activity type -->
                  <div
                    v-if="getActivityAffiliate(activity, day.location)"
                    class="mt-2"
                    @click.stop
                  >
                    <AffiliateButton
                      :partner="getActivityAffiliate(activity, day.location)!.partner"
                      :destination="day.location"
                      :attraction-name="activity.title"
                      variant="minimal"
                      :label="getActivityAffiliate(activity, day.location)!.label"
                    />
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

        <!-- Booking card at the bottom of itinerary detail -->
        <AffiliateCard
          context="itinerary"
          :destination="getLocations(currentItinerary)[0] || 'Thailand'"
          title="Book Your Trip"
          :show-availability="true"
        />
      </div>
      </ProGate>
    </div>

    <!-- Generate Modal -->
    <ItineraryGenerateModal
      :visible="showGenerateModal"
      :generating="generating"
      :user-prefs="userStore.profile.prefs"
      @close="showGenerateModal = false"
      @generate="handleGenerate"
    />

    <!-- Activity Modal -->
    <ItineraryActivityModal
      :visible="showActivityModal"
      :mode="activityModalMode"
      :activity="editingActivity"
      @close="showActivityModal = false"
      @save="handleSaveActivity"
    />
  </div>
</template>
