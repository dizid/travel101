<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useUserStore } from '@stores/userStore'
import { useSubscription } from '@/composables/useSubscription'
import {
  UserOutlined,
  CrownOutlined,
  HistoryOutlined,
  SettingOutlined,
  CheckCircleFilled,
  RightOutlined,
  LoadingOutlined,
} from '@ant-design/icons-vue'
import WeatherWidget from '@components/features/WeatherWidget.vue'
import CurrencyCalculator from '@components/features/CurrencyCalculator.vue'

const userStore = useUserStore()
const route = useRoute()
const { loading: subLoading, subscriptionStatus, nextBillingDate, startCheckout, openPortal, fetchStatus } = useSubscription()

onMounted(async () => {
  if (userStore.isAuthenticated) {
    await fetchStatus()
  }
  if (route.query.upgrade === 'success') {
    userStore.setPro(true)
  }
})

const quickLinks = [
  { icon: '🛂', label: 'Visa Guide', path: '/visa', description: 'Check requirements' },
  { icon: '📝', label: 'TDAC Form', path: '/tdac', description: 'Arrival card guide' },
  { icon: '💡', label: 'Good to Know', path: '/warnings', description: 'Thai customs' },
  { icon: '🗺️', label: 'Places', path: '/attractions', description: 'Explore Thailand' },
]

const proFeatures = [
  { icon: '🎯', label: 'AI-Powered Itineraries', description: 'Get personalized trip plans', path: '/itinerary' },
  { icon: '💎', label: 'Smart Matching', description: 'Find places that match your style', path: '/smart-match' },
  { icon: '🔔', label: 'Oversight Alerts', description: 'Visa reminders & travel tips', path: '/alerts' },
  { icon: '💬', label: 'Expert Q&A', description: 'Ask anything about Thailand', path: '/attractions' },
]

