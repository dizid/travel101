<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useUserStore } from '@stores/userStore'
import { useCountryStore } from '@stores/countryStore'
import type { VisaWizardState, ChecklistItem } from '@/types'
import {
  CheckCircleFilled,
  RightOutlined,
  LeftOutlined,
  FileTextOutlined,
  GlobalOutlined,
  CalendarOutlined,
  SafetyOutlined,
  CrownOutlined,
} from '@ant-design/icons-vue'

const userStore = useUserStore()
const countryStore = useCountryStore()

// Wizard state
const wizardState = ref<VisaWizardState>({
  step: 1,
  nationality: userStore.profile.prefs.nationality || '',
  currentLocation: 'outside',
  tripPurpose: userStore.profile.prefs.tripType || 'holiday',
  duration: 14,
  ageGroup: userStore.profile.prefs.ageGroup || 'middle',
  recommendedVisa: undefined,
  checklist: [],
})

const totalSteps = 3

// Common nationalities for quick select
const popularNationalities = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'SG', name: 'Singapore' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
]

const tripPurposes = [
  { value: 'holiday', label: 'Holiday / Tourism', icon: '🌴', description: 'Vacation and sightseeing' },
  { value: 'digital_nomad', label: 'Digital Nomad', icon: '💻', description: 'Working remotely' },
  { value: 'expat', label: 'Long-term Stay', icon: '🏠', description: 'Living in Thailand' },
]

const ageGroups = [
  { value: 'young', label: 'Under 50', description: 'Standard visa options' },
  { value: 'senior', label: '50 or older', description: 'Retirement visa eligible' },
]

// Step validation
const canProceed = computed(() => {
  switch (wizardState.value.step) {
    case 1:
      return wizardState.value.nationality !== ''
    case 2:
      return true
    case 3:
      return true
    default:
      return false
  }
})

// Get visa recommendation
const recommendedVisa = computed(() => {
  return countryStore.getVisaForProfile(
    wizardState.value.nationality,
    wizardState.value.tripPurpose,
    wizardState.value.duration,
    wizardState.value.ageGroup
  )
})

// Generate checklist based on visa type
const checklist = computed<ChecklistItem[]>(() => {
  if (!recommendedVisa.value) return []

  const items: ChecklistItem[] = [
    {
      id: 'passport',
      label: 'Valid passport (6+ months validity)',
      description: 'Your passport must be valid for at least 6 months from entry date',
      checked: false,
      required: true,
    },
    {
      id: 'return-ticket',
      label: 'Return/onward flight ticket',
      description: 'Proof of onward travel within visa period',
      checked: false,
      required: true,
    },
    {
      id: 'accommodation',
      label: 'Hotel reservation for first night',
      description: 'Booking confirmation for your accommodation',
      checked: false,
      required: true,
    },
    {
      id: 'funds',
      label: 'Proof of funds (20,000 THB or equivalent)',
      description: 'Cash or bank statement showing sufficient funds',
      checked: false,
      required: true,
    },
    {
      id: 'tdac',
      label: 'TDAC completed',
      description: 'Thai Digital Arrival Card - submit within 72 hours of arrival',
      checked: false,
      required: true,
      link: '/tdac',
    },
    {
      id: 'insurance',
      label: 'Travel insurance (recommended)',
      description: 'Medical coverage for your trip',
      checked: false,
      required: false,
    },
  ]

  return items
})

const checklistProgress = computed(() => {
  if (checklist.value.length === 0) return 0
  const checked = checklist.value.filter((item) => item.checked).length
  return Math.round((checked / checklist.value.length) * 100)
})

// Duration labels
const durationLabel = computed(() => {
  const days = wizardState.value.duration
  if (days <= 7) return 'Quick trip'
  if (days <= 14) return 'Short holiday'
  if (days <= 30) return 'Extended stay'
  if (days <= 60) return 'Long holiday'
  if (days <= 90) return 'Extended visit'
  return 'Long-term stay'
})

