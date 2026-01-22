<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { HeritageImage } from '@/types'
import {
  LeftOutlined,
  RightOutlined,
  CloseOutlined,
  ExpandOutlined,
  LinkOutlined,
} from '@ant-design/icons-vue'

const props = defineProps<{
  images: HeritageImage[]
  siteName: string
}>()

const lightboxOpen = ref(false)
const currentIndex = ref(0)
const isImageLoading = ref(true)
const touchStartX = ref(0)
const touchEndX = ref(0)

const currentImage = computed(() => props.images[currentIndex.value])

const hasMultipleImages = computed(() => props.images.length > 1)

// Track Unsplash downloads for API compliance
async function trackUnsplashDownload(image: HeritageImage) {
  if (image.source !== 'unsplash' || !image.sourceUrl) return
  try {
    // Extract Unsplash photo ID from sourceUrl (e.g., https://unsplash.com/photos/description-slug-PHOTOID)
    const pathSegment = image.sourceUrl.split('/photos/')[1]?.split(/[?#]/)[0]
    const photoId = pathSegment?.split('-').pop()
    if (!photoId) return
    await fetch(`/api/unsplash-track?id=${photoId}`)
  } catch (e) {
    console.warn('Unsplash tracking failed:', e)
  }
}

function openLightbox(index: number) {
  currentIndex.value = index
  lightboxOpen.value = true
  isImageLoading.value = true
  document.body.style.overflow = 'hidden'

  // Track Unsplash download when lightbox opens
  const image = props.images[index]
  if (image) {
    trackUnsplashDownload(image)
  }
}

function closeLightbox() {
  lightboxOpen.value = false
  document.body.style.overflow = ''
}

function nextImage() {
  if (currentIndex.value < props.images.length - 1) {
    currentIndex.value++
    isImageLoading.value = true
  }
}

function prevImage() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    isImageLoading.value = true
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (!lightboxOpen.value) return

  switch (e.key) {
    case 'Escape':
      closeLightbox()
      break
    case 'ArrowLeft':
      prevImage()
      break
    case 'ArrowRight':
      nextImage()
      break
  }
}

function handleTouchStart(e: TouchEvent) {
  touchStartX.value = e.touches[0].clientX
}

function handleTouchMove(e: TouchEvent) {
  touchEndX.value = e.touches[0].clientX
}

function handleTouchEnd() {
  const diff = touchStartX.value - touchEndX.value
  const threshold = 50

  if (Math.abs(diff) > threshold) {
    if (diff > 0) {
      nextImage()
    } else {
      prevImage()
    }
  }
}

function onImageLoad() {
  isImageLoading.value = false
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})

// Reset loading state and track downloads when image changes
watch(currentIndex, (newIndex, oldIndex) => {
  isImageLoading.value = true
  // Track download when navigating to new image in lightbox
  if (lightboxOpen.value && newIndex !== oldIndex) {
    const image = props.images[newIndex]
    if (image) {
      trackUnsplashDownload(image)
    }
  }
})
</script>

