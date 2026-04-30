<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useCountryStore } from '@stores/countryStore'
import { useUserStore } from '@stores/userStore'
import { useSubscription } from '@composables/useSubscription'
import AttractionCard from '@components/features/AttractionCard.vue'
import AffiliateButton from '@components/common/AffiliateButton.vue'
import UpcomingFestivalBanner from '@components/features/UpcomingFestivalBanner.vue'
import ProBadge from '@components/ui/ProBadge.vue'
import WelcomeWizard from '@components/features/WelcomeWizard.vue'
import {
  RightOutlined,
  SafetyOutlined,
  CompassOutlined,
  FileTextOutlined,
  StarOutlined,
} from '@ant-design/icons-vue'

const countryStore = useCountryStore()
const userStore = useUserStore()
const { startCheckout, loading: checkoutLoading } = useSubscription()

// First-visit onboarding — SSG-safe (only reads localStorage in onMounted)
const showWizard = ref(false)
function openWizard() {
  showWizard.value = true
}
onMounted(() => {
  if (typeof window === 'undefined') return
  const done = localStorage.getItem('welcome-wizard-completed')
  if (!done && !userStore.hasProfile) showWizard.value = true
})

// Tailwind 3 needs literal class names — inline them per card.
type Capability = {
  icon: string
  title: string
  blurb: string
  route: string
  iconBg: string
  iconText: string
  pro?: boolean
}

const capabilities: Capability[] = [
  {
    icon: '🗺️',
    title: 'Discover Places',
    blurb: '400+ destinations — beaches, temples, islands, hidden gems',
    route: '/attractions',
    iconBg: 'bg-teal-50',
    iconText: 'text-teal-600',
  },
  {
    icon: '🎉',
    title: 'Festivals & Heritage',
    blurb: '50+ festivals and 8 UNESCO heritage sites',
    route: '/festivals',
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-600',
  },
  {
    icon: '🛂',
    title: 'Visa & Entry',
    blurb: 'Wizard, TDAC, 90-Day, Onward Ticket',
    route: '/visa',
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-600',
  },
  {
    icon: '🎯',
    title: 'AI Itinerary Planner',
    blurb: 'Multi-day plans with budget, ICS & PDF export',
    route: '/itinerary',
    iconBg: 'bg-orange-50',
    iconText: 'text-orange-600',
    pro: true,
  },
  {
    icon: '⭐',
    title: 'Smart Match',
    blurb: 'AI matches places to your travel style',
    route: '/smart-match',
    iconBg: 'bg-violet-50',
    iconText: 'text-violet-600',
  },
  {
    icon: '🎒',
    title: 'Packing & Phrases',
    blurb: 'AI packing lists + 211 essential Thai phrases',
    route: '/packing',
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-600',
    pro: true,
  },
  {
    icon: '💰',
    title: 'Cost & Safety',
    blurb: 'Budget calculator for 6 cities + province safety',
    route: '/cost-calculator',
    iconBg: 'bg-rose-50',
    iconText: 'text-rose-600',
  },
  {
    icon: '🏥',
    title: 'Medical & Emergency',
    blurb: '17 vetted hospitals + emergency contacts',
    route: '/medical',
    iconBg: 'bg-slate-50',
    iconText: 'text-slate-600',
  },
]

const freeFeatures = [
  '400+ Places, 50+ Festivals, 8 UNESCO sites, 46 Guides',
  'Visa Wizard, TDAC, 90-Day, Visa Countdown',
  'Smart Match — view your matches',
  'AI Chat & tools — 1 use/day per feature',
  'Onward Ticket — $0.99 per booking',
  'Cost Calculator (basic) + Province Safety',
  '211-phrase Phrasebook, Medical, Emergency',
]