const profileCompleteness = computed(() => {
  const prefs = userStore.profile.prefs
  let score = 0
  if (prefs.nationality) score += 25
  if (prefs.travelStyle.length > 0) score += 25
  if (prefs.interests.length > 0) score += 25
  if (prefs.tripType) score += 25
  return score
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-50 to-white">
    <!-- Header -->
    <div class="bg-white border-b border-gray-100">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white shadow-thai">
              <UserOutlined class="text-2xl" />
            </div>
            <div>
              <h1 class="text-2xl font-display font-bold text-gray-900">
                Sawasdee, {{ userStore.displayName }}!
              </h1>
              <div class="flex items-center gap-2 mt-1">
                <span
                  v-if="userStore.isPro"
                  class="badge-pro"
                >
                  <CrownOutlined class="text-xs" />
                  Pro Member
                </span>
                <span v-else class="text-sm text-gray-500">
                  Free Plan
                </span>
              </div>
            </div>
          </div>

          <RouterLink
            to="/profile"
            class="btn-thai-ghost"
          >
            <SettingOutlined />
            Settings
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div class="grid lg:grid-cols-3 gap-8">
        <!-- Main content -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Profile completeness -->
          <div v-if="profileCompleteness < 100" class="card-thai">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-semibold text-gray-900">Complete Your Profile</h2>
              <span class="text-sm font-medium text-primary-600">{{ profileCompleteness }}%</span>
            </div>
            <div class="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
              <div
                class="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all"
                :style="{ width: `${profileCompleteness}%` }"
              />
            </div>
            <p class="text-sm text-gray-600 mb-4">
              Complete your profile to get personalized recommendations.
            </p>
            <RouterLink to="/profile" class="btn-thai text-sm">
              Complete Profile
              <RightOutlined class="text-xs" />
            </RouterLink>
          </div>

          <!-- Quick links -->
          <div>
            <h2 class="font-semibold text-gray-900 mb-4">Quick Access</h2>
            <div class="grid sm:grid-cols-2 gap-4">
              <RouterLink
                v-for="link in quickLinks"
                :key="link.path"
                :to="link.path"
                class="card-thai flex items-center gap-4 group"
              >
                <span class="text-2xl">{{ link.icon }}</span>
                <div>
                  <h3 class="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                    {{ link.label }}
                  </h3>
                  <p class="text-sm text-gray-500">{{ link.description }}</p>
                </div>
              </RouterLink>
            </div>
          </div>

          <!-- Activity history -->
          <div>
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-semibold text-gray-900 flex items-center gap-2">
                <HistoryOutlined class="text-gray-400" />
                Recent Activity
              </h2>
            </div>
            <div v-if="userStore.activities.length === 0" class="card-thai text-center py-8">
              <span class="text-4xl mb-3 block">📋</span>
              <p class="text-gray-500">No activity yet. Start exploring!</p>
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="activity in userStore.activities.slice(0, 5)"
                :key="activity.id"
                class="card-thai py-3 flex items-center gap-3"
              >
                <CheckCircleFilled class="text-green-500" />
                <div>
                  <p class="text-sm text-gray-900">{{ activity.action.replace(/_/g, ' ') }}</p>
                  <p class="text-xs text-gray-400">{{ new Date(activity.createdAt).toLocaleDateString() }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Pro upgrade card -->
          <div
            v-if="!userStore.isPro"
            id="pro"
            class="card-thai bg-gradient-to-br from-primary-500 to-primary-700 text-white p-6"
          >
            <div class="flex items-center gap-2 mb-3">
              <CrownOutlined class="text-xl" />
              <h3 class="font-semibold">Plan Your Perfect Trip</h3>
            </div>
            <p class="text-primary-100 text-sm mb-4">
              AI creates personalized itineraries, finds hidden gems that match your style, and keeps you visa-compliant.
            </p>

            <ul class="space-y-3 mb-6">
              <li
                v-for="feature in proFeatures"
                :key="feature.label"
                class="flex items-start gap-3"
              >
                <span class="text-lg">{{ feature.icon }}</span>
                <div>
                  <p class="font-medium text-sm">{{ feature.label }}</p>
                  <p class="text-xs text-primary-200">{{ feature.description }}</p>
                </div>
              </li>
            </ul>

            <div class="text-center">
              <p class="text-xs text-primary-200 mb-1">7-day free trial</p>
              <p class="text-2xl font-bold mb-2">$10<span class="text-sm font-normal">/month after trial</span></p>
              <button
                @click="startCheckout"
                :disabled="subLoading"
                class="w-full py-3 bg-white text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <LoadingOutlined v-if="subLoading" class="animate-spin" />
                {{ subLoading ? 'Loading...' : 'Start Free Trial' }}
              </button>
              <p class="text-xs text-primary-200 mt-2">No charge for 7 days · Cancel anytime</p>
            </div>
          </div>

          <!-- Pro member card -->
          <div
            v-else
            class="card-thai bg-gradient-to-br from-primary-50 to-accent-50 border-primary-200"
          >
            <div class="flex items-center gap-2 mb-3">
              <CrownOutlined class="text-primary-600" />
              <h3 class="font-semibold text-gray-900">Pro Member</h3>
            </div>

            <!-- Pro Feature Quick Access -->
            <div class="space-y-2 mb-4">
              <RouterLink
                v-for="feature in proFeatures"
                :key="feature.label"
                :to="feature.path"
                class="flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors group"
              >
                <span class="text-lg">{{ feature.icon }}</span>
                <span class="text-sm font-medium text-gray-700 group-hover:text-primary-600">{{ feature.label }}</span>
                <RightOutlined class="text-xs text-gray-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </RouterLink>
            </div>

            <div class="pt-4 border-t border-primary-200 space-y-2 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-gray-500">Status</span>
                <span class="font-medium text-green-600">
                  {{ subscriptionStatus?.subscription?.status || 'Active' }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-500">Next billing</span>
                <span class="font-medium">{{ nextBillingDate || 'N/A' }}</span>
              </div>
            </div>
            <button
              @click="openPortal"
              :disabled="subLoading"
              class="w-full mt-4 btn-thai-outline text-sm flex items-center justify-center gap-2"
            >
              <LoadingOutlined v-if="subLoading" class="animate-spin" />
              Manage Subscription
            </button>
          </div>

          <!-- Saved country -->
          <div class="card-thai">
            <h3 class="font-semibold text-gray-900 mb-3">Your Destination</h3>
            <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <span class="text-3xl">🇹🇭</span>
              <div>
                <p class="font-medium text-gray-900">Thailand</p>
                <p class="text-sm text-gray-500">Land of Smiles</p>
              </div>
            </div>
          </div>

          <!-- Weather Widget -->
          <WeatherWidget location="Bangkok" />

          <!-- Currency Calculator -->
          <CurrencyCalculator />
        </div>
      </div>
    </div>
  </div>
</template>
