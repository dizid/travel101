<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '@stores/userStore'
import { RouterLink } from 'vue-router'
import {
  MobileOutlined,
  BankOutlined,
  SwapOutlined,
  CheckCircleFilled,
  LockOutlined,
  RightOutlined,
} from '@ant-design/icons-vue'

const userStore = useUserStore()
const isPro = computed(() => userStore.isPro)

const activeSection = ref<'sim' | 'banking' | 'exchange'>('sim')

const sections = [
  { id: 'sim', label: 'SIM Cards', icon: MobileOutlined, emoji: '📱' },
  { id: 'banking', label: 'Banking', icon: BankOutlined, emoji: '🏦' },
  { id: 'exchange', label: 'Money Exchange', icon: SwapOutlined, emoji: '💱' },
]

const simProviders = [
  {
    name: 'AIS',
    logo: '🔵',
    bestFor: 'Best coverage nationwide',
    touristPlans: [
      { name: 'TRAVELLER SIM', data: '15GB/8 days', price: 299, calls: '100 mins' },
      { name: 'TRAVELLER SIM', data: '30GB/15 days', price: 599, calls: '200 mins' },
    ],
    monthlyPlans: [
      { name: 'Max Speed', data: '20GB', price: 399, calls: 'Unlimited' },
      { name: 'Max Speed', data: '50GB', price: 699, calls: 'Unlimited' },
    ],
    pros: ['Best 4G/5G coverage', 'Most stores & kiosks', 'AIS Super WiFi hotspots'],
    cons: ['Slightly more expensive', 'Busy stores'],
  },
  {
    name: 'DTAC',
    logo: '🔷',
    bestFor: 'Best value for tourists',
    touristPlans: [
      { name: 'Happy Tourist', data: '15GB/8 days', price: 269, calls: '100 mins' },
      { name: 'Happy Tourist', data: '30GB/15 days', price: 549, calls: '200 mins' },
    ],
    monthlyPlans: [
      { name: 'GO NO LIMIT', data: '20GB', price: 349, calls: 'Unlimited' },
      { name: 'GO NO LIMIT', data: 'Unlimited', price: 599, calls: 'Unlimited' },
    ],
    pros: ['Cheapest tourist SIMs', 'Good urban coverage', 'Easy top-up'],
    cons: ['Weaker in rural areas', 'Fewer 5G areas'],
  },
  {
    name: 'True Move',
    logo: '🔴',
    bestFor: 'Best for True ecosystem (7-Eleven)',
    touristPlans: [
      { name: 'Tourist SIM', data: '15GB/8 days', price: 299, calls: '100 mins' },
      { name: 'Tourist SIM', data: 'Unlimited/15 days', price: 599, calls: 'Unlimited' },
    ],
    monthlyPlans: [
      { name: 'True Unlimited', data: '20GB', price: 379, calls: 'Unlimited' },
      { name: 'True Unlimited', data: 'Unlimited', price: 649, calls: 'Unlimited' },
    ],
    pros: ['Easy buy at 7-Eleven', 'True WiFi hotspots', 'Good promos'],
    cons: ['Coverage varies', 'Can be confusing'],
  },
]

const bankingInfo = {
  requirements: [
    'Passport (original + copy)',
    'Thai phone number (required)',
    'Proof of address (hotel booking, rental contract)',
    'Work permit OR 90-day visa OR retirement visa',
    '฿500-1000 minimum deposit',
  ],
  recommendedBanks: [
    { name: 'Bangkok Bank', reason: 'Most foreigner-friendly, English service', fee: '฿200/year' },
    { name: 'Kasikorn Bank (KBank)', reason: 'Best mobile app, easy ATMs', fee: '฿200/year' },
    { name: 'SCB (Siam Commercial)', reason: 'Wide ATM network, good app', fee: '฿200/year' },
  ],
  tips: [
    'Tourist visas usually cannot open accounts - need longer visa',
    'Some branches are more foreigner-friendly than others',
    'Bring extra passport copies to save time',
    'Mobile banking apps work great once set up',
  ],
}

