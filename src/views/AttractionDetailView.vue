<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useCountryStore } from '@stores/countryStore'
import { useUserStore } from '@stores/userStore'
import { useAI } from '@/composables/useAI'
import AttractionChat from '@/components/features/AttractionChat.vue'
import {
  EnvironmentOutlined,
  StarFilled,
  LeftOutlined,
  HeartOutlined,
  ShareAltOutlined,
  ClockCircleOutlined,
  CarOutlined,
  DollarOutlined,
  TeamOutlined,
  CameraOutlined,
  CheckCircleOutlined,
  LockOutlined,
  LoadingOutlined,
  CompassOutlined,
  CoffeeOutlined,
  HomeOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  ShoppingOutlined,
  MessageOutlined,
  BulbOutlined,
} from '@ant-design/icons-vue'
import type { TipType, SecretType, RecommendationType } from '@/types'
import { generateAffiliateUrl, trackAffiliateClick, generateHeritageHotelUrl, generateTransportUrl } from '@/utils/affiliates'

const route = useRoute()
const countryStore = useCountryStore()
const userStore = useUserStore()
const { getPersonalizedIntro } = useAI()

const activeTab = ref<'tips' | 'secrets' | 'recommendations'>('tips')
const matchInfo = ref<{ score: number; reasons: string[] } | null>(null)

// AI personalization state
const personalizedIntro = ref<string | null>(null)
const loadingIntro = ref(false)
const isChatOpen = ref(false)

// Fetch attraction details and AI intro on mount
onMounted(async () => {
  const slug = route.params.id as string
  const result = await countryStore.fetchAttractionBySlug(slug)
  if (result?.matchInfo) {
    matchInfo.value = result.matchInfo
  }
  // Fetch personalized intro if user has profile
  if (userStore.hasProfile) {
    fetchPersonalizedIntro(slug)
  }
})

// Re-fetch when route changes
watch(() => route.params.id, async (newSlug) => {
  if (newSlug) {
    activeTab.value = 'tips'
    personalizedIntro.value = null
    isChatOpen.value = false
    const result = await countryStore.fetchAttractionBySlug(newSlug as string)
    if (result?.matchInfo) {
      matchInfo.value = result.matchInfo
    }
    // Fetch personalized intro if user has profile
    if (userStore.hasProfile) {
      fetchPersonalizedIntro(newSlug as string)
    }
  }
})

// Fetch personalized intro from AI
async function fetchPersonalizedIntro(slug: string) {
  loadingIntro.value = true
  try {
    personalizedIntro.value = await getPersonalizedIntro(slug)
  } catch (error) {
    console.error('Failed to get personalized intro:', error)
  } finally {
    loadingIntro.value = false
  }
}

function openChat() {
  isChatOpen.value = true
}

function closeChat() {
  isChatOpen.value = false
}

const attraction = computed(() => countryStore.currentAttraction)
const isLoading = computed(() => countryStore.attractionsLoading)
const isPro = computed(() => userStore.profile.isPro)

// Check if attraction has rich content
const hasRichContent = computed(() => {
  if (!attraction.value) return false
  return (
    (attraction.value.tips?.length || 0) > 0 ||
    (attraction.value.secrets?.length || 0) > 0 ||
    (attraction.value.recommendations?.length || 0) > 0
  )
})

// Group tips by type
const tipsByType = computed(() => {
  if (!attraction.value?.tips) return {}
  return attraction.value.tips.reduce((acc, tip) => {
    if (!acc[tip.tipType]) acc[tip.tipType] = []
    acc[tip.tipType].push(tip)
    return acc
  }, {} as Record<string, typeof attraction.value.tips>)
})

// Tip type configuration
const tipTypeConfig: Record<TipType, { icon: typeof ClockCircleOutlined; label: string }> = {
  timing: { icon: ClockCircleOutlined, label: 'Best Time to Visit' },
  transport: { icon: CarOutlined, label: 'Getting Around' },
  money_saving: { icon: DollarOutlined, label: 'Money Saving Tips' },
  crowd_avoidance: { icon: TeamOutlined, label: 'Avoiding Crowds' },
  photography: { icon: CameraOutlined, label: 'Photography Tips' },
  preparation: { icon: CheckCircleOutlined, label: 'Before You Go' },
}

