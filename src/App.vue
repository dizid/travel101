<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { watch } from 'vue'
import AppHeader from '@components/layout/AppHeader.vue'
import AppFooter from '@components/layout/AppFooter.vue'
import ExitIntentPopup from '@components/ui/ExitIntentPopup.vue'
import { useAuth } from '@/composables/useAuth'
import { useUserStore } from '@/stores/userStore'

// Initialize auth on app load - checks session and syncs profile
useAuth()

// Test mode backdoor: ?test=test123 enables pro features for testing
const route = useRoute()
const userStore = useUserStore()

watch(
  () => route.query.test,
  (testParam) => {
    if (testParam === 'test123') {
      userStore.setTestMode(true)
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader />
    <main class="flex-1">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
    <AppFooter />
    <ExitIntentPopup />
  </div>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