// Need extension warning
const needsExtension = computed(() => {
  if (!recommendedVisa.value) return false
  return wizardState.value.duration > recommendedVisa.value.duration
})

// Navigation
function nextStep() {
  if (wizardState.value.step < totalSteps && canProceed.value) {
    wizardState.value.step++
  }
}

function prevStep() {
  if (wizardState.value.step > 1) {
    wizardState.value.step--
  }
}

function toggleChecklistItem(id: string) {
  const item = checklist.value.find((i) => i.id === id)
  if (item) {
    item.checked = !item.checked
  }
}

// Update user profile with wizard data
watch(
  () => wizardState.value.nationality,
  (val) => {
    if (val) {
      userStore.updatePreferences({ nationality: val })
    }
  }
)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-blue-50/50 to-white">
    <!-- Header -->
    <div class="bg-white border-b border-gray-100">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div class="text-center">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
            <FileTextOutlined />
            Visa Wizard
          </div>
          <h1 class="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-3">
            Find Your Perfect Visa
          </h1>
          <p class="text-gray-600">
            Answer a few questions and we'll recommend the best visa for your trip.
          </p>
        </div>
      </div>
    </div>

    <!-- Progress bar -->
    <div class="bg-white border-b border-gray-100 sticky top-16 md:top-20 z-10">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 py-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-500">Step {{ wizardState.step }} of {{ totalSteps }}</span>
          <span class="text-sm font-medium text-primary-600">{{ Math.round((wizardState.step / totalSteps) * 100) }}%</span>
        </div>
        <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500"
            :style="{ width: `${(wizardState.step / totalSteps) * 100}%` }"
          />
        </div>
      </div>
    </div>

    <!-- Wizard content -->
    <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <!-- Step 1: Your Situation -->
      <div v-if="wizardState.step === 1" class="animate-fade-in">
        <div class="card-thai p-6 md:p-8 mb-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <GlobalOutlined class="text-primary-500" />
            Your Situation
          </h2>

          <!-- Nationality -->
          <div class="mb-8">
            <label class="block text-sm font-medium text-gray-700 mb-3">
              What's your nationality?
            </label>
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
              <button
                v-for="country in popularNationalities"
                :key="country.code"
                @click="wizardState.nationality = country.code"
                class="px-3 py-2 text-sm rounded-lg border-2 transition-all"
                :class="wizardState.nationality === country.code
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'"
              >
                {{ country.name }}
              </button>
            </div>
            <a-select
              v-model:value="wizardState.nationality"
              placeholder="Or search for your country..."
              class="w-full"
              size="large"
              show-search
              :options="popularNationalities.map(c => ({ value: c.code, label: c.name }))"
            />
          </div>

          <!-- Current location -->
          <div class="mb-8">
            <label class="block text-sm font-medium text-gray-700 mb-3">
              Where are you now?
            </label>
            <div class="grid grid-cols-2 gap-3">
              <button
                @click="wizardState.currentLocation = 'outside'"
                class="p-4 rounded-xl border-2 text-left transition-all"
                :class="wizardState.currentLocation === 'outside'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'"
              >
                <span class="text-2xl mb-2 block">✈️</span>
                <span class="font-medium text-gray-900">Outside Thailand</span>
                <span class="text-sm text-gray-500 block">Planning my trip</span>
              </button>
              <button
                @click="wizardState.currentLocation = 'in_thailand'"
                class="p-4 rounded-xl border-2 text-left transition-all"
                :class="wizardState.currentLocation === 'in_thailand'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'"
              >
                <span class="text-2xl mb-2 block">🇹🇭</span>
                <span class="font-medium text-gray-900">In Thailand</span>
                <span class="text-sm text-gray-500 block">Extending my stay</span>
              </button>
            </div>
          </div>

          <!-- Trip purpose -->
          <div class="mb-8">
            <label class="block text-sm font-medium text-gray-700 mb-3">
              What's the purpose of your trip?
            </label>
            <div class="space-y-3">
              <button
                v-for="purpose in tripPurposes"
                :key="purpose.value"
                @click="wizardState.tripPurpose = purpose.value as any"
                class="w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4"
                :class="wizardState.tripPurpose === purpose.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'"
              >
                <span class="text-3xl">{{ purpose.icon }}</span>
                <div>
                  <span class="font-medium text-gray-900 block">{{ purpose.label }}</span>
                  <span class="text-sm text-gray-500">{{ purpose.description }}</span>
                </div>
              </button>
            </div>
          </div>

          <!-- Age Group (shows for long-term stay) -->
          <div v-if="wizardState.tripPurpose === 'expat'">
            <label class="block text-sm font-medium text-gray-700 mb-3">
              Your age group
              <span class="text-gray-400 font-normal">(important for visa options)</span>
            </label>
            <div class="grid grid-cols-2 gap-3">
              <button
                v-for="age in ageGroups"
                :key="age.value"
                @click="wizardState.ageGroup = age.value as any"
                class="p-4 rounded-xl border-2 text-left transition-all"
                :class="wizardState.ageGroup === age.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'"
              >
                <span class="text-2xl mb-2 block">{{ age.value === 'senior' ? '👴' : '🧑' }}</span>
                <span class="font-medium text-gray-900 block">{{ age.label }}</span>
                <span class="text-sm text-gray-500">{{ age.description }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Duration slider -->
        <div class="card-thai p-6 md:p-8">
          <h2 class="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <CalendarOutlined class="text-primary-500" />
            How Long?
          </h2>

          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-gray-500">{{ durationLabel }}</span>
              <span class="text-2xl font-bold text-primary-600">{{ wizardState.duration }} days</span>
            </div>
            <a-slider
              v-model:value="wizardState.duration"
              :min="1"
              :max="180"
              :step="1"
              :tooltip-visible="false"
            />
            <div class="flex justify-between text-xs text-gray-400 mt-1">
              <span>1 day</span>
              <span>6 months</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Recommendation -->
      <div v-else-if="wizardState.step === 2" class="animate-fade-in">
        <div class="card-thai p-6 md:p-8 mb-6">
          <div class="flex items-start gap-4 mb-6">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xl">
              🎯
            </div>
            <div>
              <h2 class="text-xl font-semibold text-gray-900">
                We recommend:
              </h2>
              <p class="text-gray-500">Based on your trip details</p>
            </div>
          </div>

          <div v-if="recommendedVisa" class="bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl p-6 mb-6">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-3xl">🛂</span>
              <h3 class="text-2xl font-bold text-gray-900">{{ recommendedVisa.name }}</h3>
            </div>
            <p class="text-gray-600 mb-4">{{ recommendedVisa.description }}</p>

            <div class="flex flex-wrap gap-4 text-sm">
              <div class="flex items-center gap-2">
                <CalendarOutlined class="text-primary-500" />
                <span>Up to <strong>{{ recommendedVisa.duration }} days</strong></span>
              </div>
              <div v-if="recommendedVisa.extendable" class="flex items-center gap-2">
                <CheckCircleFilled class="text-green-500" />
                <span>Extendable</span>
              </div>
            </div>
          </div>

          <!-- Extension warning -->
          <div v-if="needsExtension" class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div class="flex items-start gap-3">
              <span class="text-xl">⚠️</span>
              <div>
                <h4 class="font-medium text-amber-800">Planning to stay longer?</h4>
                <p class="text-sm text-amber-700 mt-1">
                  Your planned {{ wizardState.duration }} days exceeds the {{ recommendedVisa?.duration }}-day limit.
                  Here are your options:
                </p>
                <ul class="mt-3 space-y-2 text-sm">
                  <li class="flex items-center gap-2 text-amber-700">
                    <CheckCircleFilled class="text-amber-500" />
                    <strong>Extend at Immigration</strong> - 1,900 THB for 30 more days
                  </li>
                  <li class="flex items-center gap-2 text-amber-700">
                    <CheckCircleFilled class="text-amber-500" />
                    <strong>Apply for Tourist Visa</strong> - 60 days from embassy
                  </li>
                  <li v-if="wizardState.tripPurpose === 'digital_nomad'" class="flex items-center gap-2 text-amber-700">
                    <CheckCircleFilled class="text-amber-500" />
                    <strong>Digital Nomad Visa (DTV)</strong> - 180 days for remote workers
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Requirements -->
          <div>
            <h4 class="font-medium text-gray-900 mb-3">Requirements:</h4>
            <ul class="space-y-2">
              <li
                v-for="req in recommendedVisa?.requirements"
                :key="req"
                class="flex items-start gap-2 text-gray-600"
              >
                <CheckCircleFilled class="text-green-500 mt-0.5" />
                <span>{{ req }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- AI Advice teaser -->
        <div class="card-thai p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-dashed">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <CrownOutlined class="text-white text-xl" />
            </div>
            <div class="flex-1">
              <h4 class="font-medium text-gray-900">Want personalized advice?</h4>
              <p class="text-sm text-gray-600">Get AI-powered recommendations tailored to your exact situation.</p>
            </div>
            <RouterLink to="/dashboard#pro" class="btn-thai text-sm px-4 py-2">
              Go Pro
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- Step 3: Checklist -->
      <div v-else-if="wizardState.step === 3" class="animate-fade-in">
        <div class="card-thai p-6 md:p-8">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <SafetyOutlined class="text-primary-500" />
              Your Checklist
            </h2>
            <div class="text-sm">
              <span class="font-semibold text-primary-600">{{ checklistProgress }}%</span>
              <span class="text-gray-500"> complete</span>
            </div>
          </div>

          <!-- Progress bar -->
          <div class="h-2 bg-gray-100 rounded-full overflow-hidden mb-8">
            <div
              class="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
              :style="{ width: `${checklistProgress}%` }"
            />
          </div>

          <!-- Checklist items -->
          <div class="space-y-3">
            <div
              v-for="item in checklist"
              :key="item.id"
              @click="toggleChecklistItem(item.id)"
              class="flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all"
              :class="item.checked
                ? 'border-green-200 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'"
            >
              <div
                class="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                :class="item.checked
                  ? 'border-green-500 bg-green-500'
                  : 'border-gray-300'"
              >
                <CheckCircleFilled v-if="item.checked" class="text-white text-sm" />
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span
                    class="font-medium"
                    :class="item.checked ? 'text-green-700 line-through' : 'text-gray-900'"
                  >
                    {{ item.label }}
                  </span>
                  <span v-if="!item.required" class="text-xs text-gray-400">(optional)</span>
                </div>
                <p class="text-sm text-gray-500 mt-0.5">{{ item.description }}</p>
                <RouterLink
                  v-if="item.link"
                  :to="item.link"
                  class="inline-flex items-center gap-1 text-sm text-primary-600 mt-2 hover:underline"
                  @click.stop
                >
                  Complete this step
                  <RightOutlined class="text-xs" />
                </RouterLink>
              </div>
            </div>
          </div>

          <!-- Save progress note -->
          <div class="mt-6 p-4 bg-blue-50 rounded-xl">
            <p class="text-sm text-blue-700">
              💡 <strong>Tip:</strong> Your progress is saved automatically. Come back anytime to continue!
            </p>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <div class="flex items-center justify-between mt-8">
        <button
          v-if="wizardState.step > 1"
          @click="prevStep"
          class="btn-thai-ghost"
        >
          <LeftOutlined class="text-xs" />
          Back
        </button>
        <div v-else />

        <button
          v-if="wizardState.step < totalSteps"
          @click="nextStep"
          :disabled="!canProceed"
          class="btn-thai"
          :class="{ 'opacity-50 cursor-not-allowed': !canProceed }"
        >
          Continue
          <RightOutlined class="text-xs" />
        </button>
        <RouterLink
          v-else
          to="/tdac"
          class="btn-thai"
        >
          Continue to TDAC
          <RightOutlined class="text-xs" />
        </RouterLink>
      </div>
    </div>
  </div>
</template>
