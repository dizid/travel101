<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { HomeOutlined, SearchOutlined } from '@ant-design/icons-vue'
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
    <div class="text-center max-w-md">
      <!-- Thai-inspired illustration -->
      <div class="mb-8">
        <div class="text-8xl mb-4 animate-float">🛺</div>
        <div class="flex justify-center gap-2 text-4xl">
          <span class="animate-pulse">🌴</span>
          <span class="animate-pulse" style="animation-delay: 0.2s">🏝️</span>
          <span class="animate-pulse" style="animation-delay: 0.4s">🌴</span>
        </div>
      </div>

      <h1 class="text-4xl font-display font-bold text-gray-900 mb-3">
        Lost in Thailand?
      </h1>
      <p class="text-lg text-gray-600 mb-2">
        Mai pen rai! (No worries!)
      </p>
      <p class="text-gray-500 mb-8">
        The page you're looking for seems to have wandered off to explore a hidden beach. Let's get you back on track.
      </p>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
        <RouterLink
          to="/"
          class="btn-thai flex items-center gap-2"
        >
          <HomeOutlined />
          Go Home
        </RouterLink>
        <RouterLink
          to="/attractions"
          class="px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50 transition-all flex items-center gap-2"
        >
          <SearchOutlined />
          Explore Attractions
        </RouterLink>
      </div>

      <!-- Fun Thai phrases -->
      <div class="mt-12 p-6 rounded-2xl bg-gradient-to-br from-primary-50 to-orange-50">
        <p class="text-sm text-gray-600 mb-2">While you're here, learn some Thai:</p>
        <div class="space-y-1">
          <p class="font-thai text-primary-600">
            สวัสดี <span class="text-gray-500 text-sm">(Sawasdee)</span> = Hello
          </p>
          <p class="font-thai text-primary-600">
            ขอบคุณ <span class="text-gray-500 text-sm">(Khob khun)</span> = Thank you
          </p>
          <p class="font-thai text-primary-600">
            ไม่เป็นไร <span class="text-gray-500 text-sm">(Mai pen rai)</span> = No problem
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}
</style>
