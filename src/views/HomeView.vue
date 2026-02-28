<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useCountryStore } from '@stores/countryStore'
import { useUserStore } from '@stores/userStore'
import AttractionCard from '@components/features/AttractionCard.vue'
import AffiliateButton from '@components/common/AffiliateButton.vue'
import UpcomingFestivalBanner from '@components/features/UpcomingFestivalBanner.vue'
import {
  RightOutlined,
  SafetyOutlined,
  CompassOutlined,
  FileTextOutlined,
  StarOutlined,
} from '@ant-design/icons-vue'

const countryStore = useCountryStore()
const userStore = useUserStore()

const planTools = [
  {
    icon: '🛂',
    title: 'Visa Guide',
    description: 'Find the perfect visa for your trip with our smart guide.',
    path: '/visa',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    icon: '📝',
    title: 'TDAC Form',
    description: 'Complete your arrival card correctly, step by step.',
    path: '/tdac',
    color: 'from-teal-500 to-emerald-600',
  },
  {
    icon: '✈️',
    title: 'Onward Ticket',
    description: 'Get proof of onward travel for immigration.',
    path: '/onward-ticket',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: '💡',
    title: 'Good to Know',
    description: 'Thai customs and tips for a worry-free visit.',
    path: '/warnings',
    color: 'from-amber-500 to-orange-600',
  },
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
            Everything you need for an amazing Thailand trip — visa guidance, local tips, and personalized recommendations.
          </p>

          <!-- CTAs — Explore Places is primary -->
          <div class="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up animate-delay-200">
            <RouterLink to="/attractions" class="btn-thai text-lg px-8 py-4">
              Explore Places
              <RightOutlined class="text-sm" />
            </RouterLink>
            <RouterLink to="/visa" class="btn-thai-outline text-lg px-8 py-4">
              Plan Your Trip
            </RouterLink>
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

          <!-- Stats bar -->
          <div class="flex items-center justify-center gap-6 md:gap-10 mt-8 animate-fade-in animate-delay-400">
            <div class="text-center">
              <div class="text-2xl md:text-3xl font-bold text-gray-900">400+</div>
              <div class="text-xs text-gray-500">Places</div>
            </div>
            <div class="w-px h-8 bg-gray-200" />
            <div class="text-center">
              <div class="text-2xl md:text-3xl font-bold text-gray-900">50+</div>
              <div class="text-xs text-gray-500">Festivals</div>
            </div>
            <div class="w-px h-8 bg-gray-200" />
            <div class="text-center">
              <div class="text-2xl md:text-3xl font-bold text-gray-900">6</div>
              <div class="text-xs text-gray-500">UNESCO Sites</div>
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

    <!-- Section 2: Discover Thailand (content pillars) -->
    <section class="py-16 md:py-24 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">Discover Thailand</h2>
          <p class="text-lg text-gray-600">Explore destinations, festivals, and heritage across the Land of Smiles</p>
        </div>

        <div class="grid md:grid-cols-3 gap-6">
          <!-- Places -->
          <RouterLink
            to="/attractions"
            class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 p-8 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
          >
            <div class="text-5xl mb-4">🗺️</div>
            <h3 class="text-2xl font-display font-bold mb-2">Places to Visit</h3>
            <p class="text-teal-100 mb-4">400+ destinations — beaches, temples, islands, hidden gems and nomad hubs</p>
            <span class="inline-flex items-center gap-1 text-sm font-medium text-white/90 group-hover:text-white">
              Explore places <RightOutlined class="text-xs" />
            </span>
          </RouterLink>

          <!-- Festivals -->
          <RouterLink
            to="/festivals"
            class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-8 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
          >
            <div class="text-5xl mb-4">🎉</div>
            <h3 class="text-2xl font-display font-bold mb-2">Festivals & Events</h3>
            <p class="text-amber-100 mb-4">50+ festivals — Songkran, Loy Krathong, Yi Peng and more with dates and tips</p>
            <span class="inline-flex items-center gap-1 text-sm font-medium text-white/90 group-hover:text-white">
              View festivals <RightOutlined class="text-xs" />
            </span>
          </RouterLink>

          <!-- Heritage -->
          <RouterLink
            to="/heritage"
            class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 p-8 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
          >
            <div class="text-5xl mb-4">🏛️</div>
            <h3 class="text-2xl font-display font-bold mb-2">Heritage Sites</h3>
            <p class="text-rose-100 mb-4">UNESCO World Heritage temples, palaces, and historical parks</p>
            <span class="inline-flex items-center gap-1 text-sm font-medium text-white/90 group-hover:text-white">
              Explore heritage <RightOutlined class="text-xs" />
            </span>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Section 3: What's Happening in Thailand (upcoming festivals) -->
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

        <!-- Self-fetching component — no props needed for homepage -->
        <UpcomingFestivalBanner />

        <div class="mt-6 text-center sm:hidden">
          <RouterLink to="/festivals" class="btn-thai-outline">View All Festivals</RouterLink>
        </div>
      </div>
    </section>

    <!-- Section 4: Hidden Gems (unchanged) -->
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
        <!-- No profile: invite to set preferences -->
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

            <!-- Mock match cards to illustrate the feature -->
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

            <RouterLink to="/profile" class="btn-thai text-lg px-8 py-4">
              Set My Preferences
              <RightOutlined class="text-sm" />
            </RouterLink>
          </div>
        </template>

        <!-- Has profile: point them to their matches -->
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

    <!-- Section 6: Plan Your Trip (tools) -->
    <section class="py-16 md:py-24 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">Plan Your Trip</h2>
          <p class="text-lg text-gray-600">Essential tools and guides for your Thailand journey</p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <RouterLink
            v-for="tool in planTools"
            :key="tool.path"
            :to="tool.path"
            class="group card-thai hover:shadow-thai-lg transition-all duration-300"
          >
            <div
              class="w-14 h-14 rounded-xl mb-4 flex items-center justify-center text-2xl bg-gradient-to-br shadow-soft group-hover:scale-110 transition-transform"
              :class="tool.color"
            >
              {{ tool.icon }}
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
              {{ tool.title }}
            </h3>
            <p class="text-gray-600 text-sm">{{ tool.description }}</p>
            <div class="mt-4 flex items-center text-primary-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Learn more
              <RightOutlined class="ml-1 text-xs" />
            </div>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Section 7: Booking Partners (reframed) -->
    <section class="py-16 md:py-20 bg-gradient-to-b from-white to-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-10">
          <h2 class="text-2xl md:text-3xl font-display font-bold text-gray-900 mb-3">Ready to Book?</h2>
          <p class="text-gray-600 max-w-2xl mx-auto">
            Our recommended platforms for booking Thailand travel
          </p>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Klook -->
          <div class="card-thai text-center hover:shadow-thai-lg transition-shadow">
            <div class="text-4xl mb-3">🎫</div>
            <h3 class="font-semibold text-gray-900 mb-2">Tours & Activities</h3>
            <p class="text-sm text-gray-600 mb-4">Book experiences, day trips, and attractions</p>
            <AffiliateButton partner="klook" destination="Thailand" variant="primary" class="w-full" />
          </div>

          <!-- Agoda -->
          <div class="card-thai text-center hover:shadow-thai-lg transition-shadow">
            <div class="text-4xl mb-3">🏨</div>
            <h3 class="font-semibold text-gray-900 mb-2">Hotels & Stays</h3>
            <p class="text-sm text-gray-600 mb-4">Find great deals on accommodations</p>
            <AffiliateButton partner="agoda" destination="Thailand" variant="primary" class="w-full" />
          </div>

          <!-- 12Go -->
          <div class="card-thai text-center hover:shadow-thai-lg transition-shadow">
            <div class="text-4xl mb-3">🚌</div>
            <h3 class="font-semibold text-gray-900 mb-2">Transport</h3>
            <p class="text-sm text-gray-600 mb-4">Buses, trains, and ferries across Thailand</p>
            <AffiliateButton partner="12go" destination="Thailand" variant="primary" class="w-full" />
          </div>

          <!-- GetYourGuide -->
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
      <!-- Decorative circles -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div class="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
      </div>

      <div class="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl md:text-4xl font-display font-bold text-white mb-4">Ready for Thailand?</h2>
        <p class="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
          Create your profile and get personalized recommendations, AI-powered itineraries, and more.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <RouterLink
            to="/attractions"
            class="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 font-semibold rounded-full shadow-lg hover:shadow-xl transition-shadow"
          >
            Explore Places
            <RightOutlined class="text-sm" />
          </RouterLink>
          <RouterLink
            to="/visa"
            class="inline-flex items-center gap-2 px-8 py-4 bg-primary-600/30 text-white font-medium rounded-full border-2 border-white/30 hover:bg-primary-600/50 transition-colors"
          >
            Check Visa Guide
          </RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>
