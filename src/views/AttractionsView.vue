<script setup lang="ts">
import { ref, computed, onMounted, onServerPrefetch, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCountryStore } from '@stores/countryStore'
import { useUserStore } from '@stores/userStore'
import { useMatcher } from '@/composables/useMatcher'
import { useFestivals } from '@/composables/useFestivals'
import AttractionCard from '@components/features/AttractionCard.vue'
import AffiliateCard from '@components/common/AffiliateCard.vue'
import PersonalizationBar from '@components/ui/PersonalizationBar.vue'
import ProfileQuickEdit from '@components/features/ProfileQuickEdit.vue'
import type { AttractionCategory, UpcomingFestival } from '@/types'
import { SearchOutlined, StarFilled, LoadingOutlined, EnvironmentOutlined } from '@ant-design/icons-vue'
import BreadcrumbNav from '@components/ui/BreadcrumbNav.vue'
import SkeletonLoader from '@components/ui/SkeletonLoader.vue'
import { useBreadcrumbs, useRouteSeo } from '@/composables/useSeo'

const route = useRoute()
const router = useRouter()
const countryStore = useCountryStore()
const userStore = useUserStore()
const { calculateLocalScore, getMatchReason, sortedByMatch, hasProfile } = useMatcher()

// SEO
useRouteSeo('attractions')
useBreadcrumbs([
  { name: 'Home', url: '/' },
  { name: 'Places', url: '/attractions' },
])

const searchQuery = ref('')
const activeCategory = ref<AttractionCategory | 'all' | 'hidden'>('all')
const showHiddenOnly = ref(route.query.hidden === 'true')
const showPersonalized = ref(true)
const showSuggestions = ref(false)
const selectedSuggestionIndex = ref(-1)
const searchInputRef = ref<HTMLInputElement | null>(null)
const showQuickEdit = ref(false)

// Handle personalization toggle from bar
function handlePersonalizationToggle(value: boolean) {
  showPersonalized.value = value
}

// Handle edit click from bar
function handleEditClick() {
  showQuickEdit.value = true
}

// Festivals
const { fetchUpcoming, getFestivalEmoji, formatFestivalDate } = useFestivals()
const upcomingFestivals = ref<UpcomingFestival[]>([])

// SSG: pre-fetch attractions so list renders with real content
onServerPrefetch(async () => {
  if (!countryStore.attractionsLoaded) {
    await countryStore.fetchAttractions()
  }
})

// Client: fetch attractions on mount
onMounted(async () => {
  if (!countryStore.attractionsLoaded) {
    await countryStore.fetchAttractions({ personalized: hasProfile.value })
  }
  // Fetch upcoming festivals for sidebar (client-only)
  fetchUpcoming(60).then(festivals => {
    upcomingFestivals.value = festivals.slice(0, 3)
  })
})

// Re-fetch when user profile changes
watch(() => userStore.hasProfile, async (newHasProfile) => {
  if (newHasProfile) {
    await countryStore.fetchAttractions({ personalized: true })
  }
})

const categories: { value: AttractionCategory | 'all' | 'hidden'; label: string; icon: string }[] = [
  { value: 'all', label: 'All Places', icon: '🗺️' },
  { value: 'hidden', label: 'Hidden Gems', icon: '💎' },
  { value: 'beach', label: 'Beaches', icon: '🏖️' },
  { value: 'island', label: 'Islands', icon: '🏝️' },
  { value: 'culture', label: 'Culture', icon: '🏛️' },
  { value: 'nature', label: 'Nature', icon: '🌿' },
  { value: 'nightlife', label: 'Nightlife', icon: '🌙' },
  { value: 'foodie', label: 'Foodie', icon: '🍜' },
  { value: 'nomad', label: 'Nomad Hubs', icon: '💻' },
  { value: 'wellness', label: 'Wellness', icon: '🧘' },
  { value: 'adventure', label: 'Adventure', icon: '⛰️' },
]

// Search suggestions
interface Suggestion {
  type: 'place' | 'province' | 'category'
  label: string
  subLabel?: string
  icon: string
  slug?: string
  category?: AttractionCategory | 'all' | 'hidden'
}

