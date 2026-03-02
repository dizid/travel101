<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@stores/userStore'
import { PhoneOutlined } from '@ant-design/icons-vue'
import BreadcrumbNav from '@components/ui/BreadcrumbNav.vue'
import { generateBreadcrumbSchema, injectStructuredData } from '@/utils/seo'

const userStore = useUserStore()

// Derive embassy contact based on the user's saved nationality
const userNationality = computed(() => userStore.profile.prefs.nationality || '')

onMounted(() => {
  injectStructuredData(
    'breadcrumb-schema',
    generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Emergency Contacts', url: '/emergency' },
    ])
  )
})

// Main emergency numbers — displayed prominently at the top
const emergencyNumbers = [
  { number: '1155', label: 'Tourist Police', note: 'English-speaking, 24/7', color: 'red' },
  { number: '191', label: 'Police', note: 'General emergencies', color: 'red' },
  { number: '1669', label: 'Ambulance', note: 'Medical emergencies', color: 'red' },
  { number: '199', label: 'Fire', note: 'Fire department', color: 'orange' },
  { number: '1178', label: 'Immigration', note: 'Visa & immigration', color: 'blue' },
  { number: '1193', label: 'Highway Police', note: 'Road accidents', color: 'blue' },
]

// Embassy directory — top 15 nationalities
const embassies = ref([
  {
    country: 'USA',
    flag: '🇺🇸',
    address: '95 Wireless Road, Lumpini, Bangkok',
    phone: '02-205-4000',
    emergencyPhone: '02-205-4000',
  },
  {
    country: 'UK',
    flag: '🇬🇧',
    address: '14 Wireless Road, Lumpini, Bangkok',
    phone: '02-305-8333',
    emergencyPhone: '02-305-8333',
  },
  {
    country: 'Australia',
    flag: '🇦🇺',
    address: '181 Wireless Road, Lumpini, Bangkok',
    phone: '02-344-6300',
    emergencyPhone: '02-344-6300',
  },
  {
    country: 'Canada',
    flag: '🇨🇦',
    address: 'Abdulrahim Place, 990 Rama IV Rd, Silom',
    phone: '02-646-4300',
    emergencyPhone: '02-646-4300',
  },
  {
    country: 'Germany',
    flag: '🇩🇪',
    address: '9 South Sathorn Road, Yanawa, Bangkok',
    phone: '02-287-9000',
    emergencyPhone: '02-287-9000',
  },
  {
    country: 'France',
    flag: '🇫🇷',
    address: '35 Charoenkrung Road 36, Bangrak, Bangkok',
    phone: '02-657-5100',
    emergencyPhone: '02-657-5100',
  },
  {
    country: 'Netherlands',
    flag: '🇳🇱',
    address: '15 Soi Tonson, Ploenchit, Bangkok',
    phone: '02-309-5200',
    emergencyPhone: '02-309-5200',
  },
  {
    country: 'Japan',
    flag: '🇯🇵',
    address: '177 Witthayu Road, Lumpini, Bangkok',
    phone: '02-207-8500',
    emergencyPhone: '02-207-8500',
  },
  {
    country: 'South Korea',
    flag: '🇰🇷',
    address: '23 Thiam-Ruammit Road, Huai Khwang, Bangkok',
    phone: '02-247-7537',
    emergencyPhone: '02-247-7537',
  },
  {
    country: 'China',
    flag: '🇨🇳',
    address: '57 Ratchadaphisek Road, Din Daeng, Bangkok',
    phone: '02-245-7032',
    emergencyPhone: '02-245-7032',
  },
  {
    country: 'India',
    flag: '🇮🇳',
    address: '46 Soi Prasarnmit, Sukhumvit 23, Bangkok',
    phone: '02-258-0300',
    emergencyPhone: '02-258-0300',
  },
  {
    country: 'Sweden',
    flag: '🇸🇪',
    address: '20th Floor, Pacific Place One, 140 Sukhumvit Rd',
    phone: '02-263-7200',
    emergencyPhone: '02-263-7200',
  },
  {
    country: 'New Zealand',
    flag: '🇳🇿',
    address: 'M Thai Tower, 14th Floor, All Seasons Place',
    phone: '02-254-2530',
    emergencyPhone: '02-254-2530',
  },
  {
    country: 'Russia',
    flag: '🇷🇺',
    address: '78 Sap Road, Bangrak, Bangkok',
    phone: '02-234-9824',
    emergencyPhone: '02-234-9824',
  },
  {
    country: 'Israel',
    flag: '🇮🇱',
    address: '25th Floor, Ocean Tower 2, 75/6 Sukhumvit 19',
    phone: '02-204-9200',
    emergencyPhone: '02-204-9200',
  },
])

