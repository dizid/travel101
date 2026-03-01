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
import BreadcrumbNav from '@components/ui/BreadcrumbNav.vue'
import { generateBreadcrumbSchema, injectStructuredData } from '@/utils/seo'

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

// Comprehensive safety guide sections (accordion)
const safetySections = ref([
  {
    icon: '🚕',
    title: 'Transportation Safety',
    summary: 'Taxis, tuk-tuks, motorbikes, and getting around safely',
    open: false,
    content: `<p><strong>Taxis & Tuk-Tuks:</strong> In Bangkok, always insist on the meter — "meter, khrap/ka" works. If a driver refuses, find another. Tuk-tuks don't have meters; agree on a price before getting in (typical short ride: 60-100 THB). Use <strong>Grab</strong> for transparent pricing and safety.</p><p><strong>Motorbike Rentals:</strong> Thailand's #1 safety risk for tourists. Wear a helmet (mandatory, 400 THB fine), check brakes and tires, and photograph existing damage. Drive on the left. International Driving Permit is technically required. Travel insurance often excludes motorbike injuries without a valid license.</p><p><strong>Songthaews & Buses:</strong> Red trucks (songthaews) in Chiang Mai run fixed routes cheaply (20-30 THB). Long-distance buses from Nakhonchai Air and Transport Co. are safe and comfortable. Avoid unmarked minivans at tourist areas.</p><p><strong>Boats & Ferries:</strong> Use established companies (Lomprayah, Seatran, Raja). Check weather during monsoon season. Life jackets should be available — ask for one.</p><p><strong>Night Travel:</strong> Avoid overnight buses on mountain roads. Walking in tourist areas at night is generally safe; stick to well-lit main roads in unfamiliar neighborhoods.</p>`,
  },
  {
    icon: '🍜',
    title: 'Food & Water Safety',
    summary: 'Street food, tap water, and staying healthy while eating',
    open: false,
    content: `<p><strong>Street Food:</strong> Thai street food is generally safe — high turnover means fresh ingredients. Look for stalls with long local queues. Avoid pre-cooked food sitting out, and stalls with very dark cooking oil.</p><p><strong>Tap Water:</strong> Do NOT drink tap water. Bottled water costs 7-15 THB. Ice in restaurants is made from purified water and is safe. If unsure, say "mai sai nam khaeng" (no ice).</p><p><strong>Common Issues:</strong> Traveler's diarrhea affects 20-30% of visitors, usually mild. Carry Imodium and oral rehydration salts. See a doctor if symptoms last more than 3 days or include fever.</p><p><strong>Allergies:</strong> Peanuts and shellfish are common in Thai cooking. "Phaeh" (แพ้) means "allergic to." MSG is widely used; request "mai sai phong churot" to avoid it.</p><p><strong>Seafood:</strong> Eat seafood at busy coastal restaurants with high turnover. Avoid raw shellfish at inland markets.</p>`,
  },
  {
    icon: '🏥',
    title: 'Health & Medical',
    summary: 'Hospitals, pharmacies, vaccinations, and insurance',
    open: false,
    content: `<p><strong>Healthcare Quality:</strong> Thailand has world-class hospitals — Bumrungrad International, BNH, Bangkok Hospital. Many doctors speak English and trained overseas. Costs are 50-80% cheaper than Western countries.</p><p><strong>Pharmacies:</strong> Boots and Fascino pharmacies can dispense many medications without a prescription, including antibiotics. Staff usually speak basic English.</p><p><strong>Vaccinations:</strong> No vaccinations legally required (unless from a yellow fever zone). Recommended: Hepatitis A & B, Typhoid, routine boosters. Malaria prophylaxis only for remote border areas.</p><p><strong>Mosquitoes:</strong> Dengue fever is present year-round, especially during rainy season. Use DEET repellent, wear long sleeves at dusk. Symptoms: sudden high fever, severe headache, joint pain — seek medical help immediately.</p><p><strong>Travel Insurance:</strong> Absolutely essential. SafetyWing, World Nomads, and ACS offer good policies. Many hospitals require upfront payment — insurance prevents surprise bills.</p><p><strong>Sun & Heat:</strong> Wear SPF 50+, stay hydrated (3-4 liters/day). Heat exhaustion: dizziness, nausea, rapid pulse — move to shade and hydrate.</p>`,
  },
  {
    icon: '🚨',
    title: 'Common Scams to Avoid',
    summary: 'Tourist scams, overcharging, and how to protect yourself',
    open: false,
    content: `<p><strong>"Closed Temple" Scam:</strong> Someone near the Grand Palace says it's closed and suggests a tour. It's never closed. They take you to gem shops or tailors for commission.</p><p><strong>Gem Shop Scam:</strong> Told about a "government gem sale." The gems are worthless. Thailand has NO government gem sales. Never buy gems from strangers.</p><p><strong>Jet Ski Deposit Scam:</strong> After returning a rented jet ski, the operator claims pre-existing damage. Photograph everything before renting, use a GoPro while riding.</p><p><strong>Taxi Meter Refusal:</strong> Drivers claim the meter is "broken" and quote 2-5x the real fare. Say "meter" and exit if they refuse.</p><p><strong>Tuk-Tuk Tour:</strong> A cheap city tour (20-40 THB) that mostly visits commission shops. The driver earns money from every tourist delivered.</p><p><strong>Bar Bill Padding:</strong> Common in Patong and Walking Street. Always check itemized bills, don't open tabs at unfamiliar venues.</p><p><strong>Fake Tickets:</strong> Buy train/bus/ferry tickets from official counters or 12go.asia — not from random agencies near tourist streets.</p>`,
  },
  {
    icon: '👤',
    title: 'Solo & Women Travelers',
    summary: 'Safety tips for independent and women travelers',
    open: false,
    content: `<p><strong>Overall:</strong> Thailand is one of the best countries in Asia for solo and women travelers. The culture is welcoming, infrastructure is excellent, and crime against foreigners is rare.</p><p><strong>Women Travelers:</strong> Unwanted attention from locals is uncommon, though it can occur in nightlife areas. Dress modestly at temples. Avoid deserted beaches at night and be cautious with drinks in bars.</p><p><strong>Solo Travelers:</strong> Thailand's backpacker infrastructure makes solo travel easy. Hostels are social, shared transport is straightforward. Share your itinerary with someone back home.</p><p><strong>LGBTQ+ Travelers:</strong> Thailand is one of the most LGBTQ+-friendly countries in Asia. The Marriage Equality Act passed in 2024. Bangkok and Chiang Mai have vibrant queer communities.</p><p><strong>Nightlife Safety:</strong> Never leave drinks unattended. Drink spiking occurs occasionally — stick with sealed bottles you open yourself. Use Grab for safe rides home.</p>`,
  },
  {
    icon: '⛈️',
    title: 'Weather & Natural Hazards',
    summary: 'Monsoon, flooding, and seasonal risks',
    open: false,
    content: `<p><strong>Monsoon Season:</strong> Andaman coast (Phuket, Krabi) gets heavy rain May-October. Gulf coast (Koh Samui, Koh Phangan) gets rain October-December. Bangkok sees rain June-October. Usually afternoon thunderstorms, not all-day downpours.</p><p><strong>Flooding:</strong> Flash flooding occurs during heavy rain in Bangkok. Avoid walking through floodwater — it hides open drains. Check weather reports during monsoon season.</p><p><strong>Rip Currents:</strong> The biggest ocean risk. Red flags mean no swimming. If caught: swim parallel to shore until free. Lifeguards are present on major beaches during high season.</p><p><strong>Air Quality:</strong> Northern Thailand experiences severe pollution from agricultural burning Feb-April. Check AQI via IQAir app. If above 150, wear an N95 mask outdoors.</p>`,
  },
  {
    icon: '🏛️',
    title: 'Laws & Cultural Respect',
    summary: 'Important laws, cultural norms, and things to avoid',
    open: false,
    content: `<p><strong>Lèse-Majesté:</strong> Strict laws against insulting the monarchy — even on social media. Penalties up to 15 years in prison. Do not make jokes about the royal family.</p><p><strong>Drug Laws:</strong> Harsh penalties for hard drugs. Cannabis was decriminalized in 2022 — shops are legal, but public smoking and driving under the influence are illegal.</p><p><strong>Temple Etiquette:</strong> Cover shoulders and knees. Remove shoes. Never point feet at Buddha images. Women should never touch monks.</p><p><strong>E-Cigarettes:</strong> Vaping devices are illegal in Thailand. Fines up to 30,000 THB or imprisonment. Vapes are confiscated at airports.</p><p><strong>The Head & Feet:</strong> The head is sacred — never touch anyone's head. Feet are lowest — never point them at people or Buddha images.</p>`,
  },
  {
    icon: '📞',
    title: 'Embassy & Emergency Contacts',
    summary: 'Key phone numbers and embassy information',
    open: false,
    content: `<p><strong>Emergency Numbers:</strong></p><ul><li><strong>1155</strong> — Tourist Police (English-speaking, 24/7)</li><li><strong>191</strong> — Police</li><li><strong>1669</strong> — Ambulance</li><li><strong>199</strong> — Fire Department</li></ul><p><strong>Key Embassies in Bangkok:</strong></p><ul><li><strong>US Embassy:</strong> 95 Wireless Road — 02-205-4000</li><li><strong>UK Embassy:</strong> 14 Wireless Road — 02-305-8333</li><li><strong>Australian Embassy:</strong> 181 Wireless Road — 02-344-6300</li><li><strong>Canadian Embassy:</strong> Abdulrahim Place — 02-646-4300</li></ul><p><strong>What To Do If Something Goes Wrong:</strong></p><ul><li>Call <strong>1155 (Tourist Police)</strong> first</li><li>File a police report (required for insurance claims)</li><li>Contact your embassy for serious situations</li><li>For medical emergencies, go to the nearest hospital — they treat first, handle payment after</li></ul>`,
  },
])

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
  injectStructuredData(
    'breadcrumb-schema',
    generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Safety', url: '/safety' },
    ])
  )
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
      <!-- Breadcrumb navigation -->
      <BreadcrumbNav :items="[{ name: 'Home', url: '/' }, { name: 'Safety' }]" />

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

      <!-- Comprehensive Safety Guide -->
      <div class="space-y-4 mt-8">
        <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
          <SafetyOutlined class="text-green-600" />
          Thailand Safety Guide
        </h2>
        <p class="text-gray-600 mb-6">
          Thailand is one of the safest countries in Southeast Asia for tourists. Millions of visitors travel here every year without incident. That said, being informed helps you avoid the small percentage of problems that do occur. This guide covers everything from common scams to health precautions.
        </p>

        <!-- Accordion sections -->
        <div
          v-for="(section, index) in safetySections"
          :key="index"
          class="card-thai overflow-hidden"
        >
          <button
            @click="section.open = !section.open"
            class="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-center gap-3">
              <span class="text-2xl">{{ section.icon }}</span>
              <div>
                <h3 class="font-semibold text-gray-900">{{ section.title }}</h3>
                <p class="text-sm text-gray-500">{{ section.summary }}</p>
              </div>
            </div>
            <span class="text-gray-400 text-xl shrink-0 ml-4">{{ section.open ? '−' : '+' }}</span>
          </button>
          <div v-if="section.open" class="px-4 pb-4 border-t border-gray-100 pt-4">
            <div class="prose-sm text-gray-700 space-y-3" v-html="section.content" />
          </div>
        </div>
      </div>

      <!-- Quick Tips Card -->
      <div class="card-thai mt-8 bg-blue-50 border-blue-200">
        <h3 class="font-semibold text-blue-900 mb-4">🛡️ Quick Safety Tips</h3>
        <ul class="space-y-2 text-sm text-blue-800">
          <li class="flex items-start gap-2">
            <span class="text-blue-500">•</span>
            Always use metered taxis or ride-hailing apps (Grab, Bolt) — never agree to a "flat rate"
          </li>
          <li class="flex items-start gap-2">
            <span class="text-blue-500">•</span>
            Never believe anyone who says a temple or palace is "closed today" — verify yourself
          </li>
          <li class="flex items-start gap-2">
            <span class="text-blue-500">•</span>
            Photograph rental equipment (jet skis, motorbikes) from every angle before use
          </li>
          <li class="flex items-start gap-2">
            <span class="text-blue-500">•</span>
            Real monks don't approach tourists asking for money — they silently collect morning alms
          </li>
          <li class="flex items-start gap-2">
            <span class="text-blue-500">•</span>
            Use ATMs inside banks or shopping malls to avoid card skimming devices
          </li>
          <li class="flex items-start gap-2">
            <span class="text-blue-500">•</span>
            Keep digital copies of your passport, visa, and insurance in cloud storage
          </li>
          <li class="flex items-start gap-2">
            <span class="text-blue-500">•</span>
            Buy travel insurance before you arrive — it's required for some visa types and costs very little
          </li>
          <li class="flex items-start gap-2">
            <span class="text-blue-500">•</span>
            Download Grab, Google Maps offline, and your embassy's emergency app before traveling
          </li>
        </ul>
      </div>

      <!-- Last updated -->
      <p class="text-xs text-gray-400 mt-6 text-center">Last updated: March 2026</p>
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
