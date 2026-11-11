<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '@stores/userStore'
import { RouterLink } from 'vue-router'
import {
  MedicineBoxOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined,
  LockOutlined,
  SearchOutlined,
} from '@ant-design/icons-vue'
import BreadcrumbNav from '@components/ui/BreadcrumbNav.vue'
import { useBreadcrumbs, useRouteSeo } from '@/composables/useSeo'

const userStore = useUserStore()
const isPro = computed(() => userStore.isPro)

// SEO
useRouteSeo('medical')
useBreadcrumbs([
  { name: 'Home', url: '/' },
  { name: 'Medical', url: '/medical' },
])

const selectedCategory = ref('all')
const searchQuery = ref('')

const categories = [
  { id: 'all', label: 'All', icon: '🏥' },
  { id: 'hospital', label: 'Hospitals', icon: '🏨' },
  { id: 'dental', label: 'Dental', icon: '🦷' },
  { id: 'wellness', label: 'Wellness', icon: '🧘' },
  { id: 'cosmetic', label: 'Cosmetic', icon: '✨' },
]

// Facility data. Phones, websites and JCI badges checked on each organization's own site, 12 Nov 2026
// (T-0447, output/T-0447-medical-facts.md). Unsourced star ratings were removed.
const facilities = ref([
  {
    id: 1,
    name: 'Bumrungrad International Hospital',
    type: 'hospital',
    province: 'Bangkok',
    jciAccredited: true,
    englishSpeaking: true,
    specialties: ['Cardiology', 'Orthopedics', 'Oncology', 'Neurology', 'Gastroenterology'],
    priceRange: '$$$',
    phone: '+66 2 066 8888',
    website: 'https://www.bumrungrad.com',
  },
  {
    id: 2,
    name: 'Bangkok Hospital',
    type: 'hospital',
    province: 'Bangkok',
    jciAccredited: true,
    englishSpeaking: true,
    specialties: ['General Surgery', 'Heart Center', 'Cancer Center', 'Spine Institute'],
    priceRange: '$$$',
    phone: '+66 2 310 3000',
    website: 'https://www.bangkokhospital.com',
  },
  {
    id: 3,
    name: 'BNH Hospital',
    type: 'hospital',
    province: 'Bangkok',
    jciAccredited: true,
    englishSpeaking: true,
    specialties: ['Obstetrics', 'Orthopedics', 'General Medicine', 'Pediatrics'],
    priceRange: '$$$',
    phone: '+66 2 022 0700',
    website: 'https://www.bnhhospital.com',
  },
  {
    id: 4,
    name: 'Samitivej Hospital (Sukhumvit)',
    type: 'hospital',
    province: 'Bangkok',
    jciAccredited: true,
    englishSpeaking: true,
    specialties: ['Pediatrics', 'Women\'s Health', 'Cardiology', 'Emergency Care'],
    priceRange: '$$$',
    phone: '+66 2 022 2222',
    website: 'https://www.samitivejhospitals.com',
  },
  {
    id: 5,
    name: 'Medpark Hospital',
    type: 'hospital',
    province: 'Bangkok',
    jciAccredited: true,
    englishSpeaking: true,
    specialties: ['Robotics Surgery', 'Spine Center', 'Oncology', 'Neuroscience'],
    priceRange: '$$$',
    phone: '+66 2 023 3333',
    website: 'https://www.medparkhospital.com',
  },
  {
    id: 6,
    name: 'Bangkok Hospital Siriroj (Phuket)',
    type: 'hospital',
    province: 'Phuket',
    jciAccredited: true,
    englishSpeaking: true,
    specialties: ['Emergency Care', 'General Surgery', 'Orthopedics'],
    priceRange: '$$',
    phone: '+66 76 361 888',
    website: 'https://www.bangkokhospital.com/en/siriroj',
  },
  {
    id: 7,
    name: 'Bangkok Hospital Chiang Mai',
    type: 'hospital',
    province: 'Chiang Mai',
    jciAccredited: true,
    englishSpeaking: true,
    specialties: ['General Medicine', 'Orthopedics', 'Cardiology', 'Emergency'],
    priceRange: '$$',
    phone: '+66 52 089 888',
    website: 'https://www.bangkokhospital.com/en/chiangmai',
  },
  {
    id: 8,
    name: 'Chiang Mai Ram Hospital',
    type: 'hospital',
    province: 'Chiang Mai',
    jciAccredited: true,
    englishSpeaking: true,
    specialties: ['General Medicine', 'Dental', 'Ophthalmology', 'Dermatology'],
    priceRange: '$$',
    phone: '+66 52 004 699',
    website: 'https://www.chiangmairam.com',
  },
  {
    id: 9,
    name: 'Bangkok Smile Dental Clinic',
    type: 'dental',
    province: 'Bangkok',
    jciAccredited: false,
    englishSpeaking: true,
    specialties: ['Implants', 'Veneers', 'Whitening', 'Invisalign'],
    priceRange: '$$',
    phone: '+66 2 105 4288',
    website: 'https://www.bangkoksmiledental.com',
  },
  {
    id: 10,
    name: 'BIDC Dental Hospital',
    type: 'dental',
    province: 'Bangkok',
    jciAccredited: true,
    englishSpeaking: true,
    specialties: ['Implants', 'Root Canal', 'Crowns', 'Cosmetic Dentistry'],
    priceRange: '$$',
    phone: '+66 2 692 4433',
    website: 'https://bangkokdentalcenter.com',
  },
  {
    id: 12,
    name: 'Chiva-Som International Health Resort',
    type: 'wellness',
    province: 'Prachuap Khiri Khan',
    jciAccredited: false,
    englishSpeaking: true,
    specialties: ['Detox', 'Weight Management', 'Stress Relief', 'Holistic Healing'],
    priceRange: '$$$',
    phone: '+66 32 536 536',
    website: 'https://www.chivasom.com',
  },
  {
    id: 13,
    name: 'Kamalaya Wellness Sanctuary',
    type: 'wellness',
    province: 'Koh Samui',
    jciAccredited: false,
    englishSpeaking: true,
    specialties: ['Detox', 'Yoga', 'Emotional Balance', 'Sleep Enhancement'],
    priceRange: '$$$',
    phone: '+66 77 429 800',
    website: 'https://www.kamalaya.com',
  },
  {
    id: 14,
    name: 'RAKxa Wellness Retreat',
    type: 'wellness',
    province: 'Bangkok',
    jciAccredited: false,
    englishSpeaking: true,
    specialties: ['Integrative Medicine', 'Anti-Aging', 'Gut Health', 'Detox'],
    priceRange: '$$$',
    phone: '+66 2 055 3100',
    website: 'https://rakxawellness.com',
  },
  {
    id: 15,
    name: 'Yanhee Hospital',
    type: 'cosmetic',
    province: 'Bangkok',
    jciAccredited: false, // own JCI page shows 11 Mar 2023 - 10 Mar 2026; no renewal published
    englishSpeaking: true,
    specialties: ['Plastic Surgery', 'Dermatology', 'Hair Transplant', 'Laser'],
    priceRange: '$$',
    phone: '+66 2 879 0300',
    website: 'https://www.yanhee.net',
  },
  {
    id: 16,
    name: 'Nirunda Aesthetic Clinic',
    type: 'cosmetic',
    province: 'Bangkok',
    jciAccredited: false,
    englishSpeaking: true,
    specialties: ['Plastic Surgery', 'Skin Rejuvenation', 'Body Contouring', 'Hair Restoration'],
    priceRange: '$$$',
    phone: '+66 2 160 4191',
    website: 'https://www.nirundaclinic.com',
  },
  {
    id: 17,
    name: 'Bangkok Hospital Samui',
    type: 'hospital',
    province: 'Koh Samui',
    jciAccredited: false,
    englishSpeaking: true,
    specialties: ['Emergency', 'General Medicine', 'Surgery', 'Diagnostics'],
    priceRange: '$$',
    phone: '+66 77 429 500',
    website: 'https://www.bangkokhospital.com/en/samui',
  },
])

