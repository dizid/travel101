<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useUserStore } from '@stores/userStore'
import {
  MenuOutlined,
  CloseOutlined,
  UserOutlined,
  CrownOutlined,
  HeartOutlined,
} from '@ant-design/icons-vue'

const route = useRoute()
const userStore = useUserStore()
const isMobileMenuOpen = ref(false)
const isPlanDropdownOpen = ref(false)

// Profile completeness for the chip
const profileProgress = computed(() => {
  const prefs = userStore.profile.prefs
  let score = 0
  if (prefs.nationality) score += 25
  if (prefs.travelStyle.length > 0) score += 25
  if (prefs.interests.length > 0) score += 25
  if (prefs.tripType) score += 25
  return score
})

const primaryNav = [
  { name: 'Places', path: '/attractions', icon: '🗺️' },
  { name: 'Festivals', path: '/festivals', icon: '🎉' },
  { name: 'Heritage', path: '/heritage', icon: '🏛️' },
  { name: 'Guides', path: '/guides', icon: '📚' },
]

const planNav = [
  { name: 'Visa Guide', path: '/visa', icon: '🛂' },
  { name: 'Visa Countdown', path: '/visa-countdown', icon: '⏳' },
  { name: 'TDAC Form', path: '/tdac', icon: '📝' },
  { name: 'Onward Ticket', path: '/onward-ticket', icon: '✈️' },
  { name: 'Phrasebook', path: '/phrasebook', icon: '🗣️' },
  { name: 'Good to Know', path: '/warnings', icon: '💡' },
  { name: 'Emergency Contacts', path: '/emergency', icon: '🆘' },
]

const isActiveRoute = (path: string) => {
  return route.path === path || route.path.startsWith(path + '/')
}

const isPlanNavActive = computed(() => {
  return planNav.some(item => isActiveRoute(item.path))
})

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const togglePlanDropdown = () => {
  isPlanDropdownOpen.value = !isPlanDropdownOpen.value
}

const closePlanDropdown = () => {
  isPlanDropdownOpen.value = false
}

// Close Plan dropdown when clicking outside
const handleOutsideClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('[data-plan-dropdown]')) {
    isPlanDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})
</script>

