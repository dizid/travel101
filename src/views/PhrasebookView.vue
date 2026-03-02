<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { phrases, CATEGORY_CONFIG } from '@/data/phrases'
import type { ThaiPhrase, PhraseCategory } from '@/data/phrases'
import BreadcrumbNav from '@components/ui/BreadcrumbNav.vue'
import {
  generateBreadcrumbSchema,
  injectStructuredData,
  removeStructuredData,
  updateMetaTags,
} from '@/utils/seo'

// ------------------------------------------------------------------
// State
// ------------------------------------------------------------------
const activeCategory = ref<PhraseCategory | 'all'>('all')
const searchQuery = ref('')
const showLocalPhrase = ref<ThaiPhrase | null>(null)
const copiedId = ref<number | null>(null)

// ------------------------------------------------------------------
// Categories list: ['all', ...CATEGORY_CONFIG keys]
// ------------------------------------------------------------------
const categories = computed(() => {
  const entries = Object.entries(CATEGORY_CONFIG) as [PhraseCategory, typeof CATEGORY_CONFIG[PhraseCategory]][]
  return [
    { key: 'all' as const, label: 'All', icon: '🌏', description: 'All phrases', count: phrases.length },
    ...entries.map(([key, config]) => ({
      key,
      label: config.label,
      icon: config.icon,
      description: config.description,
      count: phrases.filter(p => p.category === key).length,
    })),
  ]
})

// ------------------------------------------------------------------
// Filtered phrases — by category then search query
// ------------------------------------------------------------------
const filteredPhrases = computed(() => {
  let result = activeCategory.value === 'all'
    ? phrases
    : phrases.filter(p => p.category === activeCategory.value)

  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    result = result.filter(p =>
      p.english.toLowerCase().includes(q) ||
      p.thai.includes(q) ||
      p.phonetic.toLowerCase().includes(q)
    )
  }

  return result
})

// ------------------------------------------------------------------
// Clipboard
// ------------------------------------------------------------------
function copyToClipboard(phrase: ThaiPhrase): void {
  navigator.clipboard.writeText(phrase.thai).then(() => {
    copiedId.value = phrase.id
    setTimeout(() => {
      copiedId.value = null
    }, 2000)
  }).catch(() => {
    // Fallback for older browsers / insecure contexts
    const el = document.createElement('textarea')
    el.value = phrase.thai
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    copiedId.value = phrase.id
    setTimeout(() => {
      copiedId.value = null
    }, 2000)
  })
}

// ------------------------------------------------------------------
// Show-to-local overlay
// ------------------------------------------------------------------
function openOverlay(phrase: ThaiPhrase): void {
  showLocalPhrase.value = phrase
  document.body.style.overflow = 'hidden'
}

function closeOverlay(): void {
  showLocalPhrase.value = null
  document.body.style.overflow = ''
}

// ------------------------------------------------------------------
// Keyboard: close overlay on Escape
// ------------------------------------------------------------------
function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') closeOverlay()
}

// ------------------------------------------------------------------
// Category tab helper
// ------------------------------------------------------------------
function selectCategory(key: PhraseCategory | 'all'): void {
  activeCategory.value = key
  searchQuery.value = ''
}

