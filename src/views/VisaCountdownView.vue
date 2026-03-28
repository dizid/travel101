<script setup lang="ts">
import { ref, computed } from 'vue'
import { useVisaCountdown, type VisaType } from '@composables/useVisaCountdown'
import BreadcrumbNav from '@components/ui/BreadcrumbNav.vue'
import { useBreadcrumbs, useRouteSeo } from '@/composables/useSeo'

// SEO
useRouteSeo('visaCountdown')
useBreadcrumbs([
  { name: 'Home', url: '/' },
  { name: 'Visa Countdown', url: '/visa-countdown' },
])

const {
  visaEntry,
  totalDays,
  expiryDate,
  daysRemaining,
  percentRemaining,
  urgency,
  next90DayReport,
  daysUntilNext90Day,
  canExtend,
  setEntry,
  clearEntry,
  addExtension,
  add90DayReport,
  getVisaLabel,
} = useVisaCountdown()

// --- Setup form state ---
const formEntryDate = ref(new Date().toISOString().split('T')[0])
const formVisaType = ref<VisaType>('visa-exemption')
const formCustomDays = ref(30)

// --- UI state ---
const showResetConfirm = ref(false)

// --- Visa type options with metadata ---
interface VisaOption {
  value: VisaType
  label: string
  days: string
  extensible: boolean
  description: string
}

const visaOptions: VisaOption[] = [
  {
    value: 'visa-exemption',
    label: 'Visa Exemption',
    days: '60 days',
    extensible: true,
    description: 'Most nationalities entering Thailand without a pre-arranged visa. Extendable by 30 days at immigration.',
  },
  {
    value: 'tourist-visa',
    label: 'Tourist Visa (TR)',
    days: '60 days',
    extensible: true,
    description: 'Single or multiple-entry tourist visa obtained at a Thai embassy. Extendable by 30 days.',
  },
  {
    value: 'dtv',
    label: 'Destination Thailand Visa (DTV)',
    days: '180 days',
    extensible: false,
    description: 'Long-stay visa for remote workers and digital nomads. Valid for 180 days per entry. 90-day reporting required.',
  },
  {
    value: 'education-visa',
    label: 'Education Visa (ED)',
    days: '90 days',
    extensible: false,
    description: 'For students enrolled in a Thai educational institution. 90-day reporting required.',
  },
  {
    value: 'retirement-visa',
    label: 'Retirement Visa (O-A)',
    days: '365 days',
    extensible: false,
    description: 'For retirees aged 50+. Annual renewal required. 90-day reporting required throughout stay.',
  },
  {
    value: 'business-visa',
    label: 'Non-Immigrant B (Business)',
    days: '90 days',
    extensible: false,
    description: 'For those working or conducting business in Thailand. 90-day reporting required.',
  },
  {
    value: 'custom',
    label: 'Custom',
    days: 'Custom',
    extensible: false,
    description: 'Enter a custom number of days for any other visa or stamp type.',
  },
]

const selectedVisaOption = computed<VisaOption>(() =>
  visaOptions.find((o) => o.value === formVisaType.value) ?? visaOptions[0]
)

// --- SVG ring constants ---
const RADIUS = 90
const circumference = 2 * Math.PI * RADIUS

const dashOffset = computed<number>(() => {
  return circumference * (1 - percentRemaining.value / 100)
})

const urgencyColor = computed<string>(() => {
  switch (urgency.value) {
    case 'safe':    return '#22c55e'  // green-500
    case 'warning': return '#eab308'  // yellow-500
    case 'danger':  return '#ef4444'  // red-500
    case 'expired': return '#9ca3af'  // gray-400
  }
})

const urgencyTextClass = computed<string>(() => {
  switch (urgency.value) {
    case 'safe':    return 'text-green-600'
    case 'warning': return 'text-yellow-600'
    case 'danger':  return 'text-red-600'
    case 'expired': return 'text-gray-500'
  }
})

const urgencyBgClass = computed<string>(() => {
  switch (urgency.value) {
    case 'safe':    return 'bg-green-100 text-green-700'
    case 'warning': return 'bg-yellow-100 text-yellow-700'
    case 'danger':  return 'bg-red-100 text-red-700'
    case 'expired': return 'bg-gray-100 text-gray-600'
  }
})