const proFeatures = [
  'AI Itinerary Planner — multi-day plans, ICS & PDF export',
  'AI Packing Lists — weather + activity-aware',
  'Unlimited AI usage — no daily limits',
  'Smart Match favorites — save your top destinations',
  'Onward Tickets — 2 free bookings / month',
  'Travel Alerts dashboard — visa, weather, safety',
  'Cost Calculator — detailed breakdowns',
]
</script>

<template>
  <div class="min-h-screen">
    <!-- Section 1: Hero -->
    <section class="relative overflow-hidden">
      <!-- Background gradient -->
      <div class="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50/30" />

      <!-- Decorative blobs -->
      <div class="absolute top-20 left-10 w-64 h-64 bg-primary-200/30 rounded-full blur-3xl" />
      <div class="absolute bottom-10 right-10 w-80 h-80 bg-accent-200/30 rounded-full blur-3xl" />

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 md:pt-20 md:pb-32">
        <div class="text-center max-w-4xl mx-auto">
          <!-- Thai greeting pill -->
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-full shadow-soft mb-6 animate-fade-in">
            <span class="text-2xl">🙏</span>
            <span class="font-thai text-primary-600 font-medium">สวัสดี</span>
            <span class="text-gray-400">•</span>
            <span class="text-gray-600 text-sm">Welcome to Thailand</span>
          </div>

          <!-- Headline -->
          <h1 class="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-gray-900 mb-6 animate-slide-up">
            Your Friendly Guide to the
            <span class="text-gradient-thai block mt-2">Land of Smiles</span>
          </h1>

          <!-- Subtitle -->
          <p class="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10 animate-slide-up animate-delay-100">
            Visas, AI itineraries, hidden gems, festivals, safety, language — everything for your Thailand trip in one place.
          </p>

          <!-- CTAs -->
          <div class="flex flex-col items-center justify-center gap-4 animate-slide-up animate-delay-200">
            <div class="flex flex-col sm:flex-row items-center gap-4">
              <RouterLink to="/attractions" class="btn-thai text-lg px-8 py-4">
                Explore Places
                <RightOutlined class="text-sm" />
              </RouterLink>
              <RouterLink to="/visa" class="btn-thai-outline text-lg px-8 py-4">
                Plan Your Trip
              </RouterLink>
            </div>
            <a
              href="#capabilities"
              class="text-sm text-primary-600 font-medium hover:text-primary-700 underline underline-offset-4"
            >
              See everything you get →
            </a>
          </div>

          <!-- Trust indicators -->
          <div class="flex items-center justify-center gap-8 mt-12 text-sm text-gray-500 animate-fade-in animate-delay-300">
            <div class="flex items-center gap-2">
              <SafetyOutlined class="text-accent-500" />
              <span>Trusted info</span>
            </div>
            <div class="flex items-center gap-2">
              <CompassOutlined class="text-accent-500" />
              <span>Local insights</span>
            </div>
            <div class="flex items-center gap-2">
              <FileTextOutlined class="text-accent-500" />
              <span>Always updated</span>
            </div>
          </div>

          <!-- Stats bar — 5 numbers, dividers on md+ only -->
          <div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 md:gap-x-10 mt-8 animate-fade-in animate-delay-400">
            <div class="text-center">
              <div class="text-2xl md:text-3xl font-bold text-gray-900">400+</div>
              <div class="text-xs text-gray-500">Places</div>
            </div>
            <div class="hidden md:block w-px h-8 bg-gray-200" />
            <div class="text-center">
              <div class="text-2xl md:text-3xl font-bold text-gray-900">50+</div>
              <div class="text-xs text-gray-500">Festivals</div>
            </div>
            <div class="hidden md:block w-px h-8 bg-gray-200" />
            <div class="text-center">
              <div class="text-2xl md:text-3xl font-bold text-gray-900">8</div>
              <div class="text-xs text-gray-500">UNESCO Sites</div>
            </div>
            <div class="hidden md:block w-px h-8 bg-gray-200" />
            <div class="text-center">
              <div class="text-2xl md:text-3xl font-bold text-gray-900">46</div>
              <div class="text-xs text-gray-500">Guides</div>
            </div>
            <div class="hidden md:block w-px h-8 bg-gray-200" />
            <div class="text-center">
              <div class="text-2xl md:text-3xl font-bold text-gray-900">211</div>
              <div class="text-xs text-gray-500">Phrases</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Wave divider -->
      <div class="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full">
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>

    <!-- Section 2: Capabilities grid — replaces Discover Thailand + Plan Your Trip -->
    <section id="capabilities" class="py-16 md:py-24 bg-white scroll-mt-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
            Everything you need for Thailand
          </h2>
          <p class="text-lg text-gray-600">
            From visas and AI trip plans to hospitals and 211 phrases — one app, no tab-juggling.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <RouterLink
            v-for="cap in capabilities"
            :key="cap.route"
            :to="cap.route"
            class="group relative card-thai hover:shadow-thai-lg transition-all duration-300 hover:-translate-y-0.5 min-h-[44px]"
          >
            <ProBadge
              v-if="cap.pro"
              size="sm"
              class="absolute top-3 right-3"
            />
            <div
              class="w-12 h-12 rounded-xl mb-4 flex items-center justify-center text-2xl shadow-soft group-hover:scale-110 transition-transform"
              :class="[cap.iconBg, cap.iconText]"
            >
              {{ cap.icon }}
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-1.5 group-hover:text-primary-600 transition-colors">
              {{ cap.title }}
            </h3>
            <p class="text-gray-600 text-sm leading-relaxed">{{ cap.blurb }}</p>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Section 3: What's Happening in Thailand -->
    <section class="py-16 md:py-24 bg-gradient-to-b from-white to-amber-50/30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h2 class="text-2xl md:text-3xl font-display font-bold text-gray-900 mb-2">
              What's Happening in Thailand
            </h2>
            <p class="text-gray-600">Upcoming festivals and events you won't want to miss</p>
          </div>
          <RouterLink
            to="/festivals"
            class="hidden sm:flex items-center gap-2 text-primary-600 font-medium hover:text-primary-700"
          >
            View all <RightOutlined class="text-xs" />
          </RouterLink>
        </div>

        <UpcomingFestivalBanner />

        <div class="mt-6 text-center sm:hidden">
          <RouterLink to="/festivals" class="btn-thai-outline">View All Festivals</RouterLink>
        </div>
      </div>
    </section>

    <!-- Section 4: Hidden Gems -->
    <section class="py-16 md:py-24 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between mb-8">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <StarOutlined class="text-primary-500" />
              <span class="text-sm font-medium text-primary-600">Hidden Gems</span>
            </div>
            <h2 class="text-2xl md:text-3xl font-display font-bold text-gray-900 mb-2">
              Off the Beaten Path
            </h2>
            <p class="text-gray-600">Discover Thailand's best-kept secrets</p>
          </div>
          <RouterLink
            to="/attractions?hidden=true"
            class="hidden sm:flex items-center gap-2 text-primary-600 font-medium hover:text-primary-700"
          >
            View all
            <RightOutlined class="text-xs" />
          </RouterLink>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AttractionCard
            v-for="attraction in countryStore.hiddenGems.slice(0, 4)"
            :key="attraction.id"
            :attraction="attraction"
          />
        </div>
      </div>
    </section>

    <!-- Section 5: Personalization Invite -->
    <section class="py-16 md:py-24 bg-gradient-to-b from-white to-primary-50/30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <template v-if="!userStore.hasProfile">
          <div class="max-w-3xl mx-auto text-center">
            <div class="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 rounded-full text-primary-700 text-sm font-medium mb-6">
              <span>✨</span> Personalized for you
            </div>
            <h2 class="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
              Get Matched to Your Perfect Places
            </h2>
            <p class="text-lg text-gray-600 mb-8">
              Tell us your travel style and interests — we'll show you which destinations match you best
            </p>

            <div class="flex justify-center gap-4 mb-10">
              <div class="bg-white rounded-xl shadow-soft p-4 text-center w-32">
                <div class="text-3xl mb-2">🏖️</div>
                <div class="text-sm font-semibold text-green-600">92% match</div>
                <div class="text-xs text-gray-500">Koh Lanta</div>
              </div>
              <div class="bg-white rounded-xl shadow-soft p-4 text-center w-32">
                <div class="text-3xl mb-2">🏯</div>
                <div class="text-sm font-semibold text-green-600">87% match</div>
                <div class="text-xs text-gray-500">Chiang Mai</div>
              </div>
              <div class="bg-white rounded-xl shadow-soft p-4 text-center w-32 hidden sm:block">
                <div class="text-3xl mb-2">🌴</div>
                <div class="text-sm font-semibold text-amber-600">74% match</div>
                <div class="text-xs text-gray-500">Koh Samui</div>
              </div>
            </div>

            <button type="button" class="btn-thai text-lg px-8 py-4" @click="openWizard">
              Set My Preferences
              <RightOutlined class="text-sm" />
            </button>
          </div>
        </template>

        <template v-else>
          <div class="max-w-3xl mx-auto text-center">
            <div class="inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full text-green-700 text-sm font-medium mb-6">
              <span>✨</span> Personalized for you
            </div>
            <h2 class="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
              Your Recommendations Are Ready
            </h2>
            <p class="text-lg text-gray-600 mb-8">
              We've matched places to your travel style. See your personalized results.
            </p>
            <RouterLink to="/attractions" class="btn-thai text-lg px-8 py-4">
              View My Matches
              <RightOutlined class="text-sm" />
            </RouterLink>
          </div>
        </template>
      </div>
    </section>

    <!-- Section 6: Free vs Pro -->
    <section id="pricing" class="py-16 md:py-24 bg-white scroll-mt-20">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">Free vs Pro</h2>
          <p class="text-lg text-gray-600">
            Most of HappyRoam is free forever. Pro unlocks the AI tools and removes the daily limits.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <!-- Free plan -->
          <div class="card-thai flex flex-col">
            <div class="mb-6">
              <h3 class="text-xl font-semibold text-gray-900 mb-1">Free</h3>
              <p class="text-sm text-gray-500">Plenty to plan a great trip</p>
            </div>
            <div class="mb-6">
              <span class="text-4xl font-bold text-gray-900">$0</span>
              <span class="text-gray-500 ml-1">forever</span>
            </div>
            <ul class="space-y-3 mb-8 flex-1">
              <li
                v-for="item in freeFeatures"
                :key="item"
                class="flex items-start gap-3 text-gray-700 text-sm"
              >
                <span class="w-5 h-5 mt-0.5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <svg class="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span>{{ item }}</span>
              </li>
            </ul>
            <RouterLink to="/attractions" class="btn-thai-outline text-center">
              Start exploring — free
            </RouterLink>
          </div>

          <!-- Pro plan -->
          <div class="card-thai flex flex-col relative border-2 border-primary-200 shadow-thai-lg">
            <div class="absolute -top-3 left-6">
              <ProBadge size="md" />
            </div>
            <div class="mb-6 mt-2">
              <h3 class="text-xl font-semibold text-gray-900 mb-1">Pro</h3>
              <p class="text-sm text-gray-500">7-day free trial, then $10/month</p>
            </div>
            <div class="mb-6">
              <span class="text-4xl font-bold text-gray-900">$10</span>
              <span class="text-gray-500 ml-1">/month</span>
            </div>
            <p class="text-sm font-medium text-gray-900 mb-3">Everything in Free, plus:</p>
            <ul class="space-y-3 mb-8 flex-1">
              <li
                v-for="item in proFeatures"
                :key="item"
                class="flex items-start gap-3 text-gray-700 text-sm"
              >
                <span class="w-5 h-5 mt-0.5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                  <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span>{{ item }}</span>
              </li>
            </ul>
            <button
              type="button"
              :disabled="checkoutLoading"
              class="w-full py-3.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-2xl hover:shadow-lg transition-all disabled:opacity-50"
              @click="startCheckout"
            >
              {{ checkoutLoading ? 'Loading...' : 'Start 7-Day Free Trial' }}
            </button>
            <p class="text-center text-xs text-gray-400 mt-3">
              Cancel anytime. No charge for 7 days.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Section 7: Booking Partners -->
    <section class="py-16 md:py-20 bg-gradient-to-b from-white to-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-10">
          <h2 class="text-2xl md:text-3xl font-display font-bold text-gray-900 mb-3">Ready to Book?</h2>
          <p class="text-gray-600 max-w-2xl mx-auto">
            Our recommended platforms for booking Thailand travel
          </p>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="card-thai text-center hover:shadow-thai-lg transition-shadow">
            <div class="text-4xl mb-3">🎫</div>
            <h3 class="font-semibold text-gray-900 mb-2">Tours & Activities</h3>
            <p class="text-sm text-gray-600 mb-4">Book experiences, day trips, and attractions</p>
            <AffiliateButton partner="klook" destination="Thailand" variant="primary" class="w-full" />
          </div>

          <div class="card-thai text-center hover:shadow-thai-lg transition-shadow">
            <div class="text-4xl mb-3">🏨</div>
            <h3 class="font-semibold text-gray-900 mb-2">Hotels & Stays</h3>
            <p class="text-sm text-gray-600 mb-4">Find great deals on accommodations</p>
            <AffiliateButton partner="agoda" destination="Thailand" variant="primary" class="w-full" />
          </div>

          <div class="card-thai text-center hover:shadow-thai-lg transition-shadow">
            <div class="text-4xl mb-3">🚌</div>
            <h3 class="font-semibold text-gray-900 mb-2">Transport</h3>
            <p class="text-sm text-gray-600 mb-4">Buses, trains, and ferries across Thailand</p>
            <AffiliateButton partner="12go" destination="Thailand" variant="primary" class="w-full" />
          </div>

          <div class="card-thai text-center hover:shadow-thai-lg transition-shadow">
            <div class="text-4xl mb-3">🗺️</div>
            <h3 class="font-semibold text-gray-900 mb-2">Guided Tours</h3>
            <p class="text-sm text-gray-600 mb-4">Expert-led experiences and adventures</p>
            <AffiliateButton partner="getyourguide" destination="Thailand" variant="primary" class="w-full" />
          </div>
        </div>
      </div>
    </section>

    <!-- Section 8: Bottom CTA -->
    <section class="py-16 md:py-24 bg-gradient-to-br from-primary-500 to-primary-700 relative overflow-hidden">
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div class="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
      </div>

      <div class="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl md:text-4xl font-display font-bold text-white mb-4">Ready for Thailand?</h2>
        <p class="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
          Start with 400+ places — or unlock AI itineraries, packing lists and unlimited chat with Pro.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <RouterLink
            to="/attractions"
            class="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 font-semibold rounded-full shadow-lg hover:shadow-xl transition-shadow"
          >
            Explore Places
            <RightOutlined class="text-sm" />
          </RouterLink>
          <a
            href="#pricing"
            class="inline-flex items-center gap-2 px-8 py-4 bg-primary-600/30 text-white font-medium rounded-full border-2 border-white/30 hover:bg-primary-600/50 transition-colors"
          >
            Start 7-Day Pro Trial
          </a>
        </div>
      </div>
    </section>

    <!-- First-visit onboarding -->
    <WelcomeWizard :is-open="showWizard" @close="showWizard = false" @complete="showWizard = false" />
  </div>
</template>