const suggestions = computed<Suggestion[]>(() => {
  if (!searchQuery.value || searchQuery.value.length < 2) return []

  const query = searchQuery.value.toLowerCase()
  const results: Suggestion[] = []

  // Match attractions by name (limit to 5)
  const matchingPlaces = countryStore.attractions
    .filter(a => a.name?.toLowerCase().includes(query))
    .slice(0, 5)
    .map(a => ({
      type: 'place' as const,
      label: a.name,
      subLabel: a.province,
      icon: a.isHiddenGem ? '💎' : '📍',
      slug: a.slug,
    }))
  results.push(...matchingPlaces)

  // Match provinces (unique, limit to 3)
  const provinces = [...new Set(countryStore.attractions.map(a => a.province))]
  const matchingProvinces = provinces
    .filter(p => p?.toLowerCase().includes(query))
    .slice(0, 3)
    .map(p => ({
      type: 'province' as const,
      label: p,
      subLabel: `${countryStore.attractions.filter(a => a.province === p).length} places`,
      icon: '🗺️',
    }))
  results.push(...matchingProvinces)

  // Match categories (limit to 2)
  const matchingCategories = categories
    .filter(c => c.value !== 'all' && c.label.toLowerCase().includes(query))
    .slice(0, 2)
    .map(c => ({
      type: 'category' as const,
      label: c.label,
      subLabel: 'Category',
      icon: c.icon,
      category: c.value,
    }))
  results.push(...matchingCategories)

  return results.slice(0, 8) // Max 8 suggestions
})

// Keyboard navigation for suggestions
function handleKeydown(e: KeyboardEvent) {
  if (!showSuggestions.value || suggestions.value.length === 0) {
    if (e.key === 'ArrowDown' && suggestions.value.length > 0) {
      showSuggestions.value = true
      selectedSuggestionIndex.value = 0
      e.preventDefault()
    }
    return
  }

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      selectedSuggestionIndex.value = Math.min(
        selectedSuggestionIndex.value + 1,
        suggestions.value.length - 1
      )
      break
    case 'ArrowUp':
      e.preventDefault()
      selectedSuggestionIndex.value = Math.max(selectedSuggestionIndex.value - 1, -1)
      break
    case 'Enter':
      if (selectedSuggestionIndex.value >= 0) {
        e.preventDefault()
        selectSuggestion(suggestions.value[selectedSuggestionIndex.value])
      }
      break
    case 'Escape':
      showSuggestions.value = false
      selectedSuggestionIndex.value = -1
      break
  }
}

function selectSuggestion(suggestion: Suggestion) {
  if (suggestion.type === 'place' && suggestion.slug) {
    router.push(`/attractions/${suggestion.slug}`)
  } else if (suggestion.type === 'province') {
    searchQuery.value = suggestion.label
  } else if (suggestion.type === 'category' && suggestion.category) {
    setCategory(suggestion.category)
    searchQuery.value = ''
  }
  showSuggestions.value = false
  selectedSuggestionIndex.value = -1
}

function handleFocus() {
  if (searchQuery.value.length >= 2) {
    showSuggestions.value = true
  }
}

function handleBlur() {
  // Delay to allow click on suggestion
  setTimeout(() => {
    showSuggestions.value = false
    selectedSuggestionIndex.value = -1
  }, 200)
}

// Reset selection when query changes
watch(searchQuery, () => {
  selectedSuggestionIndex.value = -1
  if (searchQuery.value.length >= 2) {
    showSuggestions.value = true
  } else {
    showSuggestions.value = false
  }
})

const filteredAttractions = computed(() => {
  // Use personalized sorting if enabled and user has profile
  let results = (showPersonalized.value && hasProfile.value)
    ? sortedByMatch.value
    : countryStore.attractions

  // Filter by hidden gems
  if (activeCategory.value === 'hidden' || showHiddenOnly.value) {
    results = results.filter((a) => a.isHiddenGem)
  } else if (activeCategory.value !== 'all') {
    results = results.filter((a) => a.category === activeCategory.value)
  }

  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    results = results.filter(
      (a) =>
        a.name?.toLowerCase().includes(query) ||
        a.description?.toLowerCase().includes(query) ||
        a.province?.toLowerCase().includes(query)
    )
  }

  return results
})

