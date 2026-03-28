<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useUserStore } from '@stores/userStore'
import { useCountryStore } from '@stores/countryStore'
import type { VisaWizardState, ChecklistItem, VisaRecommendation } from '@/types'
import { countryOptions, filterCountry } from '@/data/countries'
import {
  CheckCircleFilled,
  RightOutlined,
  LeftOutlined,
  FileTextOutlined,
  GlobalOutlined,
  CalendarOutlined,
  SafetyOutlined,
  CrownOutlined,
  LinkOutlined,
  WarningOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons-vue'
import BreadcrumbNav from '@components/ui/BreadcrumbNav.vue'
import { useBreadcrumbs, useRouteSeo } from '@/composables/useSeo'

const userStore = useUserStore()
const countryStore = useCountryStore()

// SEO
useRouteSeo('visa')
useBreadcrumbs([
  { name: 'Home', url: '/' },
  { name: 'Visa Guide', url: '/visa' },
])

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

// Non-linear slider for days → years
// Breakpoints map slider position (0-100) to actual days
const sliderBreakpoints = [
  { slider: 0, days: 1 },
  { slider: 10, days: 7 },
  { slider: 20, days: 14 },
  { slider: 30, days: 30 },
  { slider: 40, days: 60 },
  { slider: 50, days: 90 },
  { slider: 60, days: 180 },
  { slider: 75, days: 365 },
  { slider: 90, days: 730 },
  { slider: 100, days: 1825 }, // 5+ years
]

// Convert slider position (0-100) to actual days (non-linear)
function sliderToDays(value: number): number {
  for (let i = 0; i < sliderBreakpoints.length - 1; i++) {
    if (value <= sliderBreakpoints[i + 1].slider) {
      const ratio = (value - sliderBreakpoints[i].slider) / (sliderBreakpoints[i + 1].slider - sliderBreakpoints[i].slider)
      return Math.round(sliderBreakpoints[i].days + ratio * (sliderBreakpoints[i + 1].days - sliderBreakpoints[i].days))
    }
  }
  return 1825
}

// Convert actual days to slider position (0-100)
function daysToSlider(days: number): number {
  for (let i = 0; i < sliderBreakpoints.length - 1; i++) {
    if (days <= sliderBreakpoints[i + 1].days) {
      const ratio = (days - sliderBreakpoints[i].days) / (sliderBreakpoints[i + 1].days - sliderBreakpoints[i].days)
      return Math.round(sliderBreakpoints[i].slider + ratio * (sliderBreakpoints[i + 1].slider - sliderBreakpoints[i].slider))
    }
  }
  return 100
}

// Slider position (0-100)
const sliderPosition = ref(daysToSlider(wizardState.value.duration))

// Sync slider position with actual days
watch(sliderPosition, (pos) => {
  wizardState.value.duration = sliderToDays(pos)
})

const totalSteps = 3

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

// Get visa recommendation with nationality-aware warnings and alternatives
const visaResult = computed<VisaRecommendation>(() => {
  return countryStore.getVisaForProfile(
    wizardState.value.nationality,
    wizardState.value.tripPurpose,
    wizardState.value.duration,
    wizardState.value.ageGroup
  )
})

// Get the recommended visa and related info from the result
const recommendedVisa = computed(() => visaResult.value.visa)
const visaWarning = computed(() => visaResult.value.warning)
const visaAlternatives = computed(() => visaResult.value.alternatives || [])

// Persist checked items to localStorage
const checkedItems = ref<Set<string>>(
  new Set(typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('visa-checklist') || '[]') : [])
)