// Embassy search filter
const embassySearch = ref('')

const filteredEmbassies = computed(() => {
  if (!embassySearch.value) return embassies.value
  const q = embassySearch.value.toLowerCase()
  return embassies.value.filter(e => e.country.toLowerCase().includes(q))
})

// User's embassy based on nationality from profile
const userEmbassy = computed(() => {
  if (!userNationality.value) return null
  return embassies.value.find(
    e => e.country.toLowerCase() === userNationality.value.toLowerCase()
  ) || null
})

// "What to do if..." emergency scenario cards
const emergencyScenarios = [
  {
    icon: '🛂',
    title: 'Lost or Stolen Passport',
    steps: [
      'File a police report at the nearest station (Tourist Police: 1155)',
      'Contact your embassy immediately — they issue emergency travel documents',
      'Keep the police report — required for new passport application',
      'Take photos of your passport on your phone as backup',
    ],
  },
  {
    icon: '🏥',
    title: 'Medical Emergency',
    steps: [
      'Call 1669 for an ambulance',
      'Go to the nearest private hospital — they treat first, payment later',
      'Contact your travel insurance before or immediately after treatment',
      'Ask a Thai person to help call if you cannot communicate',
    ],
  },
  {
    icon: '🚨',
    title: 'Victim of Crime',
    steps: [
      'Call Tourist Police 1155 — they speak English and understand tourist issues',
      'File an official police report — required for insurance claims',
      'Do not pay any "fines" directly to police — insist on an official station',
      'Contact your embassy if the situation is serious',
    ],
  },
  {
    icon: '🌊',
    title: 'Natural Disaster',
    steps: [
      'Follow instructions from local authorities immediately',
      'Move to higher ground if there is any flood or tsunami risk',
      'Contact your embassy — they can locate and assist nationals',
      'Register with your embassy\'s crisis line if available',
    ],
  },
  {
    icon: '🚗',
    title: 'Traffic Accident',
    steps: [
      'Call 1669 for ambulance if there are injuries',
      'Do not move injured people unless there is immediate danger',
      'Take photos of the scene, vehicles, and damage before moving',
      'Call Highway Police 1193 for accidents on major roads',
    ],
  },
  {
    icon: '🗺️',
    title: 'Lost in Remote Area',
    steps: [
      'Stay calm and stay put — searchers find stationary people faster',
      'Call 191 (Police) and describe your last known location',
      'Use Google Maps offline — download maps before travel',
      'Signal with a mirror, bright clothing, or whistle if you have one',
    ],
  },
]

