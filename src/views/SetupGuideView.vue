<script setup lang="ts">
import ToolIntro from '@/components/common/ToolIntro.vue'
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
import { useRouteSeo } from '@/composables/useSeo'

// Own title, description and canonical for this prerendered page
useRouteSeo('setupGuide')

const userStore = useUserStore()
const isPro = computed(() => userStore.isPro)

const activeSection = ref<'sim' | 'banking' | 'exchange'>('sim')

const sections = [
  { id: 'sim', label: 'SIM Cards', icon: MobileOutlined, emoji: '📱' },
  { id: 'banking', label: 'Banking', icon: BankOutlined, emoji: '🏦' },
  { id: 'exchange', label: 'Money Exchange', icon: SwapOutlined, emoji: '💱' },
]

// Checked 11 Nov 2026 on the operators' own pages (ais.th tourist plans; true.th tourist SIM).
// Only prices an official page shows are listed; monthly plans change too often: link instead.
const simProviders = [
  {
    name: 'AIS',
    logo: '🔵',
    bestFor: 'Best coverage nationwide',
    touristPlans: [
      { name: 'AIS Tourist SIM', data: 'Unlimited data, 8 days', price: 499, calls: '+100 THB bonus credit' },
      { name: 'AIS Tourist SIM', data: 'Unlimited data, 15 days', price: 699, calls: '+100 THB bonus credit' },
    ],
    plansUrl: 'https://www.ais.th/en/consumers/package/international/tourist-plan',
    monthlyNote: 'AIS also sells 1, 5, 30 and 60-day tourist SIMs and monthly plans; prices change, so compare on its own page.',
    pros: ['Best 4G/5G coverage', 'Most stores & kiosks', 'AIS Super WiFi hotspots'],
    cons: ['Slightly more expensive', 'Busy stores'],
  },
  {
    name: 'True & dtac',
    logo: '🔴',
    bestFor: 'One company since 2023 (True Corporation); same tourist SIM in True and dtac shops',
    touristPlans: [
      { name: 'Thailand Tourist INFINITE SIM', data: 'Unlimited data, 8 days', price: 449, calls: '15 and 30-day versions: price on true.th' },
    ],
    plansUrl: 'https://www.true.th/prepaid/sim/tourist',
    monthlyNote: 'True and dtac monthly plans change often; compare them on true.th and dtac.co.th.',
    pros: ['Easy buy at 7-Eleven', 'True and dtac WiFi hotspots', 'Good promos'],
    cons: ['Coverage varies', 'Two brand names for one network can be confusing'],
  },
]

const bankingInfo = {
  requirements: [
    'Passport (original + copy)',
    'A non-immigrant visa (work, retirement, education or marriage); some banks also ask for a work permit or a letter from your school',
    'Proof of address (hotel booking, rental contract)',
    'Usually about ฿500 to open the account',
    'A Thai phone number is usually needed for mobile banking',
  ],
  recommendedBanks: [
    // No yearly account fee; the yearly fee is on the debit card (KBank fee list, 20 May 2026: ฿0-350 by card)
    { name: 'Bangkok Bank', reason: 'Most foreigner-friendly, English service', fee: 'Debit card fee varies' },
    { name: 'Kasikorn Bank (KBank)', reason: 'Best mobile app, easy ATMs', fee: 'Card ฿0-350/year' },
    { name: 'SCB (Siam Commercial)', reason: 'Wide ATM network, good app', fee: 'Debit card fee varies' },
  ],
  tips: [
    'Tourist visas, visa-exempt entry and the DTV are usually refused (KBank says so) - you need a non-immigrant visa',
    'Rules differ by bank and branch: check the bank\'s own page before you go',
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
    'ATMs charge foreign cards about ฿250 per withdrawal (KBank: Visa ฿250, Mastercard ฿350), plus your own bank\'s fees - withdraw larger amounts',
    'Wise/Revolut cards have good rates, but ATM fee still applies',
  ],
  bestPlaces: [
    { name: 'SuperRich (Orange)', location: 'Multiple Bangkok locations', rating: 'Best rates' },
    { name: 'SuperRich (Green)', location: 'BTS Asok, Siam', rating: 'Excellent rates' },
    { name: 'Vasu Exchange', location: 'Nana area', rating: 'Good rates' },
    { name: 'K79 Exchange', location: 'Khao San Road', rating: 'Good for tourists' },
  ],
  atmTips: [
    'The screen shows the fee before you confirm - check it',
    'Always choose "without conversion" when prompted',
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
      <ToolIntro page="setupGuide" />

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
                    <p class="text-xs text-gray-500">{{ plan.calls }}</p>
                  </div>
                </div>
              </div>
              <div>
                <h4 class="text-sm font-medium text-gray-700 mb-2">Other plans</h4>
                <div class="p-3 bg-gray-50 rounded-lg">
                  <p class="text-sm text-gray-600 mb-1">{{ provider.monthlyNote }}</p>
                  <a :href="provider.plansUrl" target="_blank" rel="noopener noreferrer" class="text-sm font-medium text-primary-600 hover:underline">See current prices</a>
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