<template>
  <header class="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16 md:h-20">
        <!-- Logo -->
        <RouterLink
          to="/"
          class="flex items-center gap-3 group"
          @click="closeMobileMenu"
        >
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-thai group-hover:shadow-thai-lg transition-shadow">
            <span class="text-xl">🌴</span>
          </div>
          <div class="hidden sm:block">
            <h1 class="text-lg font-display font-bold text-gray-900">
              HappyRoam
            </h1>
            <p class="text-xs text-primary-600 font-medium -mt-0.5">
              Thailand
            </p>
          </div>
        </RouterLink>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center gap-1">
          <!-- Primary discovery links -->
          <RouterLink
            v-for="item in primaryNav"
            :key="item.path"
            :to="item.path"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            :class="[
              isActiveRoute(item.path)
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            ]"
          >
            <span class="mr-1.5">{{ item.icon }}</span>
            {{ item.name }}
          </RouterLink>

          <!-- Plan dropdown -->
          <div class="relative" data-plan-dropdown>
            <button
              @click.stop="togglePlanDropdown"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1"
              :class="[
                isPlanNavActive || isPlanDropdownOpen
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              ]"
            >
              <span class="mr-1">🗓️</span>
              Plan
              <svg
                class="w-3.5 h-3.5 ml-0.5 transition-transform duration-200"
                :class="{ 'rotate-180': isPlanDropdownOpen }"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            <!-- Dropdown panel -->
            <Transition
              enter-active-class="transition duration-150 ease-out"
              enter-from-class="opacity-0 scale-95 -translate-y-1"
              enter-to-class="opacity-100 scale-100 translate-y-0"
              leave-active-class="transition duration-100 ease-in"
              leave-from-class="opacity-100 scale-100 translate-y-0"
              leave-to-class="opacity-0 scale-95 -translate-y-1"
            >
              <div
                v-if="isPlanDropdownOpen"
                class="absolute top-full left-0 mt-2 bg-white shadow-lg rounded-xl border border-gray-100 p-2 min-w-[200px] z-50"
              >
                <RouterLink
                  v-for="item in planNav"
                  :key="item.path"
                  :to="item.path"
                  class="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                  :class="[
                    isActiveRoute(item.path)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  ]"
                  @click="closePlanDropdown"
                >
                  <span>{{ item.icon }}</span>
                  {{ item.name }}
                </RouterLink>
              </div>
            </Transition>
          </div>

          <!-- About link -->
          <RouterLink
            to="/about"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            :class="[
              isActiveRoute('/about')
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            ]"
          >
            About
          </RouterLink>
        </nav>

        <!-- Right side actions -->
        <div class="flex items-center gap-3">
          <!-- Pro Badge / Upgrade -->
          <RouterLink
            v-if="!userStore.isPro"
            to="/dashboard"
            class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-500 to-accent-500 text-white text-sm font-medium rounded-full hover:shadow-lg transition-shadow"
          >
            <CrownOutlined class="text-xs" />
            <span>Go Pro</span>
          </RouterLink>
          <div
            v-else
            class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-100 to-accent-100 text-primary-700 text-sm font-semibold rounded-full"
          >
            <CrownOutlined class="text-xs" />
            <span>Pro</span>
          </div>

          <!-- Profile Status Chip -->
          <RouterLink
            to="/profile"
            class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
            :class="[
              userStore.hasProfile
                ? 'bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200/50 hover:border-rose-300'
                : 'bg-gray-100 hover:bg-gray-200'
            ]"
            :title="userStore.hasProfile ? 'Your preferences are active' : 'Complete your profile'"
          >
            <!-- Profile complete: sparkle indicator -->
            <template v-if="userStore.hasProfile">
              <span class="text-sm">✨</span>
              <span class="text-xs font-medium text-rose-700">Personalized</span>
            </template>

            <!-- Profile incomplete: progress ring -->
            <template v-else>
              <svg class="w-5 h-5 -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18" cy="18" r="14"
                  fill="none"
                  stroke="#e5e7eb"
                  stroke-width="3"
                />
                <circle
                  cx="18" cy="18" r="14"
                  fill="none"
                  stroke="#f43f5e"
                  stroke-width="3"
                  stroke-linecap="round"
                  :stroke-dasharray="`${profileProgress * 0.88} 100`"
                  class="transition-all duration-300"
                />
              </svg>
              <span class="text-xs font-medium text-gray-600">{{ profileProgress }}%</span>
            </template>
          </RouterLink>

          <!-- Saved Places -->
          <RouterLink
            to="/saved"
            class="hidden sm:flex w-9 h-9 rounded-full bg-gray-100 items-center justify-center text-gray-600 hover:bg-rose-50 hover:text-rose-500 transition-colors"
            title="Saved Places"
          >
            <HeartOutlined />
          </RouterLink>

          <!-- Profile / Dashboard — with incomplete indicator dot on mobile -->
          <RouterLink
            to="/dashboard"
            class="relative w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors"
          >
            <UserOutlined />
            <!-- Profile incomplete dot (mobile only — sm+ shows the chip above) -->
            <span
              v-if="!userStore.hasProfile"
              class="absolute -top-0.5 -right-0.5 w-3 h-3 bg-primary-500 rounded-full border-2 border-white sm:hidden"
            />
          </RouterLink>

          <!-- Mobile menu button -->
          <button
            @click="toggleMobileMenu"
            class="md:hidden w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <MenuOutlined v-if="!isMobileMenuOpen" />
            <CloseOutlined v-else />
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Navigation -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="isMobileMenuOpen"
        class="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-lg"
      >
        <nav class="py-3">
          <!-- Discover section -->
          <div class="text-[11px] font-semibold uppercase tracking-wider text-gray-400 px-4 pt-4 pb-1">Discover</div>
          <div class="px-3 space-y-0.5">
            <RouterLink
              v-for="item in primaryNav"
              :key="item.path"
              :to="item.path"
              class="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all"
              :class="[
                isActiveRoute(item.path)
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50'
              ]"
              @click="closeMobileMenu"
            >
              <span class="text-xl">{{ item.icon }}</span>
              {{ item.name }}
            </RouterLink>
          </div>

          <!-- Plan Your Trip section -->
          <div class="text-[11px] font-semibold uppercase tracking-wider text-gray-400 px-4 pt-4 pb-1">Plan Your Trip</div>
          <div class="px-3 space-y-0.5">
            <RouterLink
              v-for="item in planNav"
              :key="item.path"
              :to="item.path"
              class="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all"
              :class="[
                isActiveRoute(item.path)
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50'
              ]"
              @click="closeMobileMenu"
            >
              <span class="text-xl">{{ item.icon }}</span>
              {{ item.name }}
            </RouterLink>
          </div>

          <!-- My Account section -->
          <div class="text-[11px] font-semibold uppercase tracking-wider text-gray-400 px-4 pt-4 pb-1">My Account</div>
          <div class="px-3 space-y-0.5">
            <RouterLink
              to="/dashboard"
              class="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all"
              :class="[
                isActiveRoute('/dashboard')
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50'
              ]"
              @click="closeMobileMenu"
            >
              <span class="text-xl">👤</span>
              My Dashboard
            </RouterLink>
            <RouterLink
              to="/saved"
              class="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all"
              :class="[
                isActiveRoute('/saved')
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50'
              ]"
              @click="closeMobileMenu"
            >
              <span class="text-xl">❤️</span>
              Saved Places
            </RouterLink>
            <RouterLink
              to="/profile"
              class="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all"
              :class="[
                isActiveRoute('/profile')
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50'
              ]"
              @click="closeMobileMenu"
            >
              <span class="text-xl">⚙️</span>
              My Profile
            </RouterLink>
          </div>
        </nav>
      </div>
    </Transition>
  </header>
</template>
