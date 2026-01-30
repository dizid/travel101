<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '@stores/userStore'
import { RouterLink } from 'vue-router'
import {
  DollarOutlined,
  HomeOutlined,
  CoffeeOutlined,
  CarOutlined,
  ThunderboltOutlined,
  ShoppingOutlined,
  LockOutlined,
} from '@ant-design/icons-vue'

const userStore = useUserStore()
const isPro = computed(() => userStore.isPro)

type Lifestyle = 'budget' | 'midrange' | 'luxury'
const selectedCity = ref('bangkok')
const lifestyle = ref<Lifestyle>('midrange')

interface CityData {
  name: string
  emoji: string
  costs: Record<Lifestyle, {
    rent: number
    food: number
    transport: number
    utilities: number
    entertainment: number
    total: number
  }>
}

const cities: Record<string, CityData> = {
  bangkok: {
    name: 'Bangkok',
    emoji: '🏙️',
    costs: {
      budget: { rent: 12000, food: 6000, transport: 2000, utilities: 2500, entertainment: 3000, total: 25500 },
      midrange: { rent: 25000, food: 12000, transport: 4000, utilities: 3500, entertainment: 8000, total: 52500 },
      luxury: { rent: 60000, food: 25000, transport: 8000, utilities: 5000, entertainment: 20000, total: 118000 },
    },
  },
  chiangmai: {
    name: 'Chiang Mai',
    emoji: '🌄',
    costs: {
      budget: { rent: 8000, food: 5000, transport: 1500, utilities: 2000, entertainment: 2500, total: 19000 },
      midrange: { rent: 18000, food: 10000, transport: 3000, utilities: 3000, entertainment: 6000, total: 40000 },
      luxury: { rent: 40000, food: 18000, transport: 6000, utilities: 4000, entertainment: 15000, total: 83000 },
    },
  },
  phuket: {
    name: 'Phuket',
    emoji: '🏝️',
    costs: {
      budget: { rent: 15000, food: 7000, transport: 3000, utilities: 3000, entertainment: 4000, total: 32000 },
      midrange: { rent: 30000, food: 14000, transport: 5000, utilities: 4000, entertainment: 10000, total: 63000 },
      luxury: { rent: 70000, food: 28000, transport: 10000, utilities: 6000, entertainment: 25000, total: 139000 },
    },
  },
  kohsamui: {
    name: 'Koh Samui',
    emoji: '🌴',
    costs: {
      budget: { rent: 12000, food: 6500, transport: 2500, utilities: 2800, entertainment: 3500, total: 27300 },
      midrange: { rent: 28000, food: 13000, transport: 4500, utilities: 3800, entertainment: 9000, total: 58300 },
      luxury: { rent: 65000, food: 26000, transport: 8000, utilities: 5500, entertainment: 22000, total: 126500 },
    },
  },
  pattaya: {
    name: 'Pattaya',
    emoji: '🌊',
    costs: {
      budget: { rent: 10000, food: 5500, transport: 2000, utilities: 2500, entertainment: 4000, total: 24000 },
      midrange: { rent: 22000, food: 11000, transport: 3500, utilities: 3500, entertainment: 9000, total: 49000 },
      luxury: { rent: 50000, food: 22000, transport: 7000, utilities: 5000, entertainment: 20000, total: 104000 },
    },
  },
}

const currentCity = computed(() => cities[selectedCity.value])
const currentCosts = computed(() => currentCity.value.costs[lifestyle.value])

const lifestyleLabels: Record<Lifestyle, { label: string; description: string }> = {
  budget: { label: 'Budget', description: 'Shared housing, street food, public transport' },
  midrange: { label: 'Mid-range', description: 'Studio apartment, mixed dining, motorbike' },
  luxury: { label: 'Luxury', description: 'Condo, restaurants, car rental' },
}

function formatThb(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount)
}

function formatUsd(amount: number) {
  // Approximate THB to USD conversion
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount / 35)
}

