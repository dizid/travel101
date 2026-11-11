<script setup lang="ts">
// AI trip planner page for Thailand. Its copy is HappyRoam's own action plan
// for that traveller question, made by Foreground's fix-kit pipeline and
// fact checked against this site (Foreground order 036, the M4 test in
// dizid/ai-business-score NICHE-PLAN §4.2). The page is the thing being
// measured, so keep edits to facts that change.
import { RouterLink } from 'vue-router'
import { useHead } from '@unhead/vue'
import { useBreadcrumbs, useRouteSeo } from '@/composables/useSeo'

useRouteSeo('aiTripPlanner')
useBreadcrumbs([
  { name: 'Home', url: '/' },
  { name: 'AI Trip Planner', url: '/ai-trip-planner-app-thailand' },
])

const intro = {"heading":"Who this is for and what you get","text":"HappyRoam Thailand is for travellers who are planning a trip to Thailand and want the itinerary, the visa paperwork and the budget in one app instead of ten browser tabs. Inside you get 400+ places to visit, 50+ festivals, 8 UNESCO heritage sites, 46 travel guides and a 211-phrase Thai phrasebook, plus a visa and entry section, a cost calculator and emergency information. Most of it is free forever: places, festivals, heritage, guides, the visa wizard, TDAC and 90-day tools, the visa countdown, the basic cost calculator, province safety, the phrasebook and the medical and emergency pages. The AI tools are limited to one use per day per feature on the free plan. Pro costs $10 a month with a 7-day free trial and can be cancelled at any time. HappyRoam is built by a small team of developers and travel enthusiasts based in Thailand who have collectively spent over a decade living there, from Bangkok and Chiang Mai to Phuket and Koh Phangan."}

// Each traveller question, answered. Rendered visibly below and reused for
// the FAQPage schema, so the schema text always matches what's shown.
const questions = [
  {
    heading: "Which AI trip planner app should I use for Thailand?",
    text: "HappyRoam does one country only, so every feature is tuned to Thailand rather than to travel in general. The AI Itinerary Planner builds multi-day plans with a budget and exports them to ICS (calendar) or PDF, so your plan works offline and on your phone. Smart Match asks for your travel style, interests and budget, then scores every destination against that profile and ranks the ones that fit you — matches are visible on the free plan, and saving favourites is a Pro feature. AI packing lists take weather and planned activities into account. AI Chat and the AI tools are available free at one use per day per feature; Pro removes the daily limits. If you want to test the planning features properly before paying, the 7-day Pro trial covers the full AI itinerary and packing tools."
  },
  {
    heading: "First trip to Thailand: can one app handle the itinerary, visa rules and budget?",
    text: "That is the case HappyRoam is built for. The visa side has a 60-second visa wizard, a TDAC section, 90-day reporting and a visa countdown. The budget side has a cost calculator covering 5 cities, with detailed breakdowns on Pro, and the AI itinerary includes a budget with the plan. For the itinerary itself you have 400+ destinations, 50+ festivals with dates, and guides written for exactly this situation, including a First-Time Thailand guide, a Budget Travel Guide, a Thai Food Guide and an Island Hopping Guide. Travel rules change, so HappyRoam asks you to verify important travel details before you book or fly."
  },
  {
    heading: "What should you look for in a Thailand trip planning app, and how does HappyRoam do it?",
    text: "Four things matter for Thailand. First, how fresh the data is: HappyRoam refreshes content monthly, checks prices, hours and contact details quarterly, and its last editorial review is dated March 2026. Second, where the facts come from: festival dates are verified annually with lunar calendar adjustments and cross-referenced with Tourism Authority of Thailand sources, heritage information comes from UNESCO and Thailand's Fine Arts Department, and medical facility data is verified against JCI accreditation records. Third, what you can take with you: plans export to ICS and PDF, and the 211-phrase phrasebook and emergency pages are there when you have no signal — including Tourist Police 1155, ambulance 1669 and a Bangkok embassy directory, plus 17 vetted hospitals and province-level safety notes. Fourth, honesty about money: affiliate links are clearly marked and the team states there is no pay-for-placement."
  }
]

const closing = {"heading":"Try it before you plan anything","text":"Start on the free plan, set your travel preferences, and see which destinations match you. If you want full multi-day AI itineraries with calendar and PDF export, take the 7-day Pro trial and cancel any time if it is not for you."}

useHead({
  script: [
    {
      id: 'faq-schema',
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: questions.map((q) => ({
          '@type': 'Question',
          name: q.heading,
          acceptedAnswer: { '@type': 'Answer', text: q.text },
        })),
      }),
    },
  ],
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="relative bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 text-white overflow-hidden">
      <div class="absolute inset-0 bg-black/20" />
      <div class="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <h1 class="text-3xl md:text-5xl font-display font-bold">
          AI Trip Planner App for Thailand: Itinerary, Visa Rules and Budget in One Place
        </h1>
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 space-y-6">
      <section class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-10">
        <h2 class="text-2xl font-display font-bold text-gray-900 mb-4">{{ intro.heading }}</h2>
        <p class="text-lg text-gray-700 leading-relaxed">{{ intro.text }}</p>
      </section>

      <section
        v-for="q in questions"
        :key="q.heading"
        class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-10"
      >
        <h2 class="text-xl md:text-2xl font-display font-bold text-gray-900 mb-4">{{ q.heading }}</h2>
        <p class="text-gray-700 leading-relaxed">{{ q.text }}</p>
      </section>

      <section class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-10">
        <h2 class="text-2xl font-display font-bold text-gray-900 mb-4">{{ closing.heading }}</h2>
        <p class="text-gray-700 leading-relaxed mb-6">{{ closing.text }}</p>
        <div class="flex flex-wrap gap-3">
          <RouterLink
            to="/itinerary"
            class="inline-flex items-center px-5 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
          >
            Plan your trip
          </RouterLink>
          <RouterLink
            to="/visa"
            class="inline-flex items-center px-5 py-3 rounded-xl border border-gray-300 text-gray-800 font-semibold hover:bg-gray-100 transition-colors"
          >
            Check your visa
          </RouterLink>
        </div>
      </section>
    </div>
  </div>
</template>
