<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@stores/userStore'
import {
  CheckCircleFilled,
  FileTextOutlined,
  GlobalOutlined,
  HomeOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
  LinkOutlined,
} from '@ant-design/icons-vue'
import BreadcrumbNav from '@components/ui/BreadcrumbNav.vue'
import { useBreadcrumbs, useRouteSeo } from '@/composables/useSeo'

const userStore = useUserStore()

// SEO
useRouteSeo('tdac')
useBreadcrumbs([
  { name: 'Home', url: '/' },
  { name: 'TDAC Guide', url: '/tdac' },
])

const sections = [
  { id: 'personal', label: 'Personal Info', icon: '👤' },
  { id: 'travel', label: 'Travel Details', icon: '✈️' },
  { id: 'accommodation', label: 'Accommodation', icon: '🏨' },
  { id: 'purpose', label: 'Purpose & Duration', icon: '📋' },
]

const activeSection = ref('personal')

interface FieldInfo {
  field: string
  description: string
  tips: string
}

const personalFields: FieldInfo[] = [
  { field: 'Passport Number', description: 'Exactly as shown on passport', tips: 'No spaces between characters' },
  { field: 'Full Name', description: 'Must match passport exactly', tips: 'Include middle name if on passport' },
  { field: 'Date of Birth', description: 'DD/MM/YYYY format', tips: 'Thai format, not US (MM/DD)' },
  { field: 'Nationality', description: 'Country of passport', tips: 'Not country of birth if different' },
  { field: 'Gender', description: 'As shown on passport', tips: '' },
]

const travelFields: FieldInfo[] = [
  { field: 'Flight Number', description: 'e.g., TG401', tips: 'Include airline code' },
  { field: 'Departure Airport', description: '3-letter code (e.g., SIN)', tips: 'Where you\'re flying from' },
  { field: 'Arrival Airport', description: 'BKK, DMK, HKT, CNX, etc.', tips: 'Thai airport code' },
  { field: 'Arrival Date', description: 'DD/MM/YYYY', tips: 'Must match your flight' },
]

const accommodationFields: FieldInfo[] = [
  { field: 'Hotel/Address', description: 'Where you\'re staying first night', tips: 'Can be hotel name or Airbnb address' },
  { field: 'Province', description: 'Thai province (e.g., Bangkok, Phuket)', tips: 'Select from dropdown' },
  { field: 'Phone', description: 'Contact number in Thailand', tips: 'Hotel number works fine' },
]

const purposeFields: FieldInfo[] = [
  { field: 'Purpose of Visit', description: 'Holiday/Business/Transit/Other', tips: 'Match your visa type' },
  { field: 'Length of Stay', description: 'Number of days', tips: 'Don\'t exceed visa allowance' },
  { field: 'Previous Visits', description: 'Yes/No, how many', tips: 'Be honest' },
]

