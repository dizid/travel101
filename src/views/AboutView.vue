<script setup lang="ts">
import { RouterLink } from 'vue-router'

const stats = [
  {
    icon: '📍',
    number: '400+',
    label: 'Destinations',
    description: 'Beaches, temples, hidden gems, and nomad hubs across 77 provinces',
  },
  {
    icon: '🎉',
    number: '50+',
    label: 'Festivals',
    description: 'From Songkran to Loy Krathong, with dates, tips, and crowd levels',
  },
  {
    icon: '🏆',
    number: '8',
    label: 'UNESCO Sites',
    description: 'World Heritage temples, palaces, and historical parks',
  },
  {
    icon: '🤖',
    number: 'Smart',
    label: 'Matching',
    description: 'AI-powered recommendations based on your travel preferences',
  },
]

const steps = [
  {
    number: '01',
    icon: '🎯',
    title: 'Set Your Preferences',
    description: 'Tell us your travel style, interests, and budget. It takes less than a minute.',
  },
  {
    number: '02',
    icon: '⚡',
    title: 'Get Matched',
    description: 'Our algorithm scores every destination against your profile and ranks them by fit.',
  },
  {
    number: '03',
    icon: '🗺️',
    title: 'Discover & Book',
    description: 'Explore your top matches and book with our trusted travel partners.',
  },
]

const editorialPoints = [
  {
    icon: '✍️',
    text: 'Every destination is hand-researched with insider tips, local secrets, and practical advice from people who live in Thailand',
  },
  {
    icon: '📅',
    text: 'Festival dates are verified annually with lunar calendar adjustments — we cross-reference Tourism Authority of Thailand sources',
  },
  {
    icon: '🏛️',
    text: 'Heritage information sourced from UNESCO and Thailand\'s Fine Arts Department, with historical accuracy reviewed',
  },
  {
    icon: '🔄',
    text: 'Content is updated monthly with price checks, new openings, and seasonal changes — last review: March 2026',
  },
  {
    icon: '🏥',
    text: 'Medical facility data verified against JCI accreditation records and Google reviews — only real, operating facilities listed',
  },
  {
    icon: '⚖️',
    text: 'Affiliate partnerships are clearly disclosed. We only recommend services we would use ourselves — no pay-for-placement',
  },
]

const whoWeAre = {
  title: 'Who We Are',
  paragraphs: [
    'HappyRoam is built by a small team of developers and travel enthusiasts based in Thailand. We created this guide because we were frustrated with generic travel content that reads like it was written by someone who\'s never been here.',
    'Our team has collectively spent over a decade living in Thailand — from Bangkok to Chiang Mai, Phuket to Koh Phangan. We eat the street food, ride the songthaews, renew our own visas, and navigate the same 90-day reporting you will. This isn\'t a travel blog written from a hotel room — it\'s a practical guide informed by daily life.',
    'We combine local knowledge with technology: AI-powered recommendations learn from your travel preferences, real-time data keeps prices and availability current, and our editorial team fact-checks every guide against on-the-ground reality.',
  ],
  approach: [
    { label: 'Research', desc: 'We visit places before recommending them' },
    { label: 'Verify', desc: 'Prices, hours, and contact info are checked quarterly' },
    { label: 'Update', desc: 'Content is refreshed monthly — not left to go stale' },
    { label: 'Disclose', desc: 'Affiliate links are clearly marked — always' },
  ],
}