// Secret type configuration
const secretTypeConfig: Record<SecretType, { label: string }> = {
  hidden_spot: { label: 'Hidden Spot' },
  local_food: { label: 'Local Food Secret' },
  local_experience: { label: 'Local Experience' },
  insider_knowledge: { label: 'Insider Knowledge' },
}

// Recommendation type configuration
const recTypeConfig: Record<RecommendationType, { icon: typeof CoffeeOutlined; label: string }> = {
  restaurant: { icon: CoffeeOutlined, label: 'Restaurant' },
  cafe: { icon: CoffeeOutlined, label: 'Cafe' },
  hotel: { icon: HomeOutlined, label: 'Hotel' },
  activity: { icon: ThunderboltOutlined, label: 'Activity' },
  viewpoint: { icon: EyeOutlined, label: 'Viewpoint' },
  shop: { icon: ShoppingOutlined, label: 'Shop' },
}

const categoryLabels: Record<string, { icon: string; label: string }> = {
  beach: { icon: '🏖️', label: 'Beach' },
  culture: { icon: '🏛️', label: 'Culture' },
  nightlife: { icon: '🌙', label: 'Nightlife' },
  nature: { icon: '🌿', label: 'Nature' },
  island: { icon: '🏝️', label: 'Island' },
  foodie: { icon: '🍜', label: 'Foodie' },
  food: { icon: '🍜', label: 'Food' },
  nomad: { icon: '💻', label: 'Nomad Hub' },
  wellness: { icon: '🧘', label: 'Wellness' },
  adventure: { icon: '⛰️', label: 'Adventure' },
  family: { icon: '👨‍👩‍👧', label: 'Family' },
  romantic: { icon: '💕', label: 'Romantic' },
  budget: { icon: '💰', label: 'Budget' },
  luxury: { icon: '✨', label: 'Luxury' },
  history: { icon: '📜', label: 'History' },
  temples: { icon: '🛕', label: 'Temples' },
  shopping: { icon: '🛍️', label: 'Shopping' },
  relaxation: { icon: '😌', label: 'Relaxation' },
  party: { icon: '🎉', label: 'Party' },
  authentic: { icon: '🎭', label: 'Authentic' },
}

// Map Google Places types to friendly labels
const googleTypeLabels: Record<string, string> = {
  tourist_attraction: 'Tourist Attraction',
  museum: 'Museum',
  park: 'Nature',
  zoo: 'Zoo',
  aquarium: 'Aquarium',
  amusement_park: 'Amusement Park',
  art_gallery: 'Art Gallery',
  hindu_temple: 'Temple',
  buddhist_temple: 'Temple',
  temple: 'Temple',
  historical_landmark: 'Historical',
  national_park: 'National Park',
  beach: 'Beach',
  waterfall: 'Nature',
  restaurant: 'Restaurant',
  cafe: 'Cafe',
  bar: 'Bar',
  spa: 'Wellness',
  diving_center: 'Diving',
  golf_course: 'Golf',
  gym: 'Fitness',
  yoga_studio: 'Yoga',
}

// Get displayable categories for "Best for" section
const displayCategories = computed(() => {
  if (!attraction.value) return []

  const categories: string[] = []

  // First, try to get from categories object (proper JSONB with named keys)
  if (attraction.value.categories && typeof attraction.value.categories === 'object') {
    const cats = attraction.value.categories as Record<string, number>
    for (const [key, score] of Object.entries(cats)) {
      // Only include if key is a named category (not numeric) and score > 0.5
      if (typeof key === 'string' && !/^\d+$/.test(key) && score > 0.5) {
        categories.push(key)
      }
    }
  }

  // If no valid categories found, try metadata.googleTypes
  if (categories.length === 0 && attraction.value.metadata) {
    const metadata = attraction.value.metadata as Record<string, unknown>
    const googleTypes = metadata.googleTypes as string[] | undefined
    if (googleTypes && Array.isArray(googleTypes)) {
      for (const type of googleTypes.slice(0, 5)) {
        const label = googleTypeLabels[type]
        if (label && !categories.includes(label)) {
          categories.push(label)
        }
      }
    }
  }

  // Always include main category if not already present
  if (attraction.value.category && !categories.includes(attraction.value.category)) {
    categories.unshift(attraction.value.category)
  }

  // Limit to 6 categories
  return categories.slice(0, 6)
})

