<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSafety, type NewScamReport } from '@/composables/useSafety'
import ScamAlert from '@components/features/ScamAlert.vue'
import ProBadge from '@components/ui/ProBadge.vue'
import {
  LoadingOutlined,
  WarningOutlined,
  PhoneOutlined,
  SafetyOutlined,
  PlusOutlined,
  FilterOutlined,
  CheckOutlined,
  CloseOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons-vue'

const {
  loading,
  fetchSafetyData,
  submitReport,
  scamReports,
  provinceSafety,
  scamTypes,
  stats,
  highSeverityReports,
  getSafetyLabel,
} = useSafety()

const selectedProvince = ref('')
const selectedType = ref('')
const showReportModal = ref(false)
const submitting = ref(false)
const submitSuccess = ref(false)

const newReport = ref<NewScamReport>({
  scam_type: '',
  title: '',
  description: '',
  location_name: '',
  province: '',
  severity: 2,
})

const provinces = [
  'Bangkok', 'Chiang Mai', 'Phuket', 'Krabi', 'Koh Samui',
  'Pattaya', 'Chiang Rai', 'Hua Hin', 'Koh Phangan', 'Ayutthaya',
]

const filteredReports = computed(() => {
  let reports = scamReports.value
  if (selectedProvince.value) {
    reports = reports.filter(r => r.province === selectedProvince.value)
  }
  if (selectedType.value) {
    reports = reports.filter(r => r.scam_type === selectedType.value)
  }
  return reports
})

async function handleSubmitReport() {
  if (!newReport.value.scam_type || !newReport.value.title ||
      !newReport.value.description || !newReport.value.province) {
    return
  }

  submitting.value = true
  const result = await submitReport(newReport.value)
  submitting.value = false

  if (result) {
    submitSuccess.value = true
    setTimeout(() => {
      showReportModal.value = false
      submitSuccess.value = false
      newReport.value = {
        scam_type: '',
        title: '',
        description: '',
        location_name: '',
        province: '',
        severity: 2,
      }
    }, 2000)
  }
}

function clearFilters() {
  selectedProvince.value = ''
  selectedType.value = ''
}

watch([selectedProvince, selectedType], () => {
  fetchSafetyData(selectedProvince.value || undefined, selectedType.value || undefined)
})

onMounted(() => {
  fetchSafetyData()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-red-50/30 to-white">
    <!-- Header -->
    <div class="bg-white border-b border-gray-100">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div class="flex items-center gap-3 mb-2">
          <span class="text-3xl">🛡️</span>
          <h1 class="text-2xl md:text-3xl font-display font-bold text-gray-900">
            Thailand Safety Guide
          </h1>
          <ProBadge />
        </div>
        <p class="text-gray-600">
          Stay safe with verified scam alerts, emergency contacts, and community reports.
        </p>
      </div>
    </div>

    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <!-- Emergency Numbers Banner -->
      <div class="card-thai bg-red-50 border-red-200 mb-8">
        <div class="flex items-center gap-3 mb-4">
          <PhoneOutlined class="text-2xl text-red-600" />
          <h2 class="font-semibold text-red-900 text-lg">Emergency Numbers</h2>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-white rounded-lg p-4 text-center shadow-sm">
            <span class="text-3xl font-bold text-red-600">1155</span>
            <p class="text-sm text-gray-600 mt-1">Tourist Police</p>
          </div>
          <div class="bg-white rounded-lg p-4 text-center shadow-sm">
            <span class="text-3xl font-bold text-red-600">191</span>
            <p class="text-sm text-gray-600 mt-1">Police</p>
          </div>
          <div class="bg-white rounded-lg p-4 text-center shadow-sm">
            <span class="text-3xl font-bold text-red-600">1669</span>
            <p class="text-sm text-gray-600 mt-1">Ambulance</p>
          </div>
          <div class="bg-white rounded-lg p-4 text-center shadow-sm">
            <span class="text-3xl font-bold text-red-600">199</span>
            <p class="text-sm text-gray-600 mt-1">Fire</p>
          </div>
        </div>
      </div>

      <!-- Stats & Actions Row -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div class="flex items-center gap-6 text-sm text-gray-600">
          <span v-if="stats" class="flex items-center gap-2">
            <WarningOutlined class="text-amber-500" />
            <strong>{{ stats.total_reports }}</strong> reports
          </span>
          <span v-if="stats" class="flex items-center gap-2">
            <CheckOutlined class="text-green-500" />
            <strong>{{ stats.verified_reports }}</strong> verified
          </span>
          <span v-if="highSeverityReports.length" class="flex items-center gap-2 text-red-600">
            <SafetyOutlined />
            <strong>{{ highSeverityReports.length }}</strong> high risk
          </span>
        </div>

        <button
          @click="showReportModal = true"
          class="btn-thai flex items-center gap-2"
        >
          <PlusOutlined />
          Report a Scam
        </button>
      </div>

      <!-- Filters -->
      <div class="card-thai mb-6">
        <div class="flex items-center gap-2 mb-4">
          <FilterOutlined class="text-gray-500" />
          <h3 class="font-medium text-gray-900">Filter Reports</h3>
          <button
            v-if="selectedProvince || selectedType"
            @click="clearFilters"
            class="ml-auto text-sm text-primary-600 hover:text-primary-700"
          >
            Clear all
          </button>
        </div>
        <div class="flex flex-wrap gap-4">
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm text-gray-600 mb-1">Province</label>
            <select
              v-model="selectedProvince"
              class="input-thai w-full"
            >
              <option value="">All provinces</option>
              <option v-for="p in provinces" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm text-gray-600 mb-1">Scam Type</label>
            <select
              v-model="selectedType"
              class="input-thai w-full"
            >
              <option value="">All types</option>
              <option v-for="t in scamTypes" :key="t.value" :value="t.value">
                {{ t.icon }} {{ t.label }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Province Safety Scores -->
      <div v-if="provinceSafety.length && !selectedType" class="card-thai mb-8">
        <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <SafetyOutlined class="text-green-600" />
          Province Safety Ratings
        </h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div
            v-for="province in provinceSafety"
            :key="province.province"
            class="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            @click="selectedProvince = province.province"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="font-medium text-gray-900">{{ province.province }}</span>
              <div class="flex">
                <span
                  v-for="i in 5"
                  :key="i"
                  class="text-sm"
                  :class="i <= province.overall_score ? 'text-green-500' : 'text-gray-300'"
                >
                  ★
                </span>
              </div>
            </div>
            <span
              class="text-xs"
              :class="getSafetyLabel(province.overall_score).color"
            >
              {{ getSafetyLabel(province.overall_score).label }}
            </span>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-16">
        <LoadingOutlined class="text-4xl text-primary-500 animate-spin mb-4" />
        <p class="text-gray-500">Loading safety data...</p>
      </div>

      <!-- Scam Reports -->
      <div v-else-if="filteredReports.length">
        <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <WarningOutlined class="text-amber-500" />
          Scam Reports
          <span class="text-sm font-normal text-gray-500">({{ filteredReports.length }})</span>
        </h3>
        <div class="space-y-4">
          <ScamAlert
            v-for="report in filteredReports"
            :key="report.id"
            :report="report"
          />
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-16">
        <span class="text-5xl mb-4 block">✅</span>
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          No scam reports found
        </h3>
        <p class="text-gray-500">
          {{ selectedProvince || selectedType ? 'Try adjusting your filters' : 'Great news! No reports in this area.' }}
        </p>
      </div>

      <!-- Safety Tips -->
      <div class="card-thai mt-8 bg-blue-50 border-blue-200">
        <h3 class="font-semibold text-blue-900 mb-4">🛡️ General Safety Tips</h3>
        <ul class="space-y-2 text-sm text-blue-800">
          <li class="flex items-start gap-2">
            <span class="text-blue-500">•</span>
            Always use metered taxis or ride-hailing apps (Grab, Bolt)
          </li>
          <li class="flex items-start gap-2">
            <span class="text-blue-500">•</span>
            Never believe anyone who says a temple or palace is "closed" - verify yourself
          </li>
          <li class="flex items-start gap-2">
            <span class="text-blue-500">•</span>
            Take photos of rental equipment (jet skis, motorbikes) before use
          </li>
          <li class="flex items-start gap-2">
            <span class="text-blue-500">•</span>
            Real monks don't ask for money directly - they silently collect morning alms
          </li>
          <li class="flex items-start gap-2">
            <span class="text-blue-500">•</span>
            Use ATMs inside banks to avoid skimming devices
          </li>
          <li class="flex items-start gap-2">
            <span class="text-blue-500">•</span>
            Keep copies of your passport and important documents
          </li>
        </ul>
      </div>
    </div>

    <!-- Report Modal -->
    <Teleport to="body">
      <div
        v-if="showReportModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="showReportModal = false"
      >
        <div class="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <div class="p-6 border-b border-gray-100">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold text-gray-900">Report a Scam</h2>
              <button
                @click="showReportModal = false"
                class="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <CloseOutlined />
              </button>
            </div>
            <p class="text-sm text-gray-500 mt-1">
              Help other travelers by sharing your experience
            </p>
          </div>

          <div v-if="submitSuccess" class="p-8 text-center">
            <CheckOutlined class="text-5xl text-green-500 mb-4" />
            <h3 class="text-lg font-medium text-gray-900">Thank you!</h3>
            <p class="text-gray-500">Your report has been submitted.</p>
          </div>

          <form v-else @submit.prevent="handleSubmitReport" class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Scam Type *</label>
              <select v-model="newReport.scam_type" class="input-thai w-full" required>
                <option value="">Select type...</option>
                <option v-for="t in scamTypes" :key="t.value" :value="t.value">
                  {{ t.icon }} {{ t.label }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                v-model="newReport.title"
                type="text"
                class="input-thai w-full"
                placeholder="Brief description of the scam"
                required
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Province *</label>
              <select v-model="newReport.province" class="input-thai w-full" required>
                <option value="">Select province...</option>
                <option v-for="p in provinces" :key="p" :value="p">{{ p }}</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                <EnvironmentOutlined class="mr-1" />
                Specific Location
              </label>
              <input
                v-model="newReport.location_name"
                type="text"
                class="input-thai w-full"
                placeholder="e.g., Near Grand Palace, Patong Beach"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                v-model="newReport.description"
                class="input-thai w-full"
                rows="4"
                placeholder="What happened? Include details that can help others avoid this scam."
                required
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Severity</label>
              <div class="flex gap-3">
                <label
                  v-for="s in [{ val: 1, label: 'Low', color: 'blue' }, { val: 2, label: 'Medium', color: 'amber' }, { val: 3, label: 'High', color: 'red' }]"
                  :key="s.val"
                  class="flex-1 cursor-pointer"
                >
                  <input
                    v-model="newReport.severity"
                    type="radio"
                    :value="s.val"
                    class="sr-only peer"
                  />
                  <div
                    class="p-3 text-center rounded-lg border-2 transition-all peer-checked:border-primary-500 peer-checked:bg-primary-50"
                    :class="[
                      `hover:bg-${s.color}-50`,
                      newReport.severity === s.val ? `border-${s.color}-500 bg-${s.color}-50` : 'border-gray-200'
                    ]"
                  >
                    <span class="text-sm font-medium">{{ s.label }}</span>
                  </div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              :disabled="submitting"
              class="btn-thai w-full flex items-center justify-center gap-2"
            >
              <LoadingOutlined v-if="submitting" class="animate-spin" />
              {{ submitting ? 'Submitting...' : 'Submit Report' }}
            </button>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.input-thai {
  @apply px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors;
}
</style>
