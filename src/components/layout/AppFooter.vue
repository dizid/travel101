<script setup lang="ts">
import { RouterLink } from 'vue-router'

const currentYear = new Date().getFullYear()

const footerLinks = {
  guides: [
    { name: 'Visa Guide', path: '/visa' },
    { name: 'TDAC Form', path: '/tdac' },
    { name: 'Good to Know', path: '/warnings' },
    { name: 'Places to Visit', path: '/attractions' },
  ],
  resources: [
    { name: 'Plan Your Trip', path: '/itinerary' },
    { name: 'Digital Nomad Guide', path: '/attractions?category=nomad' },
    { name: 'Hidden Gems', path: '/attractions?hidden=true' },
  ],
  account: [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'My Profile', path: '/profile' },
    { name: 'Go Pro', path: '/dashboard#pro' },
  ],
}
</script>

<template>
  <footer class="bg-gray-900 text-gray-300">
    <!-- Main footer -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
        <!-- Brand column -->
        <div class="col-span-2 md:col-span-1">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <span class="text-xl">🌴</span>
            </div>
            <div>
              <h3 class="font-display font-bold text-white">Smart Traveler</h3>
              <p class="text-xs text-primary-400">Thailand</p>
            </div>
          </div>
          <p class="text-sm text-gray-400 mb-4">
            Your friendly guide to visiting the Land of Smiles. Making Thailand travel easy, safe, and unforgettable.
          </p>
          <p class="text-sm font-thai text-primary-400">
            สวัสดี • Sawasdee
          </p>
        </div>

        <!-- Guides -->
        <div>
          <h4 class="font-semibold text-white mb-4">Guides</h4>
          <ul class="space-y-2">
            <li v-for="link in footerLinks.guides" :key="link.path">
              <RouterLink
                :to="link.path"
                class="text-sm hover:text-primary-400 transition-colors"
              >
                {{ link.name }}
              </RouterLink>
            </li>
          </ul>
        </div>

        <!-- Resources -->
        <div>
          <h4 class="font-semibold text-white mb-4">Resources</h4>
          <ul class="space-y-2">
            <li v-for="link in footerLinks.resources" :key="link.path">
              <RouterLink
                :to="link.path"
                class="text-sm hover:text-primary-400 transition-colors"
              >
                {{ link.name }}
              </RouterLink>
            </li>
          </ul>
        </div>

        <!-- Account -->
        <div>
          <h4 class="font-semibold text-white mb-4">Account</h4>
          <ul class="space-y-2">
            <li v-for="link in footerLinks.account" :key="link.path">
              <RouterLink
                :to="link.path"
                class="text-sm hover:text-primary-400 transition-colors"
              >
                {{ link.name }}
              </RouterLink>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Bottom bar -->
    <div class="border-t border-gray-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
          <p class="text-sm text-gray-500">
            © {{ currentYear }} Global Smart Traveler. Made with 💛 for Thailand lovers.
          </p>
          <div class="flex items-center gap-6 text-sm text-gray-500">
            <RouterLink to="/privacy" class="hover:text-gray-300 transition-colors">Privacy</RouterLink>
            <RouterLink to="/terms" class="hover:text-gray-300 transition-colors">Terms</RouterLink>
            <RouterLink to="/contact" class="hover:text-gray-300 transition-colors">Contact</RouterLink>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
