<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAlerts, type Alert, type VisaType } from '@/composables/useAlerts'
import {
  BellOutlined,
  LockOutlined,
  CrownFilled,
  CheckOutlined,
  DeleteOutlined,
  CalendarOutlined,
  LoadingOutlined,
  PlusOutlined,
  SettingOutlined,
  CloseOutlined,
} from '@ant-design/icons-vue'

const {
  alerts,
  upcomingAlerts,
  unreadCount,
  visaInfo,
  loading,
  isPro,
  VISA_LABELS,
  fetchAlerts,
  fetchUpcoming,
  fetchUnreadCount,
  setupVisaTracking,
  markAsRead,
  dismissAlert,
  getPriorityInfo,
  getAlertIcon,
  formatTriggerDate,
  getDaysUntil,
} = useAlerts()

// UI State
const showSetupModal = ref(false)
const setupForm = ref({
  visaType: 'visa_exempt' as VisaType,
  entryDate: new Date().toISOString().split('T')[0],
  expiryDate: '',
})
const settingUpVisa = ref(false)

const visaTypes = Object.entries(VISA_LABELS) as [VisaType, string][]

onMounted(async () => {
  if (isPro.value) {
    await Promise.all([
      fetchAlerts(),
      fetchUpcoming(),
      fetchUnreadCount(),
    ])
  }
})

async function handleSetupVisa() {
  settingUpVisa.value = true
  try {
    await setupVisaTracking(
      setupForm.value.visaType,
      setupForm.value.entryDate,
      setupForm.value.expiryDate || undefined
    )
    showSetupModal.value = false
  } finally {
    settingUpVisa.value = false
  }
}

async function handleMarkRead(alert: Alert) {
  if (!alert.isRead) {
    await markAsRead(alert.id)
  }
}

async function handleDismiss(id: string, event: Event) {
  event.stopPropagation()
  await dismissAlert(id)
}

const urgentAlerts = computed(() =>
  upcomingAlerts.value.filter((a) => a.priority >= 3 && getDaysUntil(a.triggerDate) <= 7)
)