const socialLinks = [
  {
    icon: '𝕏',
    label: 'Twitter',
    handle: '@happyroam',
    url: 'https://x.com/happyroam',
  },
  {
    icon: '📘',
    label: 'Facebook',
    handle: 'HappyRoam',
    url: 'https://facebook.com/happyroam',
  },
  {
    icon: '📸',
    label: 'Instagram',
    handle: '@happyroam',
    url: 'https://instagram.com/happyroam',
  },
]
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Hero Section -->
    <div class="relative bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 text-white overflow-hidden">
      <div class="absolute inset-0 bg-black/20" />
      <div class="absolute inset-0 bg-[url('/patterns/thai-pattern.svg')] opacity-10" />

      <div class="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 text-white rounded-full text-sm font-medium mb-6">
          🌴 Our Story
        </div>
        <h1 class="text-4xl md:text-5xl font-display font-bold mb-4">
          About HappyRoam
        </h1>
        <p class="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
          Built by travelers who fell in love with Thailand
        </p>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

      <!-- Mission Section -->
      <section class="py-12 md:py-16">
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-12">
          <div class="text-center mb-8">
            <span class="text-4xl mb-4 block">🧭</span>
            <h2 class="text-2xl md:text-3xl font-display font-bold text-gray-900 mb-4">
              Our Mission
            </h2>
          </div>
          <p class="text-lg text-gray-600 leading-relaxed text-center max-w-2xl mx-auto">
            HappyRoam is a comprehensive Thailand travel guide built for travelers who want more than surface-level tips.
            We combine local knowledge, real travel data, and AI-powered personalization to help you discover the Thailand
            that matches your travel style.
          </p>
          <div class="mt-8 flex flex-wrap justify-center gap-3">
            <span class="px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
              🏖️ Destinations
            </span>
            <span class="px-4 py-2 bg-accent-50 text-accent-700 rounded-full text-sm font-medium">
              🎉 Festivals
            </span>
            <span class="px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">
              🏛️ Heritage Sites
            </span>
            <span class="px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-sm font-medium">
              📋 Visa Guidance
            </span>
          </div>
        </div>
      </section>

      <!-- Who We Are -->
      <section class="pb-12 md:pb-16">
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-12">
          <div class="text-center mb-8">
            <span class="text-4xl mb-4 block">🌏</span>
            <h2 class="text-2xl md:text-3xl font-display font-bold text-gray-900 mb-2">
              {{ whoWeAre.title }}
            </h2>
          </div>
          <div class="space-y-4 max-w-3xl mx-auto">
            <p
              v-for="(para, i) in whoWeAre.paragraphs"
              :key="i"
              class="text-gray-600 leading-relaxed"
            >
              {{ para }}
            </p>
          </div>
          <div class="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
              v-for="item in whoWeAre.approach"
              :key="item.label"
              class="text-center p-4 bg-gray-50 rounded-xl"
            >
              <div class="text-sm font-bold text-primary-600 mb-1">{{ item.label }}</div>
              <p class="text-xs text-gray-500">{{ item.desc }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Stats Grid -->
      <section class="pb-12 md:pb-16">
        <div class="text-center mb-8">
          <h2 class="text-2xl md:text-3xl font-display font-bold text-gray-900">
            What We Cover
          </h2>
        </div>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center hover:shadow-md transition-shadow"
          >
            <span class="text-3xl mb-3 block">{{ stat.icon }}</span>
            <div class="text-2xl font-display font-bold text-primary-600 mb-1">
              {{ stat.number }}
            </div>
            <div class="font-semibold text-gray-900 mb-2">{{ stat.label }}</div>
            <p class="text-sm text-gray-500 leading-snug">{{ stat.description }}</p>
          </div>
        </div>
      </section>

      <!-- How It Works -->
      <section class="pb-12 md:pb-16">
        <div class="text-center mb-8">
          <h2 class="text-2xl md:text-3xl font-display font-bold text-gray-900">
            How It Works
          </h2>
          <p class="text-gray-500 mt-2">Personalized recommendations in three steps</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="(step, index) in steps"
            :key="step.number"
            class="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
          >
            <!-- Connector line between steps (desktop only) -->
            <div
              v-if="index < steps.length - 1"
              class="hidden md:block absolute top-10 left-full w-6 h-0.5 bg-gradient-to-r from-primary-200 to-transparent z-10"
            />
            <div class="text-xs font-bold text-primary-400 tracking-widest mb-3">
              STEP {{ step.number }}
            </div>
            <span class="text-3xl mb-3 block">{{ step.icon }}</span>
            <h3 class="font-display font-bold text-gray-900 mb-2">{{ step.title }}</h3>
            <p class="text-sm text-gray-500 leading-relaxed">{{ step.description }}</p>
          </div>
        </div>
      </section>

      <!-- Editorial Credibility -->
      <section class="pb-12 md:pb-16">
        <div class="bg-gradient-to-br from-primary-50 via-white to-accent-50/30 rounded-2xl border border-primary-100 p-8 md:p-12">
          <div class="text-center mb-8">
            <span class="text-4xl mb-4 block">📖</span>
            <h2 class="text-2xl md:text-3xl font-display font-bold text-gray-900 mb-2">
              Our Content
            </h2>
            <p class="text-gray-500">Editorial standards that affiliate reviewers can trust</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              v-for="point in editorialPoints"
              :key="point.text"
              class="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm"
            >
              <span class="text-2xl flex-shrink-0">{{ point.icon }}</span>
              <p class="text-gray-600 text-sm leading-relaxed">{{ point.text }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Contact & Socials -->
      <section class="pb-16 md:pb-24">
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-12 text-center">
          <span class="text-4xl mb-4 block">👋</span>
          <h2 class="text-2xl font-display font-bold text-gray-900 mb-2">
            Get in Touch
          </h2>
          <p class="text-gray-500 mb-6">
            Questions, partnerships, or just want to say hello?
          </p>

          <RouterLink
            to="/contact"
            class="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium mb-8"
          >
            Contact Us
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </RouterLink>

          <!-- Social Links -->
          <div class="flex justify-center gap-4 flex-wrap">
            <a
              v-for="social in socialLinks"
              :key="social.label"
              :href="social.url"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700 transition-all text-sm font-medium"
            >
              <span class="font-bold">{{ social.icon }}</span>
              <span>{{ social.handle }}</span>
            </a>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>