// Affiliate links
const klookUrl = computed(() => {
  if (!attraction.value) return '#'
  return generateAffiliateUrl('klook', attraction.value.province || 'Thailand', attraction.value.name)
})

const agodaUrl = computed(() => {
  if (!attraction.value) return '#'
  return generateAffiliateUrl('agoda', attraction.value.province || 'Thailand')
})

const heritageHotelUrl = computed(() => {
  if (!attraction.value) return '#'
  return generateHeritageHotelUrl(attraction.value.name, attraction.value.province || 'Thailand')
})

const transportUrl = computed(() => {
  if (!attraction.value) return '#'
  return generateTransportUrl('Bangkok', attraction.value.province || 'Thailand')
})

function handleAffiliateClick(partner: 'klook' | 'agoda' | '12go', url: string) {
  trackAffiliateClick(partner, attraction.value?.province || 'Thailand', attraction.value?.slug)
  window.open(url, '_blank', 'noopener,noreferrer')
}

const gradientClass = computed(() => {
  if (!attraction.value) return 'from-gray-400 to-gray-500'
  const gradients: Record<string, string> = {
    beach: 'from-blue-400 to-cyan-500',
    culture: 'from-purple-400 to-indigo-500',
    nightlife: 'from-pink-400 to-rose-500',
    nature: 'from-green-400 to-emerald-500',
    island: 'from-teal-400 to-cyan-500',
    foodie: 'from-orange-400 to-amber-500',
    nomad: 'from-indigo-400 to-blue-500',
    wellness: 'from-emerald-400 to-teal-500',
    adventure: 'from-amber-400 to-orange-500',
    family: 'from-cyan-400 to-blue-500',
    romantic: 'from-rose-400 to-pink-500',
    budget: 'from-lime-400 to-green-500',
    luxury: 'from-yellow-400 to-amber-500',
  }
  return gradients[attraction.value.category] || 'from-gray-400 to-gray-500'
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Back button -->
    <div class="bg-white border-b border-gray-100">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-4">
        <RouterLink
          to="/attractions"
          class="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <LeftOutlined class="text-xs" />
          Back to Places
        </RouterLink>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading && !attraction" class="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
      <LoadingOutlined class="text-4xl text-primary-500 mb-4" />
      <p class="text-gray-500">Loading attraction details...</p>
    </div>

    <div v-else-if="attraction" class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <!-- Hero image -->
      <div class="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-8">
        <div
          class="absolute inset-0 bg-gradient-to-br"
          :class="gradientClass"
        />
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-8xl opacity-30">
            {{ categoryLabels[attraction.category]?.icon || '🗺️' }}
          </span>
        </div>

        <!-- Badges -->
        <div class="absolute top-4 left-4 flex gap-2">
          <span
            v-if="attraction.isHiddenGem"
            class="inline-flex items-center gap-1 px-3 py-1.5 bg-white/90 backdrop-blur rounded-full text-sm font-medium text-primary-600"
          >
            <StarFilled class="text-primary-500" />
            Hidden Gem
          </span>
          <span class="inline-flex items-center gap-1 px-3 py-1.5 bg-white/90 backdrop-blur rounded-full text-sm font-medium text-gray-700">
            {{ categoryLabels[attraction.category]?.icon }}
            {{ categoryLabels[attraction.category]?.label }}
          </span>
        </div>

        <!-- Match score badge -->
        <div v-if="matchInfo" class="absolute bottom-4 left-4">
          <span
            class="inline-flex items-center gap-1 px-3 py-1.5 bg-white/90 backdrop-blur rounded-full text-sm font-semibold"
            :class="{
              'text-green-600': matchInfo.score >= 80,
              'text-amber-600': matchInfo.score >= 50 && matchInfo.score < 80,
              'text-gray-600': matchInfo.score < 50,
            }"
          >
            {{ matchInfo.score }}% match for you
          </span>
        </div>

        <!-- Actions -->
        <div class="absolute top-4 right-4 flex gap-2">
          <button class="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-colors">
            <HeartOutlined class="text-gray-600" />
          </button>
          <button class="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-colors">
            <ShareAltOutlined class="text-gray-600" />
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="grid md:grid-cols-3 gap-8">
        <div class="md:col-span-2">
          <h1 class="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-3">
            {{ attraction.name }}
          </h1>

          <div class="flex items-center gap-2 text-gray-500 mb-4">
            <EnvironmentOutlined />
            <span>{{ attraction.province }}, Thailand</span>
          </div>

          <!-- Match reasons -->
          <div v-if="matchInfo?.reasons?.length" class="flex flex-wrap gap-2 mb-4">
            <span
              v-for="reason in matchInfo.reasons"
              :key="reason"
              class="text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded-full"
            >
              {{ reason }}
            </span>
          </div>

          <!-- AI Personalized Intro -->
          <div
            v-if="userStore.hasProfile && (personalizedIntro || loadingIntro)"
            class="mb-6 p-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl"
          >
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                <BulbOutlined class="text-primary-600" />
              </div>
              <div class="flex-1">
                <h4 class="text-sm font-medium text-gray-900 mb-1">Why this is perfect for you</h4>
                <div v-if="loadingIntro" class="flex items-center gap-2 text-sm text-gray-500">
                  <LoadingOutlined class="animate-spin" />
                  <span>Generating personalized insight...</span>
                </div>
                <p v-else-if="personalizedIntro" class="text-sm text-gray-700">
                  {{ personalizedIntro }}
                </p>
              </div>
            </div>
          </div>

          <div class="prose prose-gray max-w-none mb-8">
            <p class="text-lg text-gray-600 leading-relaxed">
              {{ attraction.description }}
            </p>

            <div v-if="attraction.about" class="mt-6">
              <h2 class="text-xl font-semibold text-gray-900 mb-4">About this place</h2>
              <p class="text-gray-600">{{ attraction.about }}</p>
            </div>

            <h2 v-if="displayCategories.length > 0" class="text-xl font-semibold text-gray-900 mt-8 mb-4">Best for</h2>
            <div v-if="displayCategories.length > 0" class="flex flex-wrap gap-2">
              <span
                v-for="cat in displayCategories"
                :key="cat"
                class="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm capitalize"
              >
                {{ categoryLabels[cat]?.icon || '' }} {{ categoryLabels[cat]?.label || cat.replace(/_/g, ' ') }}
              </span>
            </div>
          </div>

          <!-- Rich Content Tabs -->
          <div v-if="hasRichContent" class="mt-8">
            <!-- Tab navigation -->
            <div class="border-b border-gray-200">
              <nav class="flex gap-6">
                <button
                  @click="activeTab = 'tips'"
                  :class="activeTab === 'tips' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
                  class="py-3 border-b-2 font-medium text-sm transition-colors"
                >
                  Insider Tips
                  <span v-if="attraction.tips?.length" class="ml-1 text-xs text-gray-400">
                    ({{ attraction.tips.length }})
                  </span>
                </button>
                <button
                  @click="activeTab = 'secrets'"
                  :class="activeTab === 'secrets' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
                  class="py-3 border-b-2 font-medium text-sm transition-colors flex items-center gap-1"
                >
                  Local Secrets
                  <LockOutlined v-if="!isPro" class="text-xs text-gray-400" />
                  <span v-if="attraction.secrets?.length" class="ml-1 text-xs text-gray-400">
                    ({{ attraction.secrets.length }})
                  </span>
                </button>
                <button
                  @click="activeTab = 'recommendations'"
                  :class="activeTab === 'recommendations' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
                  class="py-3 border-b-2 font-medium text-sm transition-colors"
                >
                  Recommendations
                  <span v-if="attraction.recommendations?.length" class="ml-1 text-xs text-gray-400">
                    ({{ attraction.recommendations.length }})
                  </span>
                </button>
              </nav>
            </div>

            <!-- Tips Tab -->
            <div v-if="activeTab === 'tips'" class="py-6">
              <div v-if="Object.keys(tipsByType).length === 0" class="text-center py-8 text-gray-500">
                No insider tips available yet for this place.
              </div>
              <div v-else class="space-y-8">
                <div v-for="(tips, tipType) in tipsByType" :key="tipType">
                  <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <component
                      :is="tipTypeConfig[tipType as TipType]?.icon || CheckCircleOutlined"
                      class="text-primary-500"
                    />
                    {{ tipTypeConfig[tipType as TipType]?.label || tipType }}
                  </h3>
                  <div class="space-y-3">
                    <div
                      v-for="tip in tips"
                      :key="tip.id"
                      class="p-4 bg-white rounded-xl border border-gray-100"
                      :class="{ 'opacity-60': tip.isProOnly && !isPro }"
                    >
                      <div class="flex items-start justify-between gap-4">
                        <div class="flex-1">
                          <h4 class="font-medium text-gray-900">{{ tip.title }}</h4>
                          <p v-if="!tip.isProOnly || isPro" class="text-gray-600 mt-1 text-sm">
                            {{ tip.content }}
                          </p>
                          <p v-else class="text-gray-400 mt-1 text-sm italic">
                            Upgrade to Pro to unlock this tip
                          </p>
                        </div>
                        <LockOutlined v-if="tip.isProOnly && !isPro" class="text-gray-400 flex-shrink-0" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Secrets Tab -->
            <div v-if="activeTab === 'secrets'" class="py-6">
              <div v-if="!isPro" class="text-center py-12">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <LockOutlined class="text-2xl text-gray-400" />
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Pro Feature</h3>
                <p class="text-gray-600 mb-6 max-w-md mx-auto">
                  Unlock local secrets and hidden spots that most tourists never discover.
                  These are the places locals actually go!
                </p>
                <RouterLink to="/upgrade" class="btn-thai">
                  Upgrade to Pro
                </RouterLink>
              </div>
              <div v-else-if="!attraction.secrets?.length" class="text-center py-8 text-gray-500">
                No local secrets available yet for this place.
              </div>
              <div v-else class="space-y-4">
                <div
                  v-for="secret in attraction.secrets"
                  :key="secret.id"
                  class="p-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl"
                >
                  <span class="text-xs font-medium text-primary-600 uppercase tracking-wide">
                    {{ secretTypeConfig[secret.secretType]?.label || secret.secretType }}
                  </span>
                  <h4 class="font-semibold text-gray-900 mt-1">{{ secret.title }}</h4>
                  <p class="text-gray-600 mt-2 text-sm">{{ secret.content }}</p>
                  <p v-if="secret.locationHint" class="text-sm text-gray-500 mt-2 flex items-center gap-1">
                    <CompassOutlined class="text-xs" />
                    {{ secret.locationHint }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Recommendations Tab -->
            <div v-if="activeTab === 'recommendations'" class="py-6">
              <div v-if="!attraction.recommendations?.length" class="text-center py-8 text-gray-500">
                No specific recommendations available yet for this place.
              </div>
              <div v-else class="grid gap-4">
                <div
                  v-for="rec in attraction.recommendations"
                  :key="rec.id"
                  class="p-4 bg-white rounded-xl border border-gray-100"
                  :class="{ 'opacity-60': rec.isProOnly && !isPro }"
                >
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-xs font-medium text-accent-600 uppercase tracking-wide">
                          {{ recTypeConfig[rec.recType]?.label || rec.recType }}
                        </span>
                        <span v-if="rec.priceRange" class="text-xs text-gray-500">
                          {{ rec.priceRange }}
                        </span>
                      </div>
                      <h4 class="font-semibold text-gray-900">{{ rec.name }}</h4>
                      <p v-if="!rec.isProOnly || isPro" class="text-gray-600 mt-1 text-sm">
                        {{ rec.description }}
                      </p>
                      <p
                        v-if="rec.whySpecial && (!rec.isProOnly || isPro)"
                        class="text-sm text-primary-600 mt-2"
                      >
                        {{ rec.whySpecial }}
                      </p>
                      <div v-if="rec.googleMapsUrl && (!rec.isProOnly || isPro)" class="mt-3">
                        <a
                          :href="rec.googleMapsUrl"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="text-sm text-primary-600 hover:underline inline-flex items-center gap-1"
                        >
                          <EnvironmentOutlined class="text-xs" />
                          View on Google Maps
                        </a>
                      </div>
                    </div>
                    <LockOutlined v-if="rec.isProOnly && !isPro" class="text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Heritage Hotel booking card (for heritage places) -->
          <div v-if="attraction.placeType === 'heritage'" class="card-thai border-2 border-amber-200 bg-amber-50">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-xl">🏛️</span>
              <h3 class="font-semibold text-gray-900">Book This Heritage Stay</h3>
            </div>
            <p class="text-sm text-gray-600 mb-4">
              Experience history at {{ attraction.name }}.
            </p>
            <button
              @click="handleAffiliateClick('agoda', heritageHotelUrl)"
              class="w-full justify-center bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
            >
              Check Availability on Agoda
            </button>
            <p class="text-xs text-gray-500 mt-2 text-center">Best rates guaranteed</p>
          </div>

          <!-- Book activities card (for non-heritage places) -->
          <div v-if="attraction.placeType !== 'heritage'" class="card-thai">
            <h3 class="font-semibold text-gray-900 mb-4">Book Activities</h3>
            <p class="text-sm text-gray-600 mb-4">
              Find tours and experiences in {{ attraction.name }}.
            </p>
            <button
              @click="handleAffiliateClick('klook', klookUrl)"
              class="btn-thai w-full justify-center"
            >
              View on Klook
            </button>
            <p class="text-xs text-gray-400 mt-2 text-center">Affiliate link</p>
          </div>

          <!-- Book hotels card -->
          <div class="card-thai">
            <h3 class="font-semibold text-gray-900 mb-4">{{ attraction.placeType === 'heritage' ? 'More Hotels Nearby' : 'Find Hotels' }}</h3>
            <p class="text-sm text-gray-600 mb-4">
              {{ attraction.placeType === 'heritage' ? 'Other places to stay in' : 'Best places to stay in' }} {{ attraction.province }}.
            </p>
            <button
              @click="handleAffiliateClick('agoda', agodaUrl)"
              class="btn-accent w-full justify-center"
            >
              View on Agoda
            </button>
            <p class="text-xs text-gray-400 mt-2 text-center">Affiliate link</p>
          </div>

          <!-- Transport card (for all places) -->
          <div class="card-thai">
            <h3 class="font-semibold text-gray-900 mb-4">Get There</h3>
            <p class="text-sm text-gray-600 mb-4">
              Buses, trains & ferries to {{ attraction.province }}.
            </p>
            <button
              @click="handleAffiliateClick('12go', transportUrl)"
              class="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
            >
              Book on 12Go Asia
            </button>
            <p class="text-xs text-gray-400 mt-2 text-center">Affiliate link</p>
          </div>

          <!-- Location card -->
          <div class="card-thai">
            <h3 class="font-semibold text-gray-900 mb-2">Location</h3>
            <div class="flex items-start gap-2">
              <EnvironmentOutlined class="text-gray-400 mt-1" />
              <div>
                <p class="text-gray-900">{{ attraction.location }}</p>
                <p class="text-sm text-gray-500">{{ attraction.province }} Province</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Not found -->
    <div v-else class="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
      <span class="text-6xl mb-4 block">🔍</span>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Place not found</h1>
      <p class="text-gray-500 mb-6">We couldn't find this attraction.</p>
      <RouterLink to="/attractions" class="btn-thai">
        Browse All Places
      </RouterLink>
    </div>

    <!-- Floating Ask AI Button -->
    <button
      v-if="attraction"
      @click="openChat"
      class="fixed bottom-6 right-6 z-30 flex items-center gap-2 px-5 py-3 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 hover:shadow-xl transition-all group"
    >
      <MessageOutlined class="text-lg" />
      <span class="font-medium">Ask AI</span>
    </button>

    <!-- Chat Component -->
    <AttractionChat
      v-if="attraction"
      :is-open="isChatOpen"
      :attraction-slug="attraction.slug || (route.params.id as string)"
      :attraction-name="attraction.name"
      @close="closeChat"
    />
  </div>
</template>
