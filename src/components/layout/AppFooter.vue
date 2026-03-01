<script setup lang="ts">
import { RouterLink } from 'vue-router'
import NewsletterSignup from '@/components/ui/NewsletterSignup.vue'

const currentYear = new Date().getFullYear()

const footerLinks = {
  guides: [
    { name: 'Visa Guide', path: '/visa' },
    { name: 'TDAC Form', path: '/tdac' },
    { name: 'Good to Know', path: '/warnings' },
    { name: 'Places to Visit', path: '/attractions' },
    { name: 'Festivals', path: '/festivals' },
    { name: 'Heritage Sites', path: '/heritage' },
    { name: 'About', path: '/about' },
  ],
  travelGuides: [
    { name: 'All Travel Guides', path: '/guides' },
    { name: 'First-Time Thailand', path: '/guides/first-time-thailand' },
    { name: 'Budget Travel Guide', path: '/guides/thailand-budget-guide' },
    { name: 'Thai Food Guide', path: '/guides/thai-food-guide' },
    { name: 'Island Hopping Guide', path: '/guides/island-hopping-guide' },
  ],
  resources: [
    { name: 'Plan Your Trip', path: '/itinerary' },
    { name: 'Cost Calculator', path: '/cost-calculator' },
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
      <div class="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-10">
        <!-- Brand column -->
        <div class="col-span-2 md:col-span-1">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <span class="text-xl">🌴</span>
            </div>
            <div>
              <h3 class="font-display font-bold text-white">HappyRoam</h3>
              <p class="text-xs text-primary-400">Thailand</p>
            </div>
          </div>
          <p class="text-sm text-gray-400 mb-4">
            Your friendly guide to visiting the Land of Smiles. Making Thailand travel easy, safe, and unforgettable.
          </p>
          <p class="text-sm font-thai text-primary-400">
            สวัสดี • Sawasdee
          </p>

          <!-- Social links -->
          <div class="flex items-center gap-3 mt-4">
            <a
              href="https://twitter.com/happyroam"
              target="_blank"
              rel="noopener"
              class="text-gray-400 hover:text-primary-400 transition-colors text-lg leading-none"
              title="Twitter"
            >
              𝕏
            </a>
            <a
              href="https://facebook.com/happyroam"
              target="_blank"
              rel="noopener"
              class="text-gray-400 hover:text-primary-400 transition-colors font-bold text-base leading-none"
              title="Facebook"
            >
              f
            </a>
            <a
              href="https://instagram.com/happyroam"
              target="_blank"
              rel="noopener"
              class="text-gray-400 hover:text-primary-400 transition-colors text-base leading-none"
              title="Instagram"
            >
              📷
            </a>
          </div>
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

        <!-- Travel Guides -->
        <div>
          <h4 class="font-semibold text-white mb-4">Travel Guides</h4>
          <ul class="space-y-2">
            <li v-for="link in footerLinks.travelGuides" :key="link.path">
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

      <!-- Newsletter Section -->
      <div class="mt-12 pt-8 border-t border-gray-800">
        <div class="max-w-md">
          <NewsletterSignup />
        </div>
      </div>
    </div>

    <!-- Bottom bar -->
    <div class="border-t border-gray-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <!-- Disclaimers -->
        <p class="text-sm text-gray-500 text-center mb-2">
          Content researched by our team with AI assistance. Always verify important travel details.
        </p>
        <p class="text-xs text-gray-600 text-center mb-4">
          Some links on this site are affiliate links. We may earn a commission at no extra cost to you.
        </p>
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
          <p class="text-sm text-gray-500">
            © {{ currentYear }} HappyRoam. Made with 💛 for Thailand lovers.
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
