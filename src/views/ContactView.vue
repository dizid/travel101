<script setup lang="ts">
const socialLinks = [
  {
    name: 'X (Twitter)',
    handle: '@dizid',
    url: 'https://x.com/dizid',
    icon: '𝕏',
    description: 'Follow for updates and travel tips',
  },
  {
    name: 'LinkedIn',
    handle: 'dizid',
    url: 'https://linkedin.com/in/dizid',
    icon: 'in',
    description: 'Connect professionally',
  },
  {
    name: 'Website',
    handle: 'dizid.com',
    url: 'https://dizid.com',
    icon: '🌐',
    description: 'Visit the main website',
  },
]
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-primary-50/50 to-white">
    <!-- Header -->
    <div class="bg-white border-b border-gray-100">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div class="text-center">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-4">
            👋 Get in Touch
          </div>
          <h1 class="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-3">
            Contact Us
          </h1>
          <p class="text-gray-600 max-w-xl mx-auto">
            Have questions about Thailand travel or our service?
            Connect with us through any of these channels.
          </p>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-2xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <!-- Social Links -->
      <div class="space-y-4">
        <a
          v-for="link in socialLinks"
          :key="link.name"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          class="block p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all group"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-primary-100 flex items-center justify-center transition-colors">
              <span class="text-xl font-bold text-gray-600 group-hover:text-primary-600">{{ link.icon }}</span>
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <h3 class="font-semibold text-gray-900">{{ link.name }}</h3>
                <span class="text-primary-600 font-medium">{{ link.handle }}</span>
              </div>
              <p class="text-sm text-gray-500">{{ link.description }}</p>
            </div>
            <div class="text-gray-400 group-hover:text-primary-500 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
          </div>
        </a>
      </div>

      <!-- Bottom note -->
      <div class="mt-12 p-6 bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl text-center">
        <span class="text-3xl mb-3 block">🌴</span>
        <p class="text-gray-600">
          We typically respond within 24-48 hours.
          <br />
          <span class="font-thai text-primary-600">ขอบคุณครับ</span> • Thank you!
        </p>
      </div>
    </div>
  </div>
</template>
