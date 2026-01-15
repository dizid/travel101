<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useUserStore } from '@stores/userStore'
import {
  MenuOutlined,
  CloseOutlined,
  UserOutlined,
  CrownOutlined,
} from '@ant-design/icons-vue'

const route = useRoute()
const userStore = useUserStore()
const isMobileMenuOpen = ref(false)

const navigation = [
  { name: 'Visa Guide', path: '/visa', icon: '🛂' },
  { name: 'TDAC', path: '/tdac', icon: '📝' },
  { name: 'Good to Know', path: '/warnings', icon: '💡' },
  { name: 'Places', path: '/attractions', icon: '🗺️' },
]

const isActiveRoute = (path: string) => {
  return route.path === path || route.path.startsWith(path + '/')
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}
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
              Smart Traveler
            </h1>
            <p class="text-xs text-primary-600 font-medium -mt-0.5">
              Thailand
            </p>
          </div>
        </RouterLink>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center gap-1">
          <RouterLink
            v-for="item in navigation"
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

          <!-- Profile / Dashboard -->
          <RouterLink
            to="/dashboard"
            class="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors"
          >
            <UserOutlined />
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
        <nav class="px-4 py-4 space-y-1">
          <RouterLink
            v-for="item in navigation"
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

          <div class="pt-3 mt-3 border-t border-gray-100">
            <RouterLink
              to="/dashboard"
              class="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-gray-600 hover:bg-gray-50"
              @click="closeMobileMenu"
            >
              <span class="text-xl">👤</span>
              My Dashboard
            </RouterLink>
          </div>
        </nav>
      </div>
    </Transition>
  </header>
</template>
