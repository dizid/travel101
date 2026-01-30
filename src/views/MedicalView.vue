<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '@stores/userStore'
import { RouterLink } from 'vue-router'
import {
  MedicineBoxOutlined,
  StarFilled,
  EnvironmentOutlined,
  PhoneOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined,
  LockOutlined,
  SearchOutlined,
} from '@ant-design/icons-vue'

const userStore = useUserStore()
const isPro = computed(() => userStore.isPro)

const selectedCategory = ref('all')
const searchQuery = ref('')

const categories = [
  { id: 'all', label: 'All', icon: '🏥' },
  { id: 'hospital', label: 'Hospitals', icon: '🏨' },
  { id: 'dental', label: 'Dental', icon: '🦷' },
  { id: 'wellness', label: 'Wellness', icon: '🧘' },
  { id: 'cosmetic', label: 'Cosmetic', icon: '✨' },
]

// Mock data - will be replaced with database
const facilities = ref([
  {
    id: 1,
    name: 'Bumrungrad International Hospital',
    type: 'hospital',
    province: 'Bangkok',
    rating: 4.8,
    jciAccredited: true,
    englishSpeaking: true,
    specialties: ['Cardiology', 'Orthopedics', 'Oncology', 'Neurology'],
    priceRange: '$$$',
    phone: '+66 2 066 8888',
    website: 'https://www.bumrungrad.com',
  },
  {
    id: 2,
    name: 'Bangkok Hospital',
    type: 'hospital',
    province: 'Bangkok',
    rating: 4.7,
    jciAccredited: true,
    englishSpeaking: true,
    specialties: ['General Surgery', 'Heart Center', 'Cancer Center'],
    priceRange: '$$$',
    phone: '+66 2 310 3000',
    website: 'https://www.bangkokhospital.com',
  },
  {
    id: 3,
    name: 'Bangkok Smile Dental Clinic',
    type: 'dental',
    province: 'Bangkok',
    rating: 4.9,
    jciAccredited: false,
    englishSpeaking: true,
    specialties: ['Implants', 'Veneers', 'Whitening', 'Invisalign'],
    priceRange: '$$',
    phone: '+66 2 664 0061',
    website: 'https://www.bangkoksmiledental.com',
  },
  {
    id: 4,
    name: 'Chiva-Som International Health Resort',
    type: 'wellness',
    province: 'Prachuap Khiri Khan',
    rating: 4.9,
    jciAccredited: false,
    englishSpeaking: true,
    specialties: ['Detox', 'Weight Management', 'Stress Relief', 'Holistic Healing'],
    priceRange: '$$$',
    phone: '+66 3 253 6536',
    website: 'https://www.chivasom.com',
  },
  {
    id: 5,
    name: 'Yanhee Hospital',
    type: 'cosmetic',
    province: 'Bangkok',
    rating: 4.5,
    jciAccredited: true,
    englishSpeaking: true,
    specialties: ['Plastic Surgery', 'Dermatology', 'Hair Transplant'],
    priceRange: '$$',
    phone: '+66 2 879 0157',
    website: 'https://www.yanhee.net',
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
      <!-- Pro gate -->
      <div v-if="!isPro" class="card-thai text-center py-12">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
          <LockOutlined class="text-2xl text-red-600" />
        </div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">Pro Feature</h2>
        <p class="text-gray-500 mb-6 max-w-md mx-auto">
          Access our verified directory of JCI-accredited hospitals, dental clinics, and wellness centers.
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
                  <span class="flex items-center gap-1">
                    <StarFilled class="text-amber-400" />
                    {{ facility.rating }}
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