const urgencyLabel = computed<string>(() => {
  switch (urgency.value) {
    case 'safe':    return 'Safe'
    case 'warning': return 'Expires Soon'
    case 'danger':  return 'Urgent'
    case 'expired': return 'Expired'
  }
})

// --- Formatters ---
function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatDateShort(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// --- Actions ---
function handleStart(): void {
  setEntry({
    entryDate: formEntryDate.value,
    visaType: formVisaType.value,
    customDays: formVisaType.value === 'custom' ? formCustomDays.value : undefined,
    ninetyDayReports: [],
  })
}

function handleExtension(): void {
  addExtension()
}

function handleReport(): void {
  add90DayReport()
}

function handleReset(): void {
  clearEntry()
  showResetConfirm.value = false
  // Reset form to today
  formEntryDate.value = new Date().toISOString().split('T')[0]
  formVisaType.value = 'visa-exemption'
  formCustomDays.value = 30
}

const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Visa Countdown' },
]
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- ── Setup Mode ─────────────────────────────────────────── -->
    <template v-if="!visaEntry">
      <!-- Hero -->
      <section class="bg-gradient-to-br from-primary-500 to-accent-500 text-white py-16 px-4">
        <div class="max-w-2xl mx-auto">
          <BreadcrumbNav :items="breadcrumbs" class="mb-6 [&_*]:text-white/80 [&_a:hover]:text-white" />
          <div class="text-5xl mb-4">🛂</div>
          <h1 class="text-3xl sm:text-4xl font-bold mb-3">Visa Countdown Timer</h1>
          <p class="text-white/85 text-lg leading-relaxed">
            Track your Thailand visa expiry, get 90-day reporting reminders, and never overstay again.
          </p>
        </div>
      </section>

      <div class="max-w-2xl mx-auto px-4 py-10 space-y-8">
        <!-- Setup form -->
        <div class="bg-white rounded-2xl shadow-md p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">Set Up Your Countdown</h2>

          <div class="space-y-5">
            <!-- Entry date -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                Date of Entry into Thailand
              </label>
              <input
                v-model="formEntryDate"
                type="date"
                :max="new Date().toISOString().split('T')[0]"
                class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
            </div>

            <!-- Visa type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                Visa / Entry Type
              </label>
              <select
                v-model="formVisaType"
                class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              >
                <option v-for="opt in visaOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }} — {{ opt.days }}
                </option>
              </select>
            </div>

            <!-- Custom days (conditional) -->
            <div v-if="formVisaType === 'custom'">
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                Number of Days Granted
              </label>
              <input
                v-model.number="formCustomDays"
                type="number"
                min="1"
                max="365"
                class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
            </div>

            <!-- Selected visa description -->
            <div class="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 space-y-1">
              <p class="font-medium">
                {{ selectedVisaOption.label }}
                <span class="font-normal ml-1">
                  ({{ formVisaType === 'custom' ? formCustomDays + ' days' : selectedVisaOption.days }})
                </span>
              </p>
              <p>{{ selectedVisaOption.description }}</p>
              <p v-if="selectedVisaOption.extensible" class="text-green-700 font-medium mt-1">
                ✓ Extendable by 30 days at any immigration office (1,900 THB fee)
              </p>
            </div>

            <button
              class="btn-thai w-full py-3 text-base font-semibold"
              @click="handleStart"
            >
              Start Countdown
            </button>
          </div>
        </div>

        <!-- Info section -->
        <div class="bg-white rounded-2xl shadow-md p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">About Thailand Visa Types</h2>
          <div class="space-y-3 text-sm text-gray-600">
            <div class="grid grid-cols-2 gap-x-4 gap-y-2">
              <div v-for="opt in visaOptions.filter(o => o.value !== 'custom')" :key="opt.value"
                class="flex items-start gap-2">
                <span class="mt-0.5 w-2 h-2 rounded-full bg-primary-400 flex-shrink-0"></span>
                <span><strong class="text-gray-700">{{ opt.label }}:</strong> {{ opt.days }}</span>
              </div>
            </div>
            <p class="pt-2 border-t border-gray-100">
              Need help choosing? See our full
              <RouterLink to="/visa" class="text-primary-600 hover:underline font-medium">
                Thailand Visa Guide →
              </RouterLink>
            </p>
          </div>
        </div>
      </div>
    </template>

    <!-- ── Countdown Mode ──────────────────────────────────────── -->
    <template v-else>
      <!-- Header bar (no full hero — content is the hero) -->
      <div class="bg-white border-b border-gray-100 px-4 py-4">
        <div class="max-w-2xl mx-auto">
          <BreadcrumbNav :items="breadcrumbs" />
        </div>
      </div>

      <div class="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <!-- Circular countdown ring -->
        <div class="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center gap-4">
          <h1 class="text-xl font-semibold text-gray-800">
            {{ getVisaLabel(visaEntry.visaType) }}
          </h1>

          <!-- SVG ring -->
          <div class="relative">
            <svg viewBox="0 0 200 200" class="w-48 h-48 sm:w-64 sm:h-64">
              <!-- Background track -->
              <circle
                cx="100" cy="100" r="90"
                fill="none"
                stroke="#e5e7eb"
                stroke-width="12"
              />
              <!-- Progress arc -->
              <circle
                cx="100" cy="100" r="90"
                fill="none"
                :stroke="urgencyColor"
                stroke-width="12"
                stroke-linecap="round"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="dashOffset"
                transform="rotate(-90 100 100)"
                class="transition-all duration-1000"
              />
            </svg>

            <!-- Center label -->
            <div class="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span
                class="text-4xl sm:text-5xl font-bold leading-none"
                :class="urgencyTextClass"
              >
                {{ daysRemaining > 0 ? daysRemaining : 0 }}
              </span>
              <span class="text-sm text-gray-500 mt-1">days left</span>
            </div>
          </div>

          <!-- Date range -->
          <p class="text-sm text-gray-500 text-center">
            <span class="font-medium text-gray-700">{{ formatDateShort(visaEntry.entryDate) }}</span>
            <span class="mx-2">→</span>
            <span class="font-medium text-gray-700">{{ formatDateShort(expiryDate) }}</span>
          </p>

          <!-- Urgency badge -->
          <span
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium"
            :class="urgencyBgClass"
          >
            <span class="w-2 h-2 rounded-full"
              :style="{ backgroundColor: urgencyColor }"
            ></span>
            {{ urgencyLabel }}
          </span>
        </div>

        <!-- Status card -->
        <div class="bg-white rounded-2xl shadow-md p-6">
          <h2 class="text-base font-semibold text-gray-900 mb-4">Key Dates</h2>
          <dl class="space-y-3 text-sm">
            <div class="flex justify-between items-center py-2 border-b border-gray-50">
              <dt class="text-gray-500">Entry Date</dt>
              <dd class="font-medium text-gray-800">{{ formatDate(visaEntry.entryDate) }}</dd>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-gray-50">
              <dt class="text-gray-500">Visa Expiry</dt>
              <dd class="font-medium text-gray-800">{{ formatDate(expiryDate) }}</dd>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-gray-50">
              <dt class="text-gray-500">Total Duration</dt>
              <dd class="font-medium text-gray-800">{{ totalDays }} days</dd>
            </div>
            <div class="flex justify-between items-center py-2">
              <dt class="text-gray-500">Days Remaining</dt>
              <dd class="flex items-center gap-2">
                <span class="font-semibold" :class="urgencyTextClass">
                  {{ daysRemaining > 0 ? daysRemaining : 'Expired' }}
                </span>
                <span
                  class="text-xs px-2 py-0.5 rounded-full font-medium"
                  :class="urgencyBgClass"
                >
                  {{ urgencyLabel }}
                </span>
              </dd>
            </div>
          </dl>

          <!-- Extension section -->
          <div class="mt-5 pt-4 border-t border-gray-100">
            <div v-if="visaEntry.extensionDate" class="flex items-center gap-2 text-sm text-green-700">
              <span class="text-base">✓</span>
              Extension applied on {{ formatDateShort(visaEntry.extensionDate) }}
              <span class="text-gray-400">(+30 days)</span>
            </div>
            <button
              v-else-if="canExtend"
              class="w-full mt-1 bg-green-50 hover:bg-green-100 text-green-700 font-medium text-sm px-4 py-2.5 rounded-xl border border-green-200 transition-colors"
              @click="handleExtension"
            >
              Apply 30-Day Extension
            </button>
            <p v-else-if="!canExtend && !visaEntry.extensionDate" class="text-xs text-gray-400">
              This visa type cannot be extended in-country.
            </p>
          </div>
        </div>

        <!-- 90-day reporting section (only when totalDays > 90) -->
        <div v-if="totalDays > 90" class="bg-white rounded-2xl shadow-md p-6">
          <h2 class="text-base font-semibold text-gray-900 mb-1">90-Day Reporting</h2>
          <p class="text-xs text-gray-500 mb-4">
            Required for all stays over 90 days. Report to immigration every 90 days from your entry date.
          </p>

          <!-- Next due -->
          <div v-if="next90DayReport" class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-sm font-medium text-amber-800">Next Report Due</p>
                <p class="text-lg font-bold text-amber-900 mt-0.5">{{ formatDate(next90DayReport) }}</p>
                <p class="text-xs text-amber-700 mt-1">
                  <template v-if="(daysUntilNext90Day ?? 0) > 0">
                    In {{ daysUntilNext90Day }} day{{ daysUntilNext90Day !== 1 ? 's' : '' }}
                  </template>
                  <template v-else-if="daysUntilNext90Day === 0">
                    Today — report now!
                  </template>
                  <template v-else>
                    Overdue by {{ Math.abs(daysUntilNext90Day ?? 0) }} day{{ Math.abs(daysUntilNext90Day ?? 0) !== 1 ? 's' : '' }}
                  </template>
                </p>
              </div>
              <button
                class="flex-shrink-0 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                @click="handleReport"
              >
                Mark Reported
              </button>
            </div>
          </div>

          <div v-else class="text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3 mb-4">
            ✓ No upcoming 90-day report required.
          </div>

          <!-- Past reports -->
          <div v-if="visaEntry.ninetyDayReports.length > 0">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Past Reports</p>
            <ul class="space-y-1.5">
              <li
                v-for="(report, i) in visaEntry.ninetyDayReports"
                :key="i"
                class="flex items-center gap-2 text-sm text-gray-600"
              >
                <span class="text-green-500 text-base leading-none">✓</span>
                Report #{{ i + 1 }} — {{ formatDate(report) }}
              </li>
            </ul>
          </div>
        </div>

        <!-- Tips -->
        <div class="bg-white rounded-2xl shadow-md p-6">
          <h2 class="text-base font-semibold text-gray-900 mb-3">Helpful Resources</h2>
          <div class="space-y-2 text-sm">
            <RouterLink
              to="/visa"
              class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <span class="text-xl">🛂</span>
              <div>
                <p class="font-medium text-gray-800 group-hover:text-primary-600 transition-colors">
                  Thailand Visa Guide
                </p>
                <p class="text-gray-500 text-xs">Full guide to all visa types, requirements, and fees</p>
              </div>
            </RouterLink>
            <RouterLink
              to="/90-day"
              class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <span class="text-xl">📋</span>
              <div>
                <p class="font-medium text-gray-800 group-hover:text-primary-600 transition-colors">
                  90-Day Reporting Guide
                </p>
                <p class="text-gray-500 text-xs">TM47 form, online reporting, and immigration offices</p>
              </div>
            </RouterLink>
          </div>
        </div>

        <!-- Reset -->
        <div class="pb-8">
          <div v-if="!showResetConfirm" class="text-center">
            <button
              class="text-sm text-gray-400 hover:text-red-500 transition-colors underline underline-offset-2"
              @click="showResetConfirm = true"
            >
              Reset countdown
            </button>
          </div>
          <div v-else class="bg-red-50 border border-red-200 rounded-2xl p-5 text-center space-y-3">
            <p class="text-sm font-medium text-red-800">
              Reset your countdown? All data (extension, reports) will be deleted.
            </p>
            <div class="flex gap-3 justify-center">
              <button
                class="px-5 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors"
                @click="handleReset"
              >
                Yes, Reset
              </button>
              <button
                class="px-5 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl border border-gray-200 transition-colors"
                @click="showResetConfirm = false"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