const upcomingNonUrgent = computed(() =>
  upcomingAlerts.value.filter((a) => !(a.priority >= 3 && getDaysUntil(a.triggerDate) <= 7))
)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-50 to-white">
    <!-- Header -->
    <div class="bg-white border-b border-gray-100">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg relative">
              <BellOutlined class="text-2xl" />
              <span
                v-if="unreadCount > 0"
                class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
              >
                {{ unreadCount > 9 ? '9+' : unreadCount }}
              </span>
            </div>
            <div>
              <h1 class="text-2xl font-display font-bold text-gray-900">
                Oversight Alerts
              </h1>
              <p class="text-gray-500">
                Visa reminders, travel tips & important dates
              </p>
            </div>
          </div>

          <button
            v-if="isPro"
            @click="showSetupModal = true"
            class="btn-thai flex items-center gap-2"
          >
            <SettingOutlined />
            Setup Visa Tracking
          </button>
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
          Stay on Top of Your Trip
        </h2>
        <p class="text-gray-600 max-w-md mx-auto mb-6">
          Never miss a visa deadline, 90-day report, or important travel date. Get smart reminders tailored to your trip.
        </p>

        <div class="grid sm:grid-cols-3 gap-4 max-w-xl mx-auto mb-8">
          <div class="p-4 rounded-xl bg-gray-50">
            <span class="text-2xl block mb-2">🛂</span>
            <span class="text-sm font-medium text-gray-700">Visa Expiry</span>
          </div>
          <div class="p-4 rounded-xl bg-gray-50">
            <span class="text-2xl block mb-2">📋</span>
            <span class="text-sm font-medium text-gray-700">90-Day Reports</span>
          </div>
          <div class="p-4 rounded-xl bg-gray-50">
            <span class="text-2xl block mb-2">💡</span>
            <span class="text-sm font-medium text-gray-700">Travel Tips</span>
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
        <p class="text-gray-500 mt-4">Loading alerts...</p>
      </div>

      <!-- Alerts Content -->
      <div v-else class="space-y-8">
        <!-- Visa Status Card -->
        <div v-if="visaInfo" class="card-thai bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-blue-600 font-medium mb-1">Current Visa</p>
              <h3 class="text-xl font-bold text-gray-900">{{ VISA_LABELS[visaInfo.type as VisaType] || visaInfo.type }}</h3>
              <p class="text-sm text-gray-600 mt-1">
                Entry: {{ new Date(visaInfo.entryDate).toLocaleDateString() }}
                <span class="mx-2">•</span>
                Expires: {{ new Date(visaInfo.expiryDate).toLocaleDateString() }}
              </p>
            </div>
            <div class="text-right">
              <p
                :class="[
                  'text-3xl font-bold',
                  visaInfo.daysRemaining <= 7 ? 'text-red-600' :
                  visaInfo.daysRemaining <= 30 ? 'text-amber-600' :
                  'text-green-600'
                ]"
              >
                {{ visaInfo.daysRemaining }}
              </p>
              <p class="text-sm text-gray-500">days remaining</p>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="alerts.length === 0" class="card-thai text-center py-12">
          <span class="text-5xl block mb-4">🔔</span>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">No alerts yet</h3>
          <p class="text-gray-500 mb-6">Set up visa tracking to get automatic reminders for important dates.</p>
          <button @click="showSetupModal = true" class="btn-thai">
            <PlusOutlined />
            Setup Visa Tracking
          </button>
        </div>

        <!-- Urgent Alerts -->
        <div v-if="urgentAlerts.length > 0">
          <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            Urgent
          </h2>
          <div class="space-y-3">
            <div
              v-for="alert in urgentAlerts"
              :key="alert.id"
              @click="handleMarkRead(alert)"
              :class="[
                'card-thai cursor-pointer transition-all hover:shadow-md border-l-4',
                alert.isRead ? 'border-l-gray-300 opacity-75' : 'border-l-red-500'
              ]"
            >
              <div class="flex items-start gap-4">
                <span class="text-2xl">{{ getAlertIcon(alert.alertType) }}</span>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="font-semibold text-gray-900">{{ alert.title }}</h3>
                    <span :class="[getPriorityInfo(alert.priority).bgColor, getPriorityInfo(alert.priority).color, 'px-2 py-0.5 rounded text-xs font-medium']">
                      {{ getPriorityInfo(alert.priority).label }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600">{{ alert.message }}</p>
                  <p class="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <CalendarOutlined />
                    {{ formatTriggerDate(alert.triggerDate) }}
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    v-if="!alert.isRead"
                    @click.stop="handleMarkRead(alert)"
                    class="p-2 text-gray-400 hover:text-green-500 transition-colors"
                    title="Mark as read"
                  >
                    <CheckOutlined />
                  </button>
                  <button
                    @click="handleDismiss(alert.id, $event)"
                    class="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Dismiss"
                  >
                    <DeleteOutlined />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Upcoming Alerts -->
        <div v-if="upcomingNonUrgent.length > 0">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Upcoming</h2>
          <div class="space-y-3">
            <div
              v-for="alert in upcomingNonUrgent"
              :key="alert.id"
              @click="handleMarkRead(alert)"
              :class="[
                'card-thai cursor-pointer transition-all hover:shadow-md',
                alert.isRead ? 'opacity-75' : ''
              ]"
            >
              <div class="flex items-start gap-4">
                <span class="text-2xl">{{ getAlertIcon(alert.alertType) }}</span>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="font-medium text-gray-900">{{ alert.title }}</h3>
                    <span v-if="!alert.isRead" class="w-2 h-2 rounded-full bg-primary-500"></span>
                  </div>
                  <p class="text-sm text-gray-600">{{ alert.message }}</p>
                  <p class="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <CalendarOutlined />
                    {{ formatTriggerDate(alert.triggerDate) }}
                  </p>
                </div>
                <button
                  @click="handleDismiss(alert.id, $event)"
                  class="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <DeleteOutlined />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Past Alerts -->
        <div v-if="alerts.filter(a => getDaysUntil(a.triggerDate) < 0).length > 0">
          <h2 class="text-lg font-semibold text-gray-500 mb-4">Past</h2>
          <div class="space-y-3 opacity-60">
            <div
              v-for="alert in alerts.filter(a => getDaysUntil(a.triggerDate) < 0)"
              :key="alert.id"
              class="card-thai"
            >
              <div class="flex items-start gap-4">
                <span class="text-2xl grayscale">{{ getAlertIcon(alert.alertType) }}</span>
                <div class="flex-1">
                  <h3 class="font-medium text-gray-700">{{ alert.title }}</h3>
                  <p class="text-xs text-gray-400 mt-1">{{ formatTriggerDate(alert.triggerDate) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Setup Modal -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-200"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showSetupModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        @click.self="showSetupModal = false"
      >
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full">
          <div class="p-6">
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                  🛂
                </div>
                <div>
                  <h2 class="text-xl font-bold text-gray-900">Setup Visa Tracking</h2>
                  <p class="text-sm text-gray-500">Get automatic reminders</p>
                </div>
              </div>
              <button @click="showSetupModal = false" class="p-2 text-gray-400 hover:text-gray-600">
                <CloseOutlined />
              </button>
            </div>

            <!-- Visa Type -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Visa Type</label>
              <select v-model="setupForm.visaType" class="input-thai w-full">
                <option v-for="[value, label] in visaTypes" :key="value" :value="value">
                  {{ label }}
                </option>
              </select>
            </div>

            <!-- Entry Date -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Entry Date</label>
              <input
                v-model="setupForm.entryDate"
                type="date"
                class="input-thai w-full"
              />
            </div>

            <!-- Expiry Date (optional) -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Visa Expiry Date <span class="text-gray-400">(optional)</span>
              </label>
              <input
                v-model="setupForm.expiryDate"
                type="date"
                class="input-thai w-full"
                placeholder="Auto-calculated if empty"
              />
              <p class="text-xs text-gray-500 mt-1">Leave empty to auto-calculate based on visa type</p>
            </div>

            <!-- Actions -->
            <div class="flex gap-3">
              <button @click="showSetupModal = false" class="flex-1 btn-thai-outline">
                Cancel
              </button>
              <button
                @click="handleSetupVisa"
                :disabled="settingUpVisa"
                class="flex-1 btn-thai flex items-center justify-center gap-2"
              >
                <LoadingOutlined v-if="settingUpVisa" class="animate-spin" />
                {{ settingUpVisa ? 'Setting up...' : 'Start Tracking' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