<template>
  <div v-if="images.length > 0">
    <!-- Gallery Grid -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      <!-- Primary Image (larger) -->
      <div
        v-if="images[0]"
        class="col-span-2 row-span-2 relative cursor-pointer group overflow-hidden rounded-xl"
        @click="openLightbox(0)"
      >
        <img
          :src="images[0].imageUrl"
          :alt="images[0].altText || siteName"
          class="w-full h-full object-cover aspect-square md:aspect-[4/3] group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <ExpandOutlined class="text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <!-- Primary badge -->
        <div
          v-if="images[0].isPrimary"
          class="absolute top-2 left-2 px-2 py-1 bg-white/90 rounded-full text-xs font-medium text-gray-700"
        >
          Primary
        </div>
      </div>

      <!-- Secondary Images -->
      <div
        v-for="(image, index) in images.slice(1, 5)"
        :key="image.id"
        class="relative cursor-pointer group overflow-hidden rounded-xl aspect-square"
        @click="openLightbox(index + 1)"
      >
        <img
          :src="image.thumbnailUrl || image.imageUrl"
          :alt="image.altText || `${siteName} - Image ${index + 2}`"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <ExpandOutlined class="text-white text-xl opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <!-- Show remaining count on last visible image -->
        <div
          v-if="index === 3 && images.length > 5"
          class="absolute inset-0 bg-black/60 flex items-center justify-center"
        >
          <span class="text-white text-xl font-semibold">
            +{{ images.length - 5 }}
          </span>
        </div>
      </div>
    </div>

    <!-- View All Button -->
    <button
      v-if="images.length > 5"
      @click="openLightbox(0)"
      class="mt-3 w-full py-2 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
    >
      View all {{ images.length }} photos
    </button>

    <!-- Lightbox Modal -->
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
          v-if="lightboxOpen"
          class="fixed inset-0 z-50 bg-black/95 flex flex-col"
          @click.self="closeLightbox"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
        >
          <!-- Header -->
          <div class="flex items-center justify-between p-4 text-white">
            <div class="flex items-center gap-3">
              <span class="text-sm font-medium">
                {{ currentIndex + 1 }} / {{ images.length }}
              </span>
              <span class="text-sm text-gray-400">
                {{ siteName }}
              </span>
            </div>
            <button
              @click="closeLightbox"
              class="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <CloseOutlined class="text-xl" />
            </button>
          </div>

          <!-- Image Container -->
          <div class="flex-1 flex items-center justify-center relative px-4">
            <!-- Previous Button -->
            <button
              v-if="hasMultipleImages && currentIndex > 0"
              @click="prevImage"
              class="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
            >
              <LeftOutlined class="text-white text-xl" />
            </button>

            <!-- Image -->
            <div class="relative max-w-full max-h-[calc(100vh-200px)]">
              <!-- Loading spinner -->
              <div
                v-if="isImageLoading"
                class="absolute inset-0 flex items-center justify-center"
              >
                <div class="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>

              <img
                v-if="currentImage"
                :src="currentImage.imageUrl"
                :alt="currentImage.altText"
                class="max-w-full max-h-[calc(100vh-200px)] object-contain"
                :class="{ 'opacity-0': isImageLoading }"
                @load="onImageLoad"
              />
            </div>

            <!-- Next Button -->
            <button
              v-if="hasMultipleImages && currentIndex < images.length - 1"
              @click="nextImage"
              class="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
            >
              <RightOutlined class="text-white text-xl" />
            </button>
          </div>

          <!-- Caption & Attribution -->
          <div class="p-4 text-white text-center">
            <p v-if="currentImage?.caption" class="text-sm mb-2">
              {{ currentImage.caption }}
            </p>
            <!-- Attribution: Unsplash requires format "Photo by [Name] on [Unsplash]" with both linked -->
            <div
              v-if="currentImage?.photographer"
              class="text-xs text-gray-400 flex items-center justify-center gap-1"
            >
              <span>Photo by</span>
              <a
                v-if="currentImage.photographerUrl"
                :href="currentImage.photographerUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:text-white transition-colors underline"
                @click.stop
              >
                {{ currentImage.photographer }}
              </a>
              <span v-else>{{ currentImage.photographer }}</span>
              <template v-if="currentImage.source === 'unsplash'">
                <span>on</span>
                <a
                  href="https://unsplash.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="hover:text-white transition-colors underline"
                  @click.stop
                >
                  Unsplash
                </a>
              </template>
              <template v-else-if="currentImage.sourceUrl">
                <span>·</span>
                <a
                  :href="currentImage.sourceUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1 hover:text-white transition-colors"
                  @click.stop
                >
                  <LinkOutlined />
                  <span v-if="currentImage.source === 'wikimedia'">Wikimedia</span>
                  <span v-else>Source</span>
                </a>
              </template>
            </div>
          </div>

          <!-- Thumbnail Strip -->
          <div
            v-if="hasMultipleImages"
            class="px-4 pb-4 overflow-x-auto"
          >
            <div class="flex gap-2 justify-center">
              <button
                v-for="(image, index) in images"
                :key="image.id"
                @click="currentIndex = index"
                class="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all"
                :class="index === currentIndex ? 'border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-75'"
              >
                <img
                  :src="image.thumbnailUrl || image.imageUrl"
                  :alt="image.altText"
                  class="w-full h-full object-cover"
                />
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>

  <!-- Empty State -->
  <div
    v-else
    class="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-xl"
  >
    <span class="text-4xl mb-3">📷</span>
    <p class="text-gray-500 text-sm">No photos available yet</p>
  </div>
</template>