// Recommended safety apps
const safetyApps = [
  {
    icon: '🚗',
    name: 'Grab',
    description: 'Ride-hailing with transparent pricing. Safer than negotiating with tuk-tuks.',
    platform: 'iOS & Android',
  },
  {
    icon: '🗺️',
    name: 'Google Maps',
    description: 'Download offline maps for your region before leaving Wi-Fi.',
    platform: 'iOS & Android',
  },
  {
    icon: '💬',
    name: 'LINE',
    description: 'Thailand\'s primary messaging app. Locals, hospitals, and services use it.',
    platform: 'iOS & Android',
  },
  {
    icon: '💨',
    name: 'IQAir',
    description: 'Real-time air quality. Critical for northern Thailand in Feb–April burning season.',
    platform: 'iOS & Android',
  },
  {
    icon: '🚌',
    name: 'ViaBus',
    description: 'Bangkok bus routes in English. Great for budget transport around the city.',
    platform: 'iOS & Android',
  },
  {
    icon: '💱',
    name: 'XE Currency',
    description: 'Live exchange rates. Check before exchanging money to avoid bad rates.',
    platform: 'iOS & Android',
  },
]
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-red-50/30 to-white">
    <!-- Header -->
    <div class="bg-white border-b border-gray-100">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <span class="text-2xl">🆘</span>
          </div>
          <div>
            <h1 class="text-2xl font-display font-bold text-gray-900">Emergency Contacts — Thailand</h1>
            <p class="text-gray-500 text-sm">Essential numbers, embassy directory, and what to do if something goes wrong.</p>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <!-- Breadcrumb -->
      <BreadcrumbNav :items="[{ name: 'Home', url: '/' }, { name: 'Emergency Contacts' }]" />

      <!-- ============================= -->
      <!-- Section 1: Emergency Numbers -->
      <!-- ============================= -->
      <div class="card-thai bg-red-50 border-red-200 mb-8">
        <div class="flex items-center gap-3 mb-4">
          <PhoneOutlined class="text-2xl text-red-600" />
          <h2 class="font-bold text-red-900 text-lg">Emergency Numbers</h2>
          <span class="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Save these now</span>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div
            v-for="num in emergencyNumbers"
            :key="num.number"
            class="bg-white rounded-xl p-4 text-center shadow-sm border"
            :class="num.color === 'red' ? 'border-red-100' : 'border-blue-100'"
          >
            <a
              :href="`tel:${num.number}`"
              class="block group"
            >
              <span
                class="text-3xl md:text-4xl font-bold block mb-1 group-hover:underline"
                :class="num.color === 'red' ? 'text-red-600' : 'text-blue-600'"
              >
                {{ num.number }}
              </span>
              <p class="text-sm font-semibold text-gray-800">{{ num.label }}</p>
              <p class="text-xs text-gray-500 mt-0.5">{{ num.note }}</p>
            </a>
          </div>
        </div>
        <p class="text-xs text-red-700 mt-4 text-center">
          Tap any number to call directly. Save them to your contacts before you need them.
        </p>
      </div>

      <!-- ========================= -->
      <!-- Section 2: SOS Card       -->
      <!-- ========================= -->
      <div class="card-thai border-2 border-dashed border-red-300 bg-red-50 mb-8">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-xl">📱</span>
          <h2 class="font-bold text-gray-900">SOS Card — Screenshot This</h2>
          <span class="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Show to locals in an emergency</span>
        </div>

        <div class="bg-white rounded-xl p-5 border border-red-200">
          <h3 class="text-center font-bold text-lg text-gray-900 mb-1">If I need help, please call:</h3>
          <p class="text-center text-gray-500 text-sm mb-4">ถ้าฉันต้องการความช่วยเหลือ โปรดโทร:</p>

          <div class="grid grid-cols-2 gap-3 mb-5">
            <div class="bg-red-50 rounded-lg p-3 text-center">
              <span class="text-2xl font-bold text-red-600 block">1155</span>
              <span class="text-xs text-gray-600">Tourist Police</span>
            </div>
            <div class="bg-red-50 rounded-lg p-3 text-center">
              <span class="text-2xl font-bold text-red-600 block">1669</span>
              <span class="text-xs text-gray-600">Ambulance / หน่วยกู้ชีพ</span>
            </div>
          </div>

          <!-- User's embassy if nationality is set -->
          <div v-if="userEmbassy" class="bg-blue-50 rounded-lg p-3 mb-5">
            <p class="text-xs font-semibold text-blue-700 mb-1">My Embassy {{ userEmbassy.flag }}:</p>
            <p class="text-sm font-medium text-gray-900">{{ userEmbassy.country }} Embassy</p>
            <a :href="`tel:${userEmbassy.phone}`" class="text-sm text-blue-600 font-bold hover:underline">
              {{ userEmbassy.phone }}
            </a>
          </div>
          <div v-else class="bg-gray-50 rounded-lg p-3 mb-5 text-center">
            <p class="text-xs text-gray-500">
              Set your nationality in your
              <a href="/profile" class="text-primary-600 underline">travel profile</a>
              to see your embassy contact here.
            </p>
          </div>

          <!-- Basic Thai phrases -->
          <div>
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Emergency phrases in Thai</p>
            <div class="space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500">"Help!"</span>
                <span class="font-thai font-semibold text-gray-900">ช่วยด้วย</span>
                <span class="text-gray-500 text-xs italic">chûay dûay</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500">"Call the police"</span>
                <span class="font-thai font-semibold text-gray-900">โทรหาตำรวจ</span>
                <span class="text-gray-500 text-xs italic">toh hǎa dtam-rùat</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500">"Call a doctor"</span>
                <span class="font-thai font-semibold text-gray-900">โทรหาหมอ</span>
                <span class="text-gray-500 text-xs italic">toh hǎa mǒr</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500">"I need an ambulance"</span>
                <span class="font-thai font-semibold text-gray-900">ฉันต้องการรถพยาบาล</span>
                <span class="text-gray-500 text-xs italic">chǎn dtông-gaan rót pá-yaa-baan</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================= -->
      <!-- Section 3: What To Do If -->
      <!-- ========================= -->
      <div class="mb-8">
        <h2 class="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <span>⚡</span> What To Do If...
        </h2>
        <p class="text-gray-500 text-sm mb-5">Quick-reference guides for the most common emergency situations.</p>

        <div class="grid md:grid-cols-2 gap-4">
          <div
            v-for="scenario in emergencyScenarios"
            :key="scenario.title"
            class="card-thai"
          >
            <div class="flex items-center gap-2 mb-3">
              <span class="text-2xl">{{ scenario.icon }}</span>
              <h3 class="font-semibold text-gray-900">{{ scenario.title }}</h3>
            </div>
            <ol class="space-y-2">
              <li
                v-for="(step, i) in scenario.steps"
                :key="i"
                class="flex items-start gap-2 text-sm text-gray-700"
              >
                <span class="shrink-0 w-5 h-5 rounded-full bg-red-100 text-red-700 text-xs flex items-center justify-center font-semibold mt-0.5">
                  {{ i + 1 }}
                </span>
                {{ step }}
              </li>
            </ol>
          </div>
        </div>
      </div>

      <!-- ============================= -->
      <!-- Section 4: Embassy Directory  -->
      <!-- ============================= -->
      <div class="mb-8">
        <h2 class="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <span>🏛️</span> Embassy Directory — Bangkok
        </h2>
        <p class="text-gray-500 text-sm mb-4">All major embassies are in Bangkok. If you are outside Bangkok, call first before traveling to the embassy.</p>

        <!-- Search -->
        <div class="relative mb-4">
          <input
            v-model="embassySearch"
            type="text"
            placeholder="Search by country..."
            class="w-full pl-4 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400 text-sm"
          />
        </div>

        <div class="grid sm:grid-cols-2 gap-4">
          <div
            v-for="embassy in filteredEmbassies"
            :key="embassy.country"
            class="card-thai hover:border-red-200 transition-colors"
            :class="userNationality && embassy.country.toLowerCase() === userNationality.toLowerCase()
              ? 'border-blue-300 bg-blue-50/30'
              : ''"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xl">{{ embassy.flag }}</span>
                  <h3 class="font-semibold text-gray-900 truncate">{{ embassy.country }}</h3>
                  <span
                    v-if="userNationality && embassy.country.toLowerCase() === userNationality.toLowerCase()"
                    class="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium shrink-0"
                  >
                    Your embassy
                  </span>
                </div>
                <p class="text-xs text-gray-500 leading-relaxed">{{ embassy.address }}</p>
              </div>
              <a
                :href="`tel:${embassy.phone}`"
                class="shrink-0 flex items-center gap-1 text-sm font-semibold text-red-600 hover:text-red-700 whitespace-nowrap"
              >
                <PhoneOutlined class="text-xs" />
                {{ embassy.phone }}
              </a>
            </div>
          </div>
        </div>

        <p v-if="filteredEmbassies.length === 0" class="text-center text-gray-500 py-8">
          No embassy found matching "{{ embassySearch }}".
        </p>
      </div>

      <!-- ============================= -->
      <!-- Section 5: Useful Apps        -->
      <!-- ============================= -->
      <div class="mb-8">
        <h2 class="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <span>📲</span> Useful Apps to Download
        </h2>
        <p class="text-gray-500 text-sm mb-5">Download these before you need them — some require Wi-Fi to set up.</p>

        <div class="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div
            v-for="app in safetyApps"
            :key="app.name"
            class="card-thai hover:border-primary-200 transition-colors"
          >
            <div class="flex items-start gap-3">
              <span class="text-2xl shrink-0">{{ app.icon }}</span>
              <div>
                <h3 class="font-semibold text-gray-900">{{ app.name }}</h3>
                <p class="text-xs text-gray-500 mt-0.5 leading-relaxed">{{ app.description }}</p>
                <span class="text-xs text-primary-600 font-medium mt-1 inline-block">{{ app.platform }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Disclaimer -->
      <div class="card-thai bg-gray-50 border-gray-200 text-sm text-gray-600 text-center">
        <p>
          Phone numbers are verified as of March 2026. Embassy numbers may change — always check your country's official government travel advisory for the latest contact details.
        </p>
      </div>

      <p class="text-xs text-gray-400 mt-6 text-center">Last updated: March 2026</p>
    </div>
  </div>
</template>
