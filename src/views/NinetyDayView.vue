<script setup lang="ts">
import ToolIntro from '@/components/common/ToolIntro.vue'
import { computed } from 'vue'
import { useUserStore } from '@stores/userStore'
import { RouterLink } from 'vue-router'
import {
  CalendarOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  EnvironmentOutlined,
  ExportOutlined,
  BellOutlined,
  LockOutlined,
} from '@ant-design/icons-vue'
import { useRouteSeo } from '@/composables/useSeo'
import { useVisaCountdown } from '@composables/useVisaCountdown'
import { downloadNinetyDayIcs } from '@/utils/ninetyDayCalendar'

// Own title, description and canonical for this prerendered page
useRouteSeo('90day')

const userStore = useUserStore()
const isPro = computed(() => userStore.isPro)

// The user's own stay, saved on this device by the Visa Countdown tool
const {
  visaEntry,
  totalDays,
  next90DayReport,
  daysUntilNext90Day,
  next90DayWindow,
  add90DayReport,
} = useVisaCountdown()

const IMMIGRATION_90_DAY_PAGE = 'https://www.immigration.go.th/?page_id=1666'
const ONLINE_REPORT_SITE = 'https://tm47.immigration.go.th'

const lastReportDate = computed<string | null>(() => {
  const reports = visaEntry.value?.ninetyDayReports ?? []
  return reports.length ? [...reports].sort()[reports.length - 1] : null
})

// Days past the due date (0 when not late)
const daysLate = computed<number>(() => Math.max(0, -(daysUntilNext90Day.value ?? 0)))

const dueLabel = computed<string>(() => {
  const days = daysUntilNext90Day.value
  if (days === null) return ''
  if (days > 0) return `in ${days} day${days !== 1 ? 's' : ''}`
  if (days === 0) return 'today'
  return `${daysLate.value} day${daysLate.value !== 1 ? 's' : ''} ago`
})

const urgencyColor = computed(() => {
  const days = daysUntilNext90Day.value ?? 99
  if (days <= 7) return 'text-red-600 bg-red-50'
  if (days <= 14) return 'text-amber-600 bg-amber-50'
  return 'text-green-600 bg-green-50'
})