async function setCategory(cat: typeof activeCategory.value) {
  activeCategory.value = cat
  if (cat === 'hidden') {
    showHiddenOnly.value = true
    await countryStore.fetchAttractions({ hiddenGemsOnly: true, personalized: hasProfile.value })
  } else if (cat === 'all') {
    showHiddenOnly.value = false
    await countryStore.fetchAttractions({ personalized: hasProfile.value })
  } else {
    showHiddenOnly.value = false
    await countryStore.fetchAttractions({ category: cat, personalized: hasProfile.value })
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-rose-50/30 to-white">
    <!-- Hero -->
    <div class="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 text-white h-64 md:h-80">
      <!-- Decorative blur blobs -->
      <div class="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      <div class="absolute bottom-0 left-0 w-64 h-64 bg-accent-400/20 rounded-full blur-3xl" />

      <!-- Content -->
      <div class="relative max-w-6xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center h-full text-center">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur rounded-full text-sm font-medium mb-4">
          🗺️ Explore Thailand
        </div>
        <h1 class="text-3xl md:text-5xl font-display font-bold mb-3">
          Explore Thailand
        </h1>
        <p class="text-white/90 max-w-xl mx-auto mb-2 text-base md:text-lg">
          From famous beaches to secret spots only locals know about.
        </p>
        <p class="text-white/70 text-sm">400+ destinations across 77 provinces</p>
      </div>

      <!-- Wave divider -->
      <div class="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full" preserveAspectRatio="none">
          <path d="M0 40L48 34.7C96 29.3 192 18.7 288 16C384 13.3 480 18.7 576 21.3C672 24 768 24 864 21.3C960 18.7 1056 13.3 1152 13.3C1248 13.3 1344 18.7 1392 21.3L1440 24V40H1392C1344 40 1248 40 1152 40C1056 40 960 40 864 40C768 40 672 40 576 40C480 40 384 40 288 40C192 40 96 40 48 40H0Z" fill="rgb(249 250 251)" />
        </svg>
      </div>
    </div>

    <!-- Search bar (below hero) -->
    <div class="bg-gray-50 border-b border-gray-100">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <!-- Search with autocomplete -->
        <div class="max-w-xl mx-auto">
          <div class="relative">
            <SearchOutlined class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              placeholder="Search places, provinces..."
              class="input-thai pl-11"
              autocomplete="off"
              @keydown="handleKeydown"
              @focus="handleFocus"
              @blur="handleBlur"
            />

            <!-- Suggestions dropdown -->
            <Transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="opacity-0 translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 translate-y-1"
            >
              <div
                v-if="showSuggestions && suggestions.length > 0"
                class="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50"
              >
                <ul class="py-2 max-h-80 overflow-y-auto">
                  <li
                    v-for="(suggestion, index) in suggestions"
                    :key="`${suggestion.type}-${suggestion.label}`"
                    @click="selectSuggestion(suggestion)"
                    @mouseenter="selectedSuggestionIndex = index"
                    class="px-4 py-2.5 cursor-pointer flex items-center gap-3 transition-colors"
                    :class="[
                      selectedSuggestionIndex === index
                        ? 'bg-primary-50 text-primary-700'
                        : 'hover:bg-gray-50'
                    ]"
                  >
                    <span class="text-lg flex-shrink-0">{{ suggestion.icon }}</span>
                    <div class="flex-1 min-w-0">
                      <div class="font-medium text-gray-900 truncate">{{ suggestion.label }}</div>
                      <div class="text-xs text-gray-500 flex items-center gap-1">
                        <EnvironmentOutlined v-if="suggestion.type === 'place'" class="text-[10px]" />
                        <span>{{ suggestion.subLabel }}</span>
                      </div>
                    </div>
                    <span
                      class="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                      :class="[
                        suggestion.type === 'place' ? 'bg-blue-100 text-blue-700' :
                        suggestion.type === 'province' ? 'bg-green-100 text-green-700' :
                        'bg-purple-100 text-purple-700'
                      ]"
                    >
                      {{ suggestion.type === 'place' ? 'Place' : suggestion.type === 'province' ? 'Province' : 'Category' }}
                    </span>
                  </li>
                </ul>
                <div class="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
                  <kbd class="px-1.5 py-0.5 bg-white rounded border border-gray-200 text-[10px]">↑↓</kbd> to navigate
                  <kbd class="px-1.5 py-0.5 bg-white rounded border border-gray-200 text-[10px] ml-2">Enter</kbd> to select
                  <kbd class="px-1.5 py-0.5 bg-white rounded border border-gray-200 text-[10px] ml-2">Esc</kbd> to close
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>

    <!-- Personalization Bar (sticky) -->
    <PersonalizationBar
      :is-enabled="showPersonalized"
      context="attractions"
      @toggle="handlePersonalizationToggle"
      @edit="handleEditClick"
    />

    <!-- Content -->
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <!-- Breadcrumb navigation -->
      <BreadcrumbNav :items="[{ name: 'Home', url: '/' }, { name: 'Places' }]" />

      <!-- Category filters -->
      <div class="flex flex-wrap gap-2 mb-8 overflow-x-auto pb-2">
        <button
          v-for="cat in categories"
          :key="cat.value"
          @click="setCategory(cat.value)"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap"
          :class="activeCategory === cat.value || (cat.value === 'hidden' && showHiddenOnly)
            ? 'bg-primary-100 text-primary-700 shadow-sm'
            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'"
        >
          <span>{{ cat.icon }}</span>
          {{ cat.label }}
        </button>
      </div>

      <!-- Hidden gems banner -->
      <div
        v-if="showHiddenOnly"
        class="mb-8 p-6 bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl"
      >
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-white shadow-soft flex items-center justify-center">
            <StarFilled class="text-primary-500 text-xl" />
          </div>
          <div>
            <h3 class="font-semibold text-gray-900">Hidden Gems</h3>
            <p class="text-sm text-gray-600">
              Off-the-beaten-path destinations that most tourists never discover.
              These are Thailand's best-kept secrets!
            </p>
          </div>
        </div>
      </div>

      <!-- Results count -->
      <p class="text-sm text-gray-500 mb-4">
        <LoadingOutlined v-if="countryStore.attractionsLoading" class="mr-2" />
        <template v-if="countryStore.attractionsTotal > filteredAttractions.length">
          Showing {{ filteredAttractions.length }} of {{ countryStore.attractionsTotal }} places
        </template>
        <template v-else>
          {{ filteredAttractions.length }} places found
        </template>
      </p>

      <!-- Main content with sidebar -->
      <div class="lg:flex lg:gap-8">
        <!-- Attractions grid -->
        <div class="flex-1">
          <div class="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <AttractionCard
              v-for="attraction in filteredAttractions"
              :key="attraction.id"
              :attraction="attraction"
              :show-match="showPersonalized && hasProfile"
              :match-score="calculateLocalScore(attraction)"
              :match-reason="getMatchReason(attraction)"
            />
            <!-- Mobile affiliate card: spans full grid width, hidden on desktop (sidebar handles it) -->
            <div
              v-if="filteredAttractions.length >= 6"
              class="col-span-full lg:hidden"
            >
              <AffiliateCard
                context="destination"
                destination="Thailand"
                title="Book Your Thailand Trip"
                :show-availability="true"
              />
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="hidden lg:block w-72 flex-shrink-0">
          <div class="sticky top-24 space-y-6">
            <AffiliateCard
              context="destination"
              destination="Thailand"
              title="Book Your Thailand Trip"
              :show-availability="true"
            />

            <!-- Quick stats -->
            <div class="card-thai">
              <h3 class="font-semibold text-gray-900 mb-3">Quick Facts</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">Total Places</span>
                  <span class="font-medium">{{ countryStore.attractions.length }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Hidden Gems</span>
                  <span class="font-medium">{{ countryStore.attractions.filter(a => a.isHiddenGem).length }}</span>
                </div>
              </div>
            </div>

            <!-- Upcoming Festivals -->
            <div v-if="upcomingFestivals.length > 0" class="card-thai">
              <h3 class="font-semibold text-gray-900 mb-3">Upcoming Festivals</h3>
              <div class="space-y-3">
                <div
                  v-for="festival in upcomingFestivals"
                  :key="festival.slug"
                  class="flex items-start gap-2"
                >
                  <span class="text-xl">{{ getFestivalEmoji(festival) }}</span>
                  <div class="text-sm">
                    <div class="font-medium text-gray-900">{{ festival.name }}</div>
                    <div class="text-gray-500">
                      {{ formatFestivalDate(festival.nextDate, festival.durationDays) }}
                      <span class="text-primary-600">
                        ({{ festival.daysUntil <= 7 ? `${festival.daysUntil}d` : `${Math.ceil(festival.daysUntil / 7)}w` }})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="filteredAttractions.length === 0 && !countryStore.attractionsLoading"
        class="text-center py-16"
      >
        <span class="text-5xl mb-4 block">🔍</span>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No places match your filters</h3>
        <p class="text-gray-500 mb-6">Try adjusting your filters or clearing them to see all destinations.</p>
        <button
          @click="() => { searchQuery = ''; setCategory('all') }"
          class="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors font-medium"
        >
          Clear Filters
        </button>
      </div>

      <!-- Loading state -->
      <div
        v-if="countryStore.attractionsLoading && filteredAttractions.length === 0"
        class="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        <SkeletonLoader variant="card" :count="6" />
      </div>
    </div>

    <!-- Profile Quick Edit Modal -->
    <ProfileQuickEdit
      :is-open="showQuickEdit"
      @close="showQuickEdit = false"
      @saved="showQuickEdit = false"
    />
  </div>
</template>