const costCategories = [
  { key: 'rent', label: 'Rent', icon: HomeOutlined, color: 'text-blue-500' },
  { key: 'food', label: 'Food', icon: CoffeeOutlined, color: 'text-orange-500' },
  { key: 'transport', label: 'Transport', icon: CarOutlined, color: 'text-green-500' },
  { key: 'utilities', label: 'Utilities', icon: ThunderboltOutlined, color: 'text-yellow-500' },
  { key: 'entertainment', label: 'Entertainment', icon: ShoppingOutlined, color: 'text-purple-500' },
]
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-50 to-white">
    <!-- Header -->
    <div class="bg-white border-b border-gray-100">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
            <DollarOutlined class="text-xl text-green-600" />
          </div>
          <div>
            <h1 class="text-2xl font-display font-bold text-gray-900">Cost of Living Calculator</h1>
            <p class="text-gray-500">Compare monthly expenses across Thai cities</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <!-- Pro gate -->
      <div v-if="!isPro" class="card-thai text-center py-12">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center">
          <LockOutlined class="text-2xl text-green-600" />
        </div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">Pro Feature</h2>
        <p class="text-gray-500 mb-6 max-w-md mx-auto">
          Compare cost of living across Thai cities and plan your budget for short or long-term stays.
        </p>
        <RouterLink to="/dashboard?upgrade=true" class="btn-thai">
          Upgrade to Pro
        </RouterLink>
      </div>

      <!-- Pro content -->
      <div v-else class="space-y-8">
        <!-- City Selection -->
        <div class="card-thai">
          <h2 class="font-semibold text-gray-900 mb-4">Select City</h2>
          <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <button
              v-for="(city, key) in cities"
              :key="key"
              @click="selectedCity = key"
              class="p-4 rounded-xl border-2 transition-all text-center"
              :class="selectedCity === key
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'"
            >
              <span class="text-2xl block mb-1">{{ city.emoji }}</span>
              <span class="text-sm font-medium" :class="selectedCity === key ? 'text-primary-700' : 'text-gray-700'">
                {{ city.name }}
              </span>
            </button>
          </div>
        </div>

        <!-- Lifestyle Selection -->
        <div class="card-thai">
          <h2 class="font-semibold text-gray-900 mb-4">Lifestyle</h2>
          <div class="grid sm:grid-cols-3 gap-4">
            <button
              v-for="(info, key) in lifestyleLabels"
              :key="key"
              @click="lifestyle = key as Lifestyle"
              class="p-4 rounded-xl border-2 text-left transition-all"
              :class="lifestyle === key
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'"
            >
              <span class="font-medium" :class="lifestyle === key ? 'text-primary-700' : 'text-gray-900'">
                {{ info.label }}
              </span>
              <p class="text-sm text-gray-500 mt-1">{{ info.description }}</p>
            </button>
          </div>
        </div>

        <!-- Results -->
        <div class="card-thai">
          <div class="flex items-center justify-between mb-6">
            <h2 class="font-semibold text-gray-900">
              Monthly Costs in {{ currentCity.emoji }} {{ currentCity.name }}
            </h2>
            <span class="text-sm text-gray-500">{{ lifestyleLabels[lifestyle].label }} lifestyle</span>
          </div>

          <div class="space-y-4 mb-6">
            <div
              v-for="cat in costCategories"
              :key="cat.key"
              class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div class="flex items-center gap-3">
                <component :is="cat.icon" :class="cat.color" />
                <span class="text-gray-700">{{ cat.label }}</span>
              </div>
              <div class="text-right">
                <span class="font-semibold text-gray-900">{{ formatThb(currentCosts[cat.key as keyof typeof currentCosts]) }}</span>
                <span class="text-sm text-gray-400 ml-2">({{ formatUsd(currentCosts[cat.key as keyof typeof currentCosts]) }})</span>
              </div>
            </div>
          </div>

          <div class="border-t border-gray-200 pt-4">
            <div class="flex items-center justify-between">
              <span class="text-lg font-semibold text-gray-900">Total Monthly</span>
              <div class="text-right">
                <span class="text-2xl font-bold text-primary-600">{{ formatThb(currentCosts.total) }}</span>
                <span class="text-gray-500 ml-2">({{ formatUsd(currentCosts.total) }})</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Comparison Hint -->
        <div class="card-thai bg-blue-50 border-blue-200">
          <p class="text-sm text-blue-700">
            <strong>Tip:</strong> Chiang Mai offers the lowest cost of living for digital nomads,
            while Bangkok provides the most amenities. Phuket and Koh Samui are great for beach lovers
            but come at a premium.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