// Stored dates are plain YYYY-MM-DD; format in UTC so no time zone shifts the day
function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function addReminderToCalendar(): void {
  if (!next90DayReport.value || !next90DayWindow.value) return
  downloadNinetyDayIcs({ ...next90DayWindow.value, due: next90DayReport.value })
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-50 to-white">
    <!-- Header -->
    <div class="bg-white border-b border-gray-100">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
            <CalendarOutlined class="text-xl text-primary-600" />
          </div>
          <div>
            <h1 class="text-2xl font-display font-bold text-gray-900">90-Day Reporting</h1>
            <p class="text-gray-500">Track your TM47 immigration requirements</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <ToolIntro page="ninetyDay" />

      <!-- Pro gate -->
      <div v-if="!isPro" class="card-thai text-center py-12">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-50 flex items-center justify-center">
          <LockOutlined class="text-2xl text-primary-600" />
        </div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">Pro Feature</h2>
        <p class="text-gray-500 mb-6 max-w-md mx-auto">
          Track your 90-day reporting deadlines, find immigration offices, and never miss a report.
        </p>
        <RouterLink to="/dashboard?upgrade=true" class="btn-thai">
          Upgrade to Pro
        </RouterLink>
      </div>

      <!-- Pro content -->
      <div v-else class="space-y-8">
        <!-- Status Card: from the stay saved in Visa Countdown -->
        <div class="card-thai">
          <div class="flex items-center justify-between mb-6">
            <h2 class="font-semibold text-gray-900">Your 90-Day Status</h2>
            <span v-if="next90DayReport" class="badge-pro">
              <CheckCircleFilled class="text-xs" />
              Tracking
            </span>
          </div>

          <!-- No stay saved yet -->
          <div v-if="!visaEntry" class="text-center py-4">
            <p class="text-gray-600 mb-4 max-w-md mx-auto">
              Save your last entry date and visa in the Visa Countdown, and this page works out your next
              due date and reporting window.
            </p>
            <RouterLink to="/visa-countdown" class="btn-thai">Set my entry date</RouterLink>
          </div>

          <!-- Stay saved, but no report falls inside it -->
          <div v-else-if="!next90DayReport" class="text-center py-4">
            <p class="text-gray-600 mb-4 max-w-md mx-auto">
              <template v-if="totalDays <= 90">
                Your saved stay is {{ totalDays }} days, so no 90-day report is due. The report is only for
                stays of more than 90 days in a row.
              </template>
              <template v-else>
                No further 90-day report falls inside your saved stay.
              </template>
            </p>
            <RouterLink to="/visa-countdown" class="text-primary-600 font-medium hover:underline">
              Update my entry date or visa
            </RouterLink>
          </div>

          <template v-else>
            <div class="grid sm:grid-cols-3 gap-6">
              <div class="text-center p-4 bg-gray-50 rounded-xl">
                <p class="text-sm text-gray-500 mb-1">Entry Date</p>
                <p class="font-semibold text-gray-900">{{ formatDate(visaEntry.entryDate) }}</p>
              </div>
              <div class="text-center p-4 bg-gray-50 rounded-xl">
                <p class="text-sm text-gray-500 mb-1">Last Report</p>
                <p class="font-semibold text-gray-900">
                  {{ lastReportDate ? formatDate(lastReportDate) : 'None yet' }}
                </p>
              </div>
              <div class="text-center p-4 rounded-xl" :class="urgencyColor">
                <p class="text-sm opacity-75 mb-1">Next Due</p>
                <p class="font-bold text-lg">{{ formatDate(next90DayReport) }}</p>
                <p class="text-sm">{{ dueLabel }}</p>
              </div>
            </div>

            <p v-if="next90DayWindow" class="text-sm text-gray-600 mt-4">
              Report window: <strong>{{ formatDate(next90DayWindow.opens) }}</strong> to
              <strong>{{ formatDate(next90DayWindow.closes) }}</strong> (15 days before to 7 days after the due date).
            </p>
            <p v-if="daysLate > 7" class="text-sm text-red-700 bg-red-50 rounded-lg p-3 mt-3">
              The window has closed. A late report must be made in person, and the Immigration Bureau lists a
              2,000 THB fine. If you already reported, tap "I reported today" or update your dates in the Visa Countdown.
            </p>
            <p v-else-if="daysLate > 0" class="text-sm text-amber-800 bg-amber-50 rounded-lg p-3 mt-3">
              Past the due date, but still inside the 7-day window: report now to avoid the fine.
            </p>

            <div class="flex flex-wrap items-center justify-between gap-3 mt-4">
              <p class="text-xs text-gray-500">
                Estimate from your saved dates. The date on your last receipt is the official one.
              </p>
              <button
                class="text-sm font-medium text-primary-600 hover:underline"
                @click="add90DayReport"
              >
                I reported today
              </button>
            </div>
          </template>
        </div>

        <!-- Quick Actions -->
        <div class="grid sm:grid-cols-2 gap-4">
          <a
            :href="ONLINE_REPORT_SITE"
            target="_blank"
            rel="noopener"
            class="card-thai flex items-center gap-4 text-left hover:border-primary-300 transition-colors"
          >
            <div class="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <ExportOutlined class="text-primary-600" />
            </div>
            <div>
              <h3 class="font-medium text-gray-900">Report online (TM.47)</h3>
              <p class="text-sm text-gray-500">Immigration Bureau's own site. Not after a passport change.</p>
            </div>
          </a>

          <!-- Only for a due date that is still ahead (a past window needs no reminder) -->
          <button
            v-if="next90DayWindow && daysLate === 0"
            class="card-thai flex items-center gap-4 text-left hover:border-primary-300 transition-colors"
            @click="addReminderToCalendar"
          >
            <div class="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center">
              <BellOutlined class="text-accent-600" />
            </div>
            <div>
              <h3 class="font-medium text-gray-900">Add reminder to calendar</h3>
              <p class="text-sm text-gray-500">Window opens {{ formatDate(next90DayWindow.opens) }}, due {{ formatDate(next90DayReport!) }}</p>
            </div>
          </button>
          <RouterLink
            v-else-if="!visaEntry"
            to="/visa-countdown"
            class="card-thai flex items-center gap-4 text-left hover:border-primary-300 transition-colors"
          >
            <div class="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center">
              <BellOutlined class="text-accent-600" />
            </div>
            <div>
              <h3 class="font-medium text-gray-900">Set up a reminder</h3>
              <p class="text-sm text-gray-500">Save your entry date first</p>
            </div>
          </RouterLink>
        </div>

        <!-- Where to report (Immigration Bureau, page_id=1666) -->
        <div class="card-thai">
          <h2 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <EnvironmentOutlined class="text-gray-400" />
            Where to Report
          </h2>
          <div class="space-y-3">
            <div class="p-4 bg-gray-50 rounded-xl">
              <p class="font-medium text-gray-900">Bangkok: 90 Days Report Section</p>
              <p class="text-sm text-gray-500">
                Government Complex, Building B (South Zone), Chaeng Wattana Road, Lak Si
              </p>
            </div>
            <div class="p-4 bg-gray-50 rounded-xl">
              <p class="font-medium text-gray-900">Other provinces</p>
              <p class="text-sm text-gray-500">The immigration office for the area where you live</p>
            </div>
            <div class="p-4 bg-gray-50 rounded-xl">
              <p class="font-medium text-gray-900">By registered mail</p>
              <p class="text-sm text-gray-500">
                Send it at least 15 days before the due date, with the TM.47 form and passport copies
              </p>
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-4">
            Source:
            <a :href="IMMIGRATION_90_DAY_PAGE" target="_blank" rel="noopener" class="underline hover:no-underline">
              Immigration Bureau, 90-day notification
            </a>
            (checked 11 Nov 2026).
          </p>
        </div>

        <!-- Coming Soon Notice -->
        <div class="card-thai bg-amber-50 border-amber-200">
          <div class="flex items-start gap-3">
            <ClockCircleOutlined class="text-amber-500 text-lg mt-0.5" />
            <div>
              <h3 class="font-medium text-amber-800">More Features Coming Soon</h3>
              <p class="text-sm text-amber-700 mt-1">
                Online reporting submission, receipt storage, and automatic reminders are in development.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