// Generate checklist based on visa type
const checklist = computed<ChecklistItem[]>(() => {
  if (!recommendedVisa.value) return []

  const items: ChecklistItem[] = [
    {
      id: 'passport',
      label: 'Valid passport (6+ months validity)',
      description: 'Your passport must be valid for at least 6 months from entry date',
      checked: checkedItems.value.has('passport'),
      required: true,
    },
    {
      id: 'return-ticket',
      label: 'Return/onward flight ticket',
      description: 'Proof of onward travel within visa period',
      checked: checkedItems.value.has('return-ticket'),
      required: true,
      link: '/onward-ticket',
    },
    {
      id: 'accommodation',
      label: 'Hotel reservation for first night',
      description: 'Booking confirmation for your accommodation',
      checked: checkedItems.value.has('accommodation'),
      required: true,
    },
    {
      id: 'funds',
      label: 'Proof of funds (20,000 THB or equivalent)',
      description: 'Cash or bank statement showing sufficient funds',
      checked: checkedItems.value.has('funds'),
      required: true,
    },
    {
      id: 'tdac',
      label: 'TDAC completed',
      description: 'Thai Digital Arrival Card - submit within 72 hours of arrival',
      checked: checkedItems.value.has('tdac'),
      required: true,
      link: '/tdac',
    },
    {
      id: 'insurance',
      label: 'Travel insurance (recommended)',
      description: 'Medical coverage for your trip',
      checked: checkedItems.value.has('insurance'),
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

// Duration labels - descriptive category
const durationLabel = computed(() => {
  const days = wizardState.value.duration
  if (days <= 7) return 'Quick trip'
  if (days <= 14) return 'Short holiday'
  if (days <= 30) return 'Extended stay'
  if (days <= 60) return 'Long holiday'
  if (days <= 90) return 'Extended visit'
  if (days <= 180) return '6-month stay'
  if (days <= 365) return '1 year stay'
  if (days <= 730) return 'Multi-year stay'
  return 'Long-term / retirement'
})

// Human-readable duration value
const durationValueDisplay = computed(() => {
  const days = wizardState.value.duration
  if (days === 1) return '1 day'
  if (days <= 6) return `${days} days`
  if (days === 7) return '1 week'
  if (days < 14) return `${days} days`
  if (days === 14) return '2 weeks'
  if (days < 30) return `${Math.round(days / 7)} weeks`
  if (days === 30) return '1 month'
  if (days < 60) return `${Math.round(days / 30)} months`
  if (days === 60) return '2 months'
  if (days === 90) return '3 months'
  if (days < 180) return `${Math.round(days / 30)} months`
  if (days === 180) return '6 months'
  if (days < 365) return `${Math.round(days / 30)} months`
  if (days === 365) return '1 year'
  if (days < 730) return `${Math.round(days / 365 * 10) / 10} years`
  if (days === 730) return '2 years'
  if (days < 1825) return `${Math.round(days / 365)} years`
  return '5+ years'
})

// Need extension warning - don't show for 1-year visas
const needsExtension = computed(() => {
  if (!recommendedVisa.value) return false
  // Don't show extension warning for retirement/long-term visas (365+ days)
  if (recommendedVisa.value.duration >= 365) return false
  return wizardState.value.duration > recommendedVisa.value.duration
})

// Show border run warning for visa exemption users planning long stays
const showBorderRunWarning = computed(() => {
  return recommendedVisa.value?.code === 'VE' && wizardState.value.duration > 60
})

// Format duration display - show years for long-term visas
const durationDisplay = computed(() => {
  if (!recommendedVisa.value) return ''
  const days = recommendedVisa.value.duration
  if (days >= 365) {
    const years = Math.floor(days / 365)
    return `${years} year${years > 1 ? 's' : ''} validity`
  }
  return `Up to ${days} days`
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
  if (checkedItems.value.has(id)) {
    checkedItems.value.delete(id)
  } else {
    checkedItems.value.add(id)
  }
  // Persist to localStorage
  localStorage.setItem('visa-checklist', JSON.stringify([...checkedItems.value]))
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
    <!-- Breadcrumb navigation -->
    <div class="max-w-3xl mx-auto px-4 sm:px-6 pt-4">
      <BreadcrumbNav :items="[{ name: 'Home', url: '/' }, { name: 'Visa Guide' }]" />
    </div>
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
            <a-select
              v-model:value="wizardState.nationality"
              placeholder="Type to search your country..."
              class="w-full"
              size="large"
              show-search
              :filter-option="filterCountry"
              :options="countryOptions"
              option-filter-prop="label"
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
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm text-gray-500">{{ durationLabel }}</span>
              <span class="text-2xl font-bold text-primary-600">{{ durationValueDisplay }}</span>
            </div>
            <a-slider
              v-model:value="sliderPosition"
              :min="0"
              :max="100"
              :step="1"
              :tooltip-visible="false"
              :marks="{ 0: '', 30: '', 50: '', 75: '', 100: '' }"
            />
            <div class="flex justify-between text-xs text-gray-400 mt-2">
              <span>Days</span>
              <span>Months</span>
              <span>Years</span>
            </div>
            <!-- Quick duration buttons -->
            <div class="flex flex-wrap gap-2 mt-4">
              <button
                v-for="preset in [
                  { label: '2 weeks', days: 14 },
                  { label: '1 month', days: 30 },
                  { label: '3 months', days: 90 },
                  { label: '1 year', days: 365 },
                  { label: '5+ years', days: 1825 },
                ]"
                :key="preset.days"
                @click="sliderPosition = daysToSlider(preset.days)"
                class="px-3 py-1.5 text-xs rounded-full border transition-all"
                :class="wizardState.duration === preset.days
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'"
              >
                {{ preset.label }}
              </button>
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

          <!-- Nationality-specific warning -->
          <div v-if="visaWarning" class="bg-amber-50 border-2 border-amber-300 rounded-xl p-5 mb-6">
            <div class="flex items-start gap-3">
              <WarningOutlined class="text-2xl text-amber-600 mt-0.5" />
              <div>
                <h4 class="font-bold text-amber-800 text-lg">Important Notice</h4>
                <p class="text-amber-700 mt-2">{{ visaWarning }}</p>
              </div>
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
                <span><strong>{{ durationDisplay }}</strong></span>
              </div>
              <div v-if="recommendedVisa.extendable" class="flex items-center gap-2">
                <CheckCircleFilled class="text-green-500" />
                <span>Extendable{{ recommendedVisa.extensionDays ? ` (+${recommendedVisa.extensionDays} days)` : '' }}</span>
              </div>
              <div v-if="recommendedVisa.entryType === 'multiple'" class="flex items-center gap-2">
                <CheckCircleFilled class="text-blue-500" />
                <span>Multiple entry</span>
              </div>
            </div>

            <!-- Official source link -->
            <div v-if="recommendedVisa.officialUrl" class="mt-4">
              <a
                :href="recommendedVisa.officialUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 underline"
              >
                <LinkOutlined />
                Official immigration info
              </a>
            </div>

            <!-- Renewal info for long-term visas -->
            <div v-if="recommendedVisa.renewalInfo" class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p class="text-sm text-green-800">
                <strong>🔄 Renewal:</strong> {{ recommendedVisa.renewalInfo }}
              </p>
            </div>

            <!-- Validity period for multi-year visas -->
            <div v-if="recommendedVisa.validityPeriod && recommendedVisa.validityPeriod > 365" class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p class="text-sm text-blue-800">
                <strong>📅 Total validity:</strong> {{ Math.floor(recommendedVisa.validityPeriod / 365) }} years ({{ recommendedVisa.duration }} days per entry)
              </p>
            </div>
          </div>

          <!-- Alternative visa options -->
          <div v-if="visaAlternatives.length > 0" class="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
            <div class="flex items-center gap-2 mb-4">
              <InfoCircleOutlined class="text-blue-500" />
              <h4 class="font-semibold text-gray-900">Other Options to Consider</h4>
            </div>
            <div class="space-y-3">
              <div
                v-for="alt in visaAlternatives"
                :key="alt.id"
                class="p-4 bg-white border border-gray-100 rounded-lg"
              >
                <div class="flex items-start justify-between">
                  <div>
                    <h5 class="font-medium text-gray-900">{{ alt.name }}</h5>
                    <p class="text-sm text-gray-600 mt-1">{{ alt.description }}</p>
                    <div class="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                      <span>{{ alt.duration }} days</span>
                      <span v-if="alt.extendable">Extendable</span>
                      <span v-if="alt.entryType === 'multiple'">Multiple entry</span>
                    </div>
                  </div>
                  <a
                    v-if="alt.officialUrl"
                    :href="alt.officialUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-primary-500 hover:text-primary-600"
                    title="Official info"
                  >
                    <LinkOutlined />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Border Run Crackdown Warning -->
          <div v-if="showBorderRunWarning" class="bg-red-50 border-2 border-red-300 rounded-xl p-5 mb-6">
            <div class="flex items-start gap-3">
              <span class="text-2xl">🚫</span>
              <div>
                <h4 class="font-bold text-red-800 text-lg">Immigration Crackdown Active</h4>
                <p class="text-red-700 mt-2">
                  Your planned {{ wizardState.duration }} days exceeds the 60-day visa exemption.
                  Thai Immigration now strictly enforces visa run limits:
                </p>
                <ul class="mt-3 space-y-2 text-sm text-red-700">
                  <li class="flex items-start gap-2">
                    <span class="text-red-500 font-bold">•</span>
                    <span><strong>Land borders:</strong> Maximum 2 visa-exempt entries per calendar year</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-red-500 font-bold">•</span>
                    <span><strong>All entries:</strong> Officers can deny entry after 2 visa runs without justifiable reason</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-red-500 font-bold">•</span>
                    <span><strong>Land entries:</strong> NOT eligible for 30-day extension</span>
                  </li>
                </ul>
                <p class="text-red-800 mt-3 font-medium">
                  ⚠️ Thousands of foreigners denied entry recently. For stays over 90 days, consider a <strong>Tourist Visa</strong>, <strong>DTV</strong>, or <strong>Non-O</strong> visa instead.
                </p>
              </div>
            </div>
          </div>

          <!-- Extension warning -->
          <div v-if="needsExtension && !showBorderRunWarning" class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
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

          <!-- Important Notes -->
          <div v-if="recommendedVisa?.notes?.length" class="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <h4 class="font-medium text-gray-900 mb-3">Important Notes:</h4>
            <ul class="space-y-2">
              <li
                v-for="note in recommendedVisa.notes"
                :key="note"
                class="text-sm text-gray-600"
              >
                {{ note }}
              </li>
            </ul>
          </div>
        </div>

        <!-- 90-Day Reporting Guide -->
        <div v-if="recommendedVisa?.reportingInterval" class="card-thai p-6 mt-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
            📋 90-Day Reporting (TM.47) - Required
          </h3>

          <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p class="text-green-800 font-medium">
              ✓ This is FREE and takes about 2 minutes. It's NOT a visa limit - just an address check-in!
            </p>
          </div>

          <p class="text-gray-600 mb-4">
            Every 90 days you must report your current address to Immigration.
            <strong>Filing window:</strong> 15 days before to 7 days after due date.
          </p>

          <div class="space-y-3">
            <div class="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <span class="text-xl">💻</span>
              <div>
                <h4 class="font-medium text-blue-900">Online (Recommended)</h4>
                <p class="text-sm text-blue-700">
                  <a href="https://tm47.immigration.go.th" target="_blank" rel="noopener"
                     class="underline hover:no-underline">tm47.immigration.go.th</a>
                </p>
                <p class="text-xs text-blue-600 mt-1">
                  Note: First report on a new passport must be done in person or by mail.
                </p>
              </div>
            </div>

            <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span class="text-xl">📮</span>
              <div>
                <h4 class="font-medium">By Mail</h4>
                <p class="text-sm text-gray-600">
                  Send TM.47 form via registered mail at least 15 days before due date.
                  Include pre-paid return envelope.
                </p>
              </div>
            </div>

            <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span class="text-xl">🏢</span>
              <div>
                <h4 class="font-medium">In Person</h4>
                <p class="text-sm text-gray-600">
                  Visit your local Immigration office. Bring passport only.
                  Usually takes 5-15 minutes depending on queue.
                </p>
              </div>
            </div>
          </div>

          <div class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p class="text-sm text-amber-800">
              <strong>⚠️ Penalties:</strong> Late report = 2,000 THB fine.
              Failure to report = up to 5,000 THB + 200 THB/day.
              <br>
              <strong>💡 Tip:</strong> Set a calendar reminder for 7 days before your due date!
            </p>
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

      <!-- Last updated -->
      <p class="text-xs text-gray-400 mt-8 text-center">Visa information last updated: March 2026</p>
    </div>
  </div>
</template>