const exchangeInfo = {
  tips: [
    'Airport rates are worst - exchange minimum for taxi only',
    'SuperRich (orange or green) has best rates in Bangkok',
    'Avoid hotel exchange - terrible rates',
    'ATMs charge ฿220 foreign card fee - withdraw max amount',
    'Wise/Revolut cards have good rates, but ATM fee still applies',
  ],
  bestPlaces: [
    { name: 'SuperRich (Orange)', location: 'Multiple Bangkok locations', rating: 'Best rates' },
    { name: 'SuperRich (Green)', location: 'BTS Asok, Siam', rating: 'Excellent rates' },
    { name: 'Vasu Exchange', location: 'Nana area', rating: 'Good rates' },
    { name: 'K79 Exchange', location: 'Khao San Road', rating: 'Good for tourists' },
  ],
  atmTips: [
    'Aeon ATMs have NO foreign fee (rare but worth finding)',
    'Always choose "without conversion" when prompted',
    'Max withdrawal is usually ฿20,000-30,000',
    'Bangkok Bank ATMs are most reliable',
  ],
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-50 to-white">
    <!-- Header -->
    <div class="bg-white border-b border-gray-100">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
            <MobileOutlined class="text-xl text-purple-600" />
          </div>
          <div>
            <h1 class="text-2xl font-display font-bold text-gray-900">Thailand Setup Guide</h1>
            <p class="text-gray-500">SIM cards, banking & money exchange essentials</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <!-- Pro gate -->
      <div v-if="!isPro" class="card-thai text-center py-12">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-50 flex items-center justify-center">
          <LockOutlined class="text-2xl text-purple-600" />
        </div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">Pro Feature</h2>
        <p class="text-gray-500 mb-6 max-w-md mx-auto">
          Get detailed guides on getting set up in Thailand - SIM cards, banking, and the best places to exchange money.
        </p>
        <RouterLink to="/dashboard?upgrade=true" class="btn-thai">
          Upgrade to Pro
        </RouterLink>
      </div>

      <!-- Pro content -->
      <div v-else class="space-y-6">
        <!-- Section Tabs -->
        <div class="flex gap-2 overflow-x-auto pb-2">
          <button
            v-for="section in sections"
            :key="section.id"
            @click="activeSection = section.id as typeof activeSection"
            class="flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors"
            :class="activeSection === section.id
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
          >
            <span>{{ section.emoji }}</span>
            <span class="font-medium">{{ section.label }}</span>
          </button>
        </div>

        <!-- SIM Cards Section -->
        <div v-if="activeSection === 'sim'" class="space-y-6">
          <div v-for="provider in simProviders" :key="provider.name" class="card-thai">
            <div class="flex items-center gap-3 mb-4">
              <span class="text-3xl">{{ provider.logo }}</span>
              <div>
                <h3 class="font-semibold text-gray-900">{{ provider.name }}</h3>
                <p class="text-sm text-gray-500">{{ provider.bestFor }}</p>
              </div>
            </div>

            <div class="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <h4 class="text-sm font-medium text-gray-700 mb-2">Tourist SIMs</h4>
                <div class="space-y-2">
                  <div v-for="plan in provider.touristPlans" :key="plan.name + plan.data" class="p-3 bg-gray-50 rounded-lg">
                    <div class="flex justify-between">
                      <span class="text-sm font-medium">{{ plan.data }}</span>
                      <span class="text-sm font-bold text-primary-600">฿{{ plan.price }}</span>
                    </div>
                    <p class="text-xs text-gray-500">{{ plan.calls }} calls</p>
                  </div>
                </div>
              </div>
              <div>
                <h4 class="text-sm font-medium text-gray-700 mb-2">Monthly Plans</h4>
                <div class="space-y-2">
                  <div v-for="plan in provider.monthlyPlans" :key="plan.name + plan.data" class="p-3 bg-gray-50 rounded-lg">
                    <div class="flex justify-between">
                      <span class="text-sm font-medium">{{ plan.data }}</span>
                      <span class="text-sm font-bold text-primary-600">฿{{ plan.price }}/mo</span>
                    </div>
                    <p class="text-xs text-gray-500">{{ plan.calls }} calls</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 class="font-medium text-green-700 mb-1">Pros</h4>
                <ul class="space-y-1">
                  <li v-for="pro in provider.pros" :key="pro" class="flex items-start gap-2 text-gray-600">
                    <CheckCircleFilled class="text-green-500 mt-0.5 flex-shrink-0" />
                    {{ pro }}
                  </li>
                </ul>
              </div>
              <div>
                <h4 class="font-medium text-amber-700 mb-1">Cons</h4>
                <ul class="space-y-1">
                  <li v-for="con in provider.cons" :key="con" class="flex items-start gap-2 text-gray-600">
                    <span class="text-amber-500 mt-0.5 flex-shrink-0">•</span>
                    {{ con }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Banking Section -->
        <div v-if="activeSection === 'banking'" class="space-y-6">
          <div class="card-thai">
            <h3 class="font-semibold text-gray-900 mb-4">Requirements to Open a Bank Account</h3>
            <ul class="space-y-2">
              <li v-for="req in bankingInfo.requirements" :key="req" class="flex items-start gap-2">
                <CheckCircleFilled class="text-primary-500 mt-0.5" />
                <span class="text-gray-700">{{ req }}</span>
              </li>
            </ul>
          </div>

          <div class="card-thai">
            <h3 class="font-semibold text-gray-900 mb-4">Recommended Banks for Foreigners</h3>
            <div class="space-y-3">
              <div v-for="bank in bankingInfo.recommendedBanks" :key="bank.name" class="p-4 bg-gray-50 rounded-xl">
                <div class="flex justify-between items-start">
                  <div>
                    <h4 class="font-medium text-gray-900">{{ bank.name }}</h4>
                    <p class="text-sm text-gray-500">{{ bank.reason }}</p>
                  </div>
                  <span class="text-sm text-gray-400">{{ bank.fee }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card-thai bg-amber-50 border-amber-200">
            <h3 class="font-semibold text-amber-800 mb-3">Important Tips</h3>
            <ul class="space-y-2">
              <li v-for="tip in bankingInfo.tips" :key="tip" class="flex items-start gap-2 text-sm text-amber-700">
                <RightOutlined class="mt-1 flex-shrink-0" />
                {{ tip }}
              </li>
            </ul>
          </div>
        </div>

        <!-- Exchange Section -->
        <div v-if="activeSection === 'exchange'" class="space-y-6">
          <div class="card-thai">
            <h3 class="font-semibold text-gray-900 mb-4">Best Exchange Rates</h3>
            <div class="space-y-3">
              <div v-for="place in exchangeInfo.bestPlaces" :key="place.name" class="p-4 bg-gray-50 rounded-xl flex justify-between items-center">
                <div>
                  <h4 class="font-medium text-gray-900">{{ place.name }}</h4>
                  <p class="text-sm text-gray-500">{{ place.location }}</p>
                </div>
                <span class="text-sm font-medium text-green-600">{{ place.rating }}</span>
              </div>
            </div>
          </div>

          <div class="card-thai">
            <h3 class="font-semibold text-gray-900 mb-4">Money-Saving Tips</h3>
            <ul class="space-y-3">
              <li v-for="tip in exchangeInfo.tips" :key="tip" class="flex items-start gap-2">
                <span class="text-primary-500 font-bold">💡</span>
                <span class="text-gray-700">{{ tip }}</span>
              </li>
            </ul>
          </div>

          <div class="card-thai bg-blue-50 border-blue-200">
            <h3 class="font-semibold text-blue-800 mb-3">ATM Tips</h3>
            <ul class="space-y-2">
              <li v-for="tip in exchangeInfo.atmTips" :key="tip" class="flex items-start gap-2 text-sm text-blue-700">
                <CheckCircleFilled class="mt-0.5 flex-shrink-0" />
                {{ tip }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