const commonMistakes = [
  'Name doesn\'t match passport exactly (spaces, order)',
  'Wrong date format (use DD/MM/YYYY, not MM/DD)',
  'Forgetting to save/screenshot the QR code',
  'Submitting too early (must be within 72 hours)',
  'Using country of birth instead of passport nationality',
]
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-teal-50/50 to-white">
    <!-- Header -->
    <div class="bg-white border-b border-gray-100">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div class="text-center">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-100 text-teal-700 rounded-full text-sm font-medium mb-4">
            <FileTextOutlined />
            TDAC Guide
          </div>
          <h1 class="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-3">
            Thai Digital Arrival Card
          </h1>
          <p class="text-gray-600 max-w-2xl mx-auto">
            Complete guide to filling out your TDAC correctly.
            All fields explained with helpful tips.
          </p>
        </div>
      </div>
    </div>

    <!-- Breadcrumb navigation -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 pt-4">
      <BreadcrumbNav :items="[{ name: 'Home', url: '/' }, { name: 'TDAC Guide' }]" />
    </div>

    <!-- Quick summary -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div class="card-thai bg-gradient-to-r from-teal-50 to-cyan-50 mb-8">
        <h2 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          ✨ Quick Summary
        </h2>
        <div class="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center p-4 bg-white rounded-xl">
            <p class="text-2xl mb-1">🌐</p>
            <p class="text-sm font-medium text-gray-900">tdac.immigration.go.th</p>
            <p class="text-xs text-gray-500">Official website</p>
          </div>
          <div class="text-center p-4 bg-white rounded-xl">
            <p class="text-2xl mb-1">⏰</p>
            <p class="text-sm font-medium text-gray-900">Within 72 hours</p>
            <p class="text-xs text-gray-500">Before arrival</p>
          </div>
          <div class="text-center p-4 bg-white rounded-xl">
            <p class="text-2xl mb-1">💰</p>
            <p class="text-sm font-medium text-gray-900">Free</p>
            <p class="text-xs text-gray-500">No charge</p>
          </div>
          <div class="text-center p-4 bg-white rounded-xl">
            <p class="text-2xl mb-1">📱</p>
            <p class="text-sm font-medium text-gray-900">QR Code</p>
            <p class="text-xs text-gray-500">Sent via email</p>
          </div>
        </div>
      </div>

      <!-- Prefill notice -->
      <div v-if="userStore.hasProfile" class="card-thai bg-blue-50 border-blue-200 mb-8">
        <div class="flex items-start gap-3">
          <CheckCircleFilled class="text-blue-500 text-xl mt-0.5" />
          <div>
            <h3 class="font-medium text-blue-900">Profile data available!</h3>
            <p class="text-sm text-blue-700 mt-1">
              Based on your profile, we can pre-fill some fields for you:
              Nationality ({{ userStore.profile.prefs.nationality }}),
              Purpose ({{ userStore.profile.prefs.tripType.replace('_', ' ') }}).
            </p>
          </div>
        </div>
      </div>

      <!-- Section navigation -->
      <div class="flex flex-wrap gap-2 mb-8">
        <button
          v-for="section in sections"
          :key="section.id"
          @click="activeSection = section.id"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all"
          :class="activeSection === section.id
            ? 'bg-teal-100 text-teal-700 shadow-sm'
            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'"
        >
          <span>{{ section.icon }}</span>
          {{ section.label }}
        </button>
      </div>

      <!-- Field tables -->
      <div class="space-y-8">
        <!-- Personal Information -->
        <div v-show="activeSection === 'personal'" class="card-thai">
          <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <GlobalOutlined class="text-teal-500" />
            Personal Information
          </h3>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-100">
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">Field</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">Description</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">Tips</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="field in personalFields" :key="field.field" class="border-b border-gray-50">
                  <td class="py-3 px-4 font-medium text-gray-900">{{ field.field }}</td>
                  <td class="py-3 px-4 text-gray-600">{{ field.description }}</td>
                  <td class="py-3 px-4 text-sm text-teal-600">{{ field.tips }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Travel Details -->
        <div v-show="activeSection === 'travel'" class="card-thai">
          <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            ✈️ Travel Details
          </h3>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-100">
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">Field</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">Description</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">Tips</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="field in travelFields" :key="field.field" class="border-b border-gray-50">
                  <td class="py-3 px-4 font-medium text-gray-900">{{ field.field }}</td>
                  <td class="py-3 px-4 text-gray-600">{{ field.description }}</td>
                  <td class="py-3 px-4 text-sm text-teal-600">{{ field.tips }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Accommodation -->
        <div v-show="activeSection === 'accommodation'" class="card-thai">
          <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <HomeOutlined class="text-teal-500" />
            Accommodation
          </h3>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-100">
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">Field</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">Description</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">Tips</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="field in accommodationFields" :key="field.field" class="border-b border-gray-50">
                  <td class="py-3 px-4 font-medium text-gray-900">{{ field.field }}</td>
                  <td class="py-3 px-4 text-gray-600">{{ field.description }}</td>
                  <td class="py-3 px-4 text-sm text-teal-600">{{ field.tips }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Purpose & Duration -->
        <div v-show="activeSection === 'purpose'" class="card-thai">
          <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CalendarOutlined class="text-teal-500" />
            Purpose & Duration
          </h3>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-100">
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">Field</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">Description</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">Tips</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="field in purposeFields" :key="field.field" class="border-b border-gray-50">
                  <td class="py-3 px-4 font-medium text-gray-900">{{ field.field }}</td>
                  <td class="py-3 px-4 text-gray-600">{{ field.description }}</td>
                  <td class="py-3 px-4 text-sm text-teal-600">{{ field.tips }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Common mistakes -->
      <div class="card-thai bg-amber-50 border-amber-200 mt-8">
        <h3 class="font-semibold text-amber-900 mb-4 flex items-center gap-2">
          <ExclamationCircleOutlined class="text-amber-500" />
          Common Mistakes to Avoid
        </h3>
        <ul class="space-y-2">
          <li
            v-for="(mistake, i) in commonMistakes"
            :key="i"
            class="flex items-start gap-2 text-amber-800"
          >
            <span class="text-amber-500 mt-0.5">✗</span>
            {{ mistake }}
          </li>
        </ul>
      </div>

      <!-- CTA -->
      <div class="mt-8 text-center">
        <a
          href="https://tdac.immigration.go.th"
          target="_blank"
          rel="noopener"
          class="btn-thai inline-flex"
        >
          <LinkOutlined />
          Go to Official TDAC Website
        </a>
        <p class="text-sm text-gray-500 mt-2">
          Opens in a new tab • Official Thai Immigration website
        </p>
      </div>

      <!-- Last updated -->
      <p class="text-xs text-gray-400 mt-8 text-center">TDAC guide last updated: March 2026</p>
    </div>
  </div>
</template>