const filteredFacilities = computed(() => {
  return facilities.value.filter(f => {
    const matchesCategory = selectedCategory.value === 'all' || f.type === selectedCategory.value
    const matchesSearch = !searchQuery.value ||
      f.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      f.province.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchesCategory && matchesSearch
  })
})

function getPriceLabel(range: string) {
  const labels: Record<string, string> = {
    '$': 'Budget-friendly',
    '$$': 'Mid-range',
    '$$$': 'Premium',
  }
  return labels[range] || range
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-50 to-white">
    <!-- Header -->
    <div class="bg-white border-b border-gray-100">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
            <MedicineBoxOutlined class="text-xl text-red-600" />
          </div>
          <div>
            <h1 class="text-2xl font-display font-bold text-gray-900">Medical Tourism</h1>
            <p class="text-gray-500">Find trusted hospitals, clinics & specialists in Thailand</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <!-- Breadcrumb navigation -->
      <BreadcrumbNav :items="[{ name: 'Home', url: '/' }, { name: 'Medical' }]" />

      <!-- Editorial Introduction (visible to everyone) -->
      <div class="card-thai mb-8 prose-sm">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Why Thailand for Medical Tourism?</h2>
        <p class="text-gray-700 leading-relaxed mb-3">
          Thailand is one of the world's leading medical tourism destinations: industry estimates put foreign patient visits at <strong>around 3 million a year</strong>. Many procedures cost far less than in the US, UK, or Australia, and Bangkok has several <strong>JCI-accredited hospitals</strong> (Joint Commission International — the best-known international hospital accreditation).
        </p>
        <p class="text-gray-700 leading-relaxed mb-3">
          Many doctors at the top international hospitals trained abroad and speak English. <strong>Bumrungrad International</strong>, for example, reports over 1.1 million patients a year from 190+ countries.
        </p>
        <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-3">What People Come For</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div class="flex items-start gap-2">
            <span class="text-green-500 mt-0.5">✓</span>
            <div>
              <strong class="text-gray-800">Dental Work</strong>
              <p class="text-gray-600 text-xs">An implant with crown costs about 65,000-134,000 THB at Bangkok Hospital (its price list, valid to 31 Dec 2026). Veneers, crowns, and cosmetic dentistry are also common reasons to come.</p>
            </div>
          </div>
          <div class="flex items-start gap-2">
            <span class="text-green-500 mt-0.5">✓</span>
            <div>
              <strong class="text-gray-800">Orthopedic Surgery</strong>
              <p class="text-gray-600 text-xs">Total knee replacement (one knee) from 310,000 THB excluding the implant at Bangkok Hospital (4 nights, valid to 31 Dec 2026). Check each hospital's package page for hip prices.</p>
            </div>
          </div>
          <div class="flex items-start gap-2">
            <span class="text-green-500 mt-0.5">✓</span>
            <div>
              <strong class="text-gray-800">Cosmetic Surgery</strong>
              <p class="text-gray-600 text-xs">Rhinoplasty, facelifts, and body contouring. Yanhee Hospital and Nirunda Clinic are well-known options.</p>
            </div>
          </div>
          <div class="flex items-start gap-2">
            <span class="text-green-500 mt-0.5">✓</span>
            <div>
              <strong class="text-gray-800">Wellness Retreats</strong>
              <p class="text-gray-600 text-xs">Retreats like Chiva-Som and Kamalaya offer detox, stress and sleep programs. They are wellness resorts, not hospitals.</p>
            </div>
          </div>
        </div>
        <h3 class="text-lg font-semibold text-gray-800 mt-6 mb-3">What to Know Before You Go</h3>
        <ul class="space-y-2 text-gray-700 text-sm">
          <li class="flex items-start gap-2">
            <span class="text-primary-500">•</span>
            <strong>JCI accreditation</strong> means the hospital meets international safety and quality standards. Around 60 hospitals in Thailand held it in 2024; JCI's own directory has the current list.
          </li>
          <li class="flex items-start gap-2">
            <span class="text-primary-500">•</span>
            <strong>Ask for prices first</strong> — consultation fees differ per hospital (Samitivej's online consultation, for example, starts at 500 THB for 15 minutes). Ask for a written estimate before you travel.
          </li>
          <li class="flex items-start gap-2">
            <span class="text-primary-500">•</span>
            <strong>Travel insurance</strong> — check your policy covers pre-planned medical procedures. Standard travel insurance usually doesn't. Consider specialized medical travel insurance.
          </li>
          <li class="flex items-start gap-2">
            <span class="text-primary-500">•</span>
            <strong>Plan recovery time</strong> — don't schedule flights immediately after procedures. Bangkok hotels near hospitals offer medical recovery packages.
          </li>
          <li class="flex items-start gap-2">
            <span class="text-primary-500">•</span>
            <strong>Bring records</strong> — bring X-rays, medical history, and prescriptions from your home doctor. Most hospitals accept emailed records in advance.
          </li>
        </ul>
      </div>

      <!-- Last updated -->
      <p class="text-xs text-gray-400 mb-6 text-center">Last updated: November 2026</p>

      <!-- Pro gate -->
      <div v-if="!isPro" class="card-thai text-center py-12">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
          <LockOutlined class="text-2xl text-red-600" />
        </div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">Pro Feature</h2>
        <p class="text-gray-500 mb-6 max-w-md mx-auto">
          Access our directory of hospitals, dental clinics, wellness and cosmetic clinics, with phone numbers checked in November 2026 and JCI accreditation marked.
        </p>
        <RouterLink to="/dashboard?upgrade=true" class="btn-thai">
          Upgrade to Pro
        </RouterLink>
      </div>

      <!-- Pro content -->
      <div v-else class="space-y-6">
        <!-- Search & Filter -->
        <div class="card-thai">
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="flex-1 relative">
              <SearchOutlined class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search by name or location..."
                class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <!-- Categories -->
          <div class="flex flex-wrap gap-2 mt-4">
            <button
              v-for="cat in categories"
              :key="cat.id"
              @click="selectedCategory = cat.id"
              class="px-4 py-2 rounded-full text-sm font-medium transition-colors"
              :class="selectedCategory === cat.id
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
            >
              {{ cat.icon }} {{ cat.label }}
            </button>
          </div>
        </div>

        <!-- Results -->
        <div class="grid gap-4">
          <div
            v-for="facility in filteredFacilities"
            :key="facility.id"
            class="card-thai hover:border-primary-200 transition-colors"
          >
            <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <h3 class="font-semibold text-gray-900">{{ facility.name }}</h3>
                  <span v-if="facility.jciAccredited" class="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    <SafetyCertificateOutlined />
                    JCI
                  </span>
                </div>

                <div class="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                  <span class="flex items-center gap-1">
                    <EnvironmentOutlined />
                    {{ facility.province }}
                  </span>
                  <span>{{ getPriceLabel(facility.priceRange) }}</span>
                </div>

                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="specialty in facility.specialties.slice(0, 4)"
                    :key="specialty"
                    class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                  >
                    {{ specialty }}
                  </span>
                  <span v-if="facility.specialties.length > 4" class="text-xs text-gray-400">
                    +{{ facility.specialties.length - 4 }} more
                  </span>
                </div>
              </div>

              <div class="flex sm:flex-col gap-2">
                <a
                  :href="`tel:${facility.phone}`"
                  class="btn-thai-outline text-sm flex items-center gap-2"
                >
                  <PhoneOutlined />
                  Call
                </a>
                <a
                  :href="facility.website"
                  target="_blank"
                  rel="noopener"
                  class="btn-thai-ghost text-sm flex items-center gap-2"
                >
                  <GlobalOutlined />
                  Website
                </a>
              </div>
            </div>
          </div>

          <div v-if="filteredFacilities.length === 0" class="card-thai text-center py-8">
            <p class="text-gray-500">No facilities found matching your criteria.</p>
          </div>
        </div>

        <!-- Disclaimer -->
        <div class="card-thai bg-gray-50 border-gray-200 text-sm text-gray-600">
          <p>
            <strong>Disclaimer:</strong> This directory is for informational purposes only.
            Always verify credentials and read reviews before choosing a medical provider.
            We recommend consulting with your home country's medical professionals before traveling for treatment.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
