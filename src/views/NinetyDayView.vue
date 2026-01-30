<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '@stores/userStore'
import { RouterLink } from 'vue-router'
import {
  CalendarOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  BellOutlined,
  LockOutlined,
} from '@ant-design/icons-vue'

const userStore = useUserStore()
const isPro = computed(() => userStore.isPro)

// Mock data for demo - will be replaced with real API
const mockReportData = ref({
  entryDate: '2024-11-15',
  lastReportDate: '2024-11-15',
  nextDueDate: '2025-02-13',
  daysRemaining: 45,
  reports: [
    { date: '2024-11-15', office: 'Chiang Mai Immigration', status: 'completed' },
  ],
})

const immigrationOffices = [
  { name: 'Bangkok Immigration (Chaeng Wattana)', province: 'Bangkok', waitTime: '2-4 hours' },
  { name: 'Chiang Mai Immigration', province: 'Chiang Mai', waitTime: '1-2 hours' },
  { name: 'Phuket Immigration', province: 'Phuket', waitTime: '1-3 hours' },
  { name: 'Pattaya Immigration', province: 'Chonburi', waitTime: '1-2 hours' },
  { name: 'Koh Samui Immigration', province: 'Surat Thani', waitTime: '30min-1 hour' },
]

const urgencyColor = computed(() => {
  const days = mockReportData.value.daysRemaining
  if (days <= 7) return 'text-red-600 bg-red-50'
  if (days <= 14) return 'text-amber-600 bg-amber-50'
  return 'text-green-600 bg-green-50'
})
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
        <!-- Status Card -->
        <div class="card-thai">
          <div class="flex items-center justify-between mb-6">
            <h2 class="font-semibold text-gray-900">Your 90-Day Status</h2>
            <span class="badge-pro">
              <CheckCircleFilled class="text-xs" />
              Active
            </span>
          </div>

          <div class="grid sm:grid-cols-3 gap-6">
            <div class="text-center p-4 bg-gray-50 rounded-xl">
              <p class="text-sm text-gray-500 mb-1">Entry Date</p>
              <p class="font-semibold text-gray-900">{{ mockReportData.entryDate }}</p>
            </div>
            <div class="text-center p-4 bg-gray-50 rounded-xl">
              <p class="text-sm text-gray-500 mb-1">Last Report</p>
              <p class="font-semibold text-gray-900">{{ mockReportData.lastReportDate }}</p>
            </div>
            <div class="text-center p-4 rounded-xl" :class="urgencyColor">
              <p class="text-sm opacity-75 mb-1">Next Due</p>
              <p class="font-bold text-lg">{{ mockReportData.daysRemaining }} days</p>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="grid sm:grid-cols-2 gap-4">
          <button class="card-thai flex items-center gap-4 text-left hover:border-primary-300 transition-colors">
            <div class="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <FileTextOutlined class="text-primary-600" />
            </div>
            <div>
              <h3 class="font-medium text-gray-900">Generate TM47 Form</h3>
              <p class="text-sm text-gray-500">Pre-fill with your details</p>
            </div>
          </button>

          <button class="card-thai flex items-center gap-4 text-left hover:border-primary-300 transition-colors">
            <div class="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center">
              <BellOutlined class="text-accent-600" />
            </div>
            <div>
              <h3 class="font-medium text-gray-900">Set Reminder</h3>
              <p class="text-sm text-gray-500">Get notified before deadline</p>
            </div>
          </button>
        </div>

        <!-- Immigration Offices -->
        <div class="card-thai">
          <h2 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <EnvironmentOutlined class="text-gray-400" />
            Immigration Offices
          </h2>
          <div class="space-y-3">
            <div
              v-for="office in immigrationOffices"
              :key="office.name"
              class="p-4 bg-gray-50 rounded-xl flex items-center justify-between"
            >
              <div>
                <p class="font-medium text-gray-900">{{ office.name }}</p>
                <p class="text-sm text-gray-500">{{ office.province }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-400">Est. wait</p>
                <p class="text-sm font-medium text-gray-600">{{ office.waitTime }}</p>
              </div>
            </div>
          </div>
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
