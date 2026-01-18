<script setup lang="ts">
import { computed, ref } from 'vue'
import { ShareAltOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons-vue'

const props = defineProps<{
  placeName: string
  matchScore: number
  category: string
  province: string
}>()

const copied = ref(false)
const canShare = ref(typeof navigator !== 'undefined' && 'share' in navigator)

const matchLevel = computed(() => {
  if (props.matchScore >= 90) return { text: 'Perfect Match!', color: 'from-green-400 to-emerald-500', emoji: '💚' }
  if (props.matchScore >= 75) return { text: 'Great Match!', color: 'from-teal-400 to-cyan-500', emoji: '💙' }
  if (props.matchScore >= 50) return { text: 'Good Match', color: 'from-amber-400 to-orange-500', emoji: '💛' }
  return { text: 'Worth Exploring', color: 'from-gray-400 to-gray-500', emoji: '🤍' }
})

const shareText = computed(() =>
  `I'm a ${props.matchScore}% match with ${props.placeName}! ${matchLevel.value.emoji} Find your perfect Thailand destination at happyroam.travel`
)

const shareUrl = computed(() =>
  `https://happyroam.travel/attractions?highlight=${encodeURIComponent(props.placeName)}`
)

async function shareNative() {
  if (navigator.share) {
    try {
      await navigator.share({
        title: `${props.matchScore}% Match - ${props.placeName}`,
        text: shareText.value,
        url: shareUrl.value,
      })
    } catch {
      // User cancelled or error
    }
  }
}

function shareToTwitter() {
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText.value)}&url=${encodeURIComponent(shareUrl.value)}`
  window.open(url, '_blank', 'width=550,height=420')
}

function shareToFacebook() {
  const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl.value)}&quote=${encodeURIComponent(shareText.value)}`
  window.open(url, '_blank', 'width=550,height=420')
}

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(`${shareText.value}\n${shareUrl.value}`)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Fallback
  }
}
</script>

<template>
  <div class="relative overflow-hidden rounded-2xl shadow-xl">
    <!-- Background gradient -->
    <div
      class="absolute inset-0 bg-gradient-to-br opacity-90"
      :class="matchLevel.color"
    />

    <!-- Pattern overlay -->
    <div class="absolute inset-0 opacity-10">
      <svg class="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <pattern id="dots" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="white" />
        </pattern>
        <rect width="100" height="100" fill="url(#dots)" />
      </svg>
    </div>

    <!-- Content -->
    <div class="relative p-6 text-white text-center">
      <!-- Score circle -->
      <div class="relative w-28 h-28 mx-auto mb-4">
        <svg class="w-full h-full transform -rotate-90">
          <circle
            cx="56"
            cy="56"
            r="50"
            stroke="rgba(255,255,255,0.3)"
            stroke-width="8"
            fill="none"
          />
          <circle
            cx="56"
            cy="56"
            r="50"
            stroke="white"
            stroke-width="8"
            fill="none"
            :stroke-dasharray="`${matchScore * 3.14} 314`"
            stroke-linecap="round"
          />
        </svg>
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-3xl font-bold">{{ matchScore }}%</span>
        </div>
      </div>

      <p class="text-lg font-semibold text-white/90 mb-1">{{ matchLevel.text }}</p>
      <h3 class="text-2xl font-bold mb-1">{{ placeName }}</h3>
      <p class="text-sm text-white/80">{{ province }} • {{ category }}</p>

      <!-- Share buttons -->
      <div class="flex items-center justify-center gap-2 mt-5">
        <button
          v-if="canShare"
          @click="shareNative"
          class="flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full text-sm font-medium transition-colors"
        >
          <ShareAltOutlined />
          Share
        </button>
        <button
          @click="shareToTwitter"
          class="w-9 h-9 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors"
          title="Share on X"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </button>
        <button
          @click="shareToFacebook"
          class="w-9 h-9 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors"
          title="Share on Facebook"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </button>
        <button
          @click="copyToClipboard"
          class="w-9 h-9 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors"
          :title="copied ? 'Copied!' : 'Copy link'"
        >
          <CheckOutlined v-if="copied" class="text-green-300" />
          <CopyOutlined v-else />
        </button>
      </div>

      <!-- Branding -->
      <p class="mt-4 text-xs text-white/60">
        happyroam.travel
      </p>
    </div>
  </div>
</template>
