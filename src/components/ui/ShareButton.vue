<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  ShareAltOutlined,
  CloseOutlined,
  LinkOutlined,
  CheckOutlined,
} from '@ant-design/icons-vue'

const props = defineProps<{
  title: string
  description?: string
  url?: string
  hashtags?: string[]
}>()

const isOpen = ref(false)
const copied = ref(false)

const shareUrl = computed(() => props.url || window.location.href)
const shareText = computed(() => props.description || props.title)
const hashtagString = computed(() => props.hashtags?.join(',') || 'Thailand,Travel')

// Check if native share is available
const canNativeShare = computed(() => typeof navigator.share === 'function')

// Share URLs for different platforms
const platforms = computed(() => [
  {
    name: 'WhatsApp',
    icon: '💬',
    color: 'bg-green-500 hover:bg-green-600',
    url: `https://wa.me/?text=${encodeURIComponent(`${props.title}\n\n${shareUrl.value}`)}`,
  },
  {
    name: 'Facebook',
    icon: '📘',
    color: 'bg-blue-600 hover:bg-blue-700',
    url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl.value)}`,
  },
  {
    name: 'X (Twitter)',
    icon: '𝕏',
    color: 'bg-black hover:bg-gray-800',
    url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(props.title)}&url=${encodeURIComponent(shareUrl.value)}&hashtags=${hashtagString.value}`,
  },
  {
    name: 'Pinterest',
    icon: '📌',
    color: 'bg-red-600 hover:bg-red-700',
    url: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl.value)}&description=${encodeURIComponent(shareText.value)}`,
  },
])

async function handleShare() {
  if (canNativeShare.value) {
    try {
      await navigator.share({
        title: props.title,
        text: shareText.value,
        url: shareUrl.value,
      })
    } catch (err) {
      // User cancelled or error - open fallback
      if ((err as Error).name !== 'AbortError') {
        isOpen.value = true
      }
    }
  } else {
    isOpen.value = true
  }
}

function openPlatform(url: string) {
  window.open(url, '_blank', 'width=600,height=400,noopener,noreferrer')
  isOpen.value = false
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

function close() {
  isOpen.value = false
}
</script>

<template>
  <div class="relative">
    <!-- Share Button -->
    <button
      @click="handleShare"
      class="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-colors text-gray-600 hover:text-primary-600"
      title="Share"
    >
      <ShareAltOutlined />
    </button>

    <!-- Share Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isOpen"
          class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50"
          @click.self="close"
        >
          <div
            class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            @click.stop
          >
            <!-- Header -->
            <div class="flex items-center justify-between p-4 border-b">
              <h3 class="font-semibold text-gray-900">Share this place</h3>
              <button
                @click="close"
                class="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
              >
                <CloseOutlined />
              </button>
            </div>

            <!-- Share Platforms -->
            <div class="p-4">
              <div class="grid grid-cols-4 gap-3 mb-4">
                <button
                  v-for="platform in platforms"
                  :key="platform.name"
                  @click="openPlatform(platform.url)"
                  class="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div
                    class="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl"
                    :class="platform.color"
                  >
                    {{ platform.icon }}
                  </div>
                  <span class="text-xs text-gray-600">{{ platform.name }}</span>
                </button>
              </div>

              <!-- Copy Link -->
              <div class="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                <input
                  type="text"
                  :value="shareUrl"
                  readonly
                  class="flex-1 bg-transparent text-sm text-gray-600 outline-none truncate"
                />
                <button
                  @click="copyLink"
                  class="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <CheckOutlined v-if="copied" />
                  <LinkOutlined v-else />
                  {{ copied ? 'Copied!' : 'Copy' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