// ------------------------------------------------------------------
// Lifecycle
// ------------------------------------------------------------------
onMounted(() => {
  updateMetaTags({
    title: 'Thai Phrasebook — 210+ Essential Phrases',
    description: 'Learn 210+ essential Thai phrases for travel. Greetings, ordering food, bargaining, directions, and emergencies — with Thai script and phonetic pronunciation.',
    url: '/phrasebook',
  })

  injectStructuredData(
    'breadcrumb-schema',
    generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Thai Phrasebook', url: '/phrasebook' },
    ])
  )

  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  removeStructuredData('breadcrumb-schema')
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">

    <!-- ============================================================
         Hero
    ============================================================ -->
    <section class="relative bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 overflow-hidden">
      <!-- Decorative blobs -->
      <div class="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div class="absolute bottom-0 left-0 w-64 h-64 bg-accent-400/15 rounded-full blur-3xl pointer-events-none" />

      <div class="relative max-w-4xl mx-auto px-4 pt-14 pb-20 text-center">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur text-white/90 text-sm mb-5">
          <span>🇹🇭</span>
          <span>Essential Thai for travelers</span>
        </div>

        <h1 class="text-4xl md:text-5xl font-bold text-white mb-3">
          Thai Phrasebook
        </h1>
        <p class="text-lg text-white/80 max-w-xl mx-auto mb-8">
          210+ essential phrases for traveling in Thailand — with Thai script, phonetic pronunciation, and context tips
        </p>

        <!-- Search -->
        <div class="relative max-w-lg mx-auto">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">🔍</span>
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Search phrases in English, Thai, or phonetic..."
            class="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white shadow-lg text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
      </div>

      <!-- Wave divider -->
      <svg
        class="absolute bottom-0 w-full"
        viewBox="0 0 1440 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <path
          d="M0 48L60 44C120 40 240 32 360 29.3C480 26 600 29 720 30.7C840 32 960 32 1080 29.3C1200 26 1320 21 1380 18.7L1440 16V48H1380C1320 48 1200 48 1080 48C960 48 840 48 720 48C600 48 480 48 360 48C240 48 120 48 60 48H0Z"
          fill="#f9fafb"
        />
      </svg>
    </section>

    <!-- ============================================================
         Main content
    ============================================================ -->
    <div class="max-w-6xl mx-auto px-4 py-8">
      <!-- Breadcrumb -->
      <BreadcrumbNav
        :items="[
          { name: 'Home', url: '/' },
          { name: 'Thai Phrasebook' },
        ]"
      />

      <!-- ========================================================
           Category tabs
      ======================================================== -->
      <div class="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
        <button
          v-for="cat in categories"
          :key="cat.key"
          @click="selectCategory(cat.key)"
          class="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all"
          :class="activeCategory === cat.key
            ? 'bg-primary-500 text-white shadow-thai'
            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'"
        >
          <span>{{ cat.icon }}</span>
          <span>{{ cat.label }}</span>
          <span
            class="ml-0.5 text-xs px-1.5 py-0.5 rounded-full"
            :class="activeCategory === cat.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'"
          >
            {{ cat.count }}
          </span>
        </button>
      </div>

      <!-- Active category description -->
      <div
        v-if="activeCategory !== 'all'"
        class="mb-6 p-4 bg-primary-50 border border-primary-100 rounded-xl text-sm text-primary-700"
      >
        <span class="mr-2">{{ CATEGORY_CONFIG[activeCategory as PhraseCategory].icon }}</span>
        {{ CATEGORY_CONFIG[activeCategory as PhraseCategory].description }}
      </div>

      <!-- Results count -->
      <p class="text-sm text-gray-500 mb-5">
        Showing <span class="font-semibold text-gray-700">{{ filteredPhrases.length }}</span>
        {{ filteredPhrases.length === 1 ? 'phrase' : 'phrases' }}
        <template v-if="searchQuery.trim()">
          for "<span class="font-semibold text-gray-700">{{ searchQuery }}</span>"
        </template>
      </p>

      <!-- ========================================================
           No results
      ======================================================== -->
      <div
        v-if="filteredPhrases.length === 0"
        class="text-center py-20"
      >
        <p class="text-5xl mb-4">🤔</p>
        <p class="text-xl font-semibold text-gray-800 mb-2">No phrases found</p>
        <p class="text-gray-500 mb-6">Try different keywords or browse by category</p>
        <button
          @click="searchQuery = ''; activeCategory = 'all'"
          class="btn-thai-outline"
        >
          Clear search
        </button>
      </div>

      <!-- ========================================================
           Phrase grid
      ======================================================== -->
      <div
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <div
          v-for="phrase in filteredPhrases"
          :key="phrase.id"
          class="card-thai flex flex-col gap-3"
        >
          <!-- English -->
          <p class="font-semibold text-gray-900 leading-snug">
            {{ phrase.english }}
          </p>

          <!-- Thai script -->
          <p class="text-xl font-thai text-primary-700 leading-relaxed">
            {{ phrase.thai }}
          </p>

          <!-- Phonetic -->
          <p class="text-sm text-gray-500 italic">
            {{ phrase.phonetic }}
          </p>

          <!-- Context note -->
          <p
            v-if="phrase.context"
            class="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed border border-gray-100"
          >
            💡 {{ phrase.context }}
          </p>

          <!-- Actions -->
          <div class="flex gap-2 mt-auto pt-1">
            <!-- Copy button -->
            <button
              @click="copyToClipboard(phrase)"
              class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all border"
              :class="copiedId === phrase.id
                ? 'bg-green-50 border-green-200 text-green-600'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300'"
              title="Copy Thai text to clipboard"
            >
              <span v-if="copiedId === phrase.id">✓</span>
              <span v-else>📋</span>
              <span>{{ copiedId === phrase.id ? 'Copied!' : 'Copy' }}</span>
            </button>

            <!-- Show to local button -->
            <button
              @click="openOverlay(phrase)"
              class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium bg-primary-50 border border-primary-200 text-primary-700 hover:bg-primary-100 hover:border-primary-300 transition-all"
              title="Show this phrase to a local Thai speaker"
            >
              <span>📱</span>
              <span>Show</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ========================================================
           Footer tip
      ======================================================== -->
      <div class="mt-12 p-6 bg-amber-50 border border-amber-100 rounded-2xl text-center">
        <p class="text-2xl mb-2">🙏</p>
        <p class="font-semibold text-gray-800 mb-1">Pronunciation tip</p>
        <p class="text-sm text-gray-600 max-w-lg mx-auto">
          Thai is a tonal language with 5 tones. Even mispronounced, Thais appreciate the effort.
          Add <strong>krap</strong> (male) or <strong>ka</strong> (female) to the end of most phrases to sound polite.
        </p>
      </div>
    </div>

    <!-- ==========================================================
         Show-to-local overlay
    ========================================================== -->
    <Teleport to="body">
      <Transition name="overlay-fade">
        <div
          v-if="showLocalPhrase"
          class="fixed inset-0 z-50 bg-black/92 flex flex-col items-center justify-center px-6 cursor-pointer select-none"
          @click="closeOverlay"
          role="dialog"
          aria-modal="true"
          :aria-label="`Show phrase: ${showLocalPhrase.english}`"
        >
          <!-- Thai script — very large -->
          <p class="font-thai text-white text-5xl sm:text-7xl md:text-8xl font-bold leading-tight text-center mb-8">
            {{ showLocalPhrase.thai }}
          </p>

          <!-- Phonetic -->
          <p class="text-white/60 text-lg sm:text-2xl italic mb-4 text-center">
            {{ showLocalPhrase.phonetic }}
          </p>

          <!-- English -->
          <p class="text-white/80 text-xl sm:text-2xl font-medium text-center mb-12">
            {{ showLocalPhrase.english }}
          </p>

          <!-- Context note in overlay -->
          <p
            v-if="showLocalPhrase.context"
            class="text-white/40 text-sm max-w-sm text-center mb-12"
          >
            {{ showLocalPhrase.context }}
          </p>

          <!-- Dismiss hint -->
          <p class="text-white/30 text-sm mt-auto pb-8">
            Tap anywhere or press Esc to close
          </p>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* Hide scrollbar on category tabs row while keeping scroll functionality */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Overlay transition */
.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.2s ease;
}
.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}
</style>
