<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@stores/userStore'
import { useCountryStore } from '@stores/countryStore'
import { useMatcher } from '@/composables/useMatcher'
import { useApi } from '@/composables/useApi'
import {
  FireOutlined,
  LockOutlined,
  CrownFilled,
  HeartOutlined,
  HeartFilled,
  RightOutlined,
  FilterOutlined,
  LoadingOutlined,
  EnvironmentOutlined,
  StarFilled,
  PlusOutlined,
} from '@ant-design/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const countryStore = useCountryStore()
const { calculateLocalScore, getMatchReason, sortedByMatch, hasProfile } = useMatcher()
const { get, post, del } = useApi()

const isPro = computed(() => userStore.isPro)
const loading = ref(true)
const savingFavorite = ref<string | null>(null)

// Filters
const minScore = ref(0)
const selectedCategory = ref<string>('')
const showHiddenGems = ref(false)
const showFavoritesOnly = ref(false)

const categories = [
  { value: '', label: 'All Categories' },
  { value: 'beach', label: 'Beaches' },
  { value: 'culture', label: 'Culture' },
  { value: 'nature', label: 'Nature' },
  { value: 'nightlife', label: 'Nightlife' },
  { value: 'island', label: 'Islands' },
  { value: 'foodie', label: 'Food' },
  { value: 'wellness', label: 'Wellness' },
  { value: 'adventure', label: 'Adventure' },
]

// Favorites stored as Set of slugs (synced with DB)
const favorites = ref<Set<string>>(new Set())

async function loadFavorites() {
  if (!isPro.value) return
  const result = await get<{ slugs: string[] }>('/matches')
  if (result?.slugs) {
    favorites.value = new Set(result.slugs)
  }
}

onMounted(async () => {
  const promises: Promise<unknown>[] = []

  if (!countryStore.attractions.length) {
    promises.push(countryStore.fetchAttractions())
  }

  if (isPro.value) {
    promises.push(loadFavorites())
  }

  await Promise.all(promises)
  loading.value = false
})

// Filtered and sorted matches
const filteredMatches = computed(() => {
  let matches = sortedByMatch.value.map((attraction) => ({
    attraction,
    score: calculateLocalScore(attraction),
    reason: getMatchReason(attraction),
  }))

  // Apply filters
  if (minScore.value > 0) {
    matches = matches.filter((m) => m.score >= minScore.value)
  }

  if (selectedCategory.value) {
    matches = matches.filter((m) => m.attraction.category === selectedCategory.value)
  }

  if (showHiddenGems.value) {
    matches = matches.filter((m) => m.attraction.isHiddenGem)
  }

  if (showFavoritesOnly.value) {
    matches = matches.filter((m) => favorites.value.has(m.attraction.slug))
  }

  return matches
})

// Top matches for the hero section
const topMatches = computed(() => filteredMatches.value.slice(0, 3))

// Grouped by score tier
const perfectMatches = computed(() => filteredMatches.value.filter((m) => m.score >= 85))
const greatMatches = computed(() => filteredMatches.value.filter((m) => m.score >= 70 && m.score < 85))
const goodMatches = computed(() => filteredMatches.value.filter((m) => m.score >= 50 && m.score < 70))

// Favorites count for display
const favoritesCount = computed(() => favorites.value.size)

async function toggleFavorite(slug: string, score?: number, reason?: string) {
  if (savingFavorite.value) return
  savingFavorite.value = slug

  try {
    if (favorites.value.has(slug)) {
      await del('/matches', { slug })
      favorites.value.delete(slug)
      // Trigger reactivity
      favorites.value = new Set(favorites.value)
    } else {
      await post('/matches', {
        slug,
        matchScore: score,
        matchReason: reason,
      })
      favorites.value.add(slug)
      // Trigger reactivity
      favorites.value = new Set(favorites.value)
    }
  } finally {
    savingFavorite.value = null
  }
}

function isFavorite(slug: string) {
  return favorites.value.has(slug)
}

function goToAttraction(slug: string) {
  router.push(`/attractions/${slug}`)
}

function getScoreColor(score: number) {
  if (score >= 85) return 'from-green-500 to-emerald-600'
  if (score >= 70) return 'from-blue-500 to-indigo-600'
  if (score >= 50) return 'from-amber-500 to-orange-600'
  return 'from-gray-400 to-gray-500'
}

function getScoreBgColor(score: number) {
  if (score >= 85) return 'bg-green-100 text-green-700'
  if (score >= 70) return 'bg-blue-100 text-blue-700'
  if (score >= 50) return 'bg-amber-100 text-amber-700'
  return 'bg-gray-100 text-gray-600'
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-50 to-white">
    <!-- Header -->
    <div class="bg-white border-b border-gray-100">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg">
            <FireOutlined class="text-2xl" />
          </div>
          <div>
            <h1 class="text-2xl font-display font-bold text-gray-900">
              Smart Match
            </h1>
            <p class="text-gray-500">
              Places perfectly matched to your travel style
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <!-- Pro Gate -->
      <div v-if="!isPro" class="card-thai text-center py-12">
        <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-pink-100 to-rose-200 flex items-center justify-center">
          <LockOutlined class="text-3xl text-rose-600" />
        </div>
        <h2 class="text-2xl font-display font-bold text-gray-900 mb-3">
          Find Your Perfect Matches
        </h2>
        <p class="text-gray-600 max-w-md mx-auto mb-6">
          Get AI-powered recommendations based on your travel profile. See match scores, reasons why places fit you, and discover hidden gems.
        </p>

        <div class="grid sm:grid-cols-3 gap-4 max-w-xl mx-auto mb-8">
          <div class="p-4 rounded-xl bg-gray-50">
            <span class="text-2xl block mb-2">💯</span>
            <span class="text-sm font-medium text-gray-700">Match Scores</span>
          </div>
          <div class="p-4 rounded-xl bg-gray-50">
            <span class="text-2xl block mb-2">💎</span>
            <span class="text-sm font-medium text-gray-700">Hidden Gems</span>
          </div>
          <div class="p-4 rounded-xl bg-gray-50">
            <span class="text-2xl block mb-2">🎯</span>
            <span class="text-sm font-medium text-gray-700">Personalized</span>
          </div>
        </div>

        <RouterLink
          to="/dashboard#pro"
          class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          <CrownFilled />
          Upgrade to Pro - $10/mo
        </RouterLink>
      </div>

      <!-- Profile Required -->
      <div v-else-if="!hasProfile" class="card-thai text-center py-12">
        <span class="text-5xl block mb-4">👤</span>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Complete Your Profile</h3>
        <p class="text-gray-500 mb-6">Tell us about your travel preferences to get personalized matches.</p>
        <RouterLink to="/profile" class="btn-thai">
          Setup Profile
          <RightOutlined />
        </RouterLink>
      </div>

      <!-- Loading -->
      <div v-else-if="loading" class="text-center py-12">
        <LoadingOutlined class="text-4xl text-pink-500 animate-spin" />
        <p class="text-gray-500 mt-4">Finding your perfect matches...</p>
      </div>

      <!-- Matches Content -->
      <div v-else class="space-y-8">
        <!-- Top Matches Hero -->
        <div v-if="topMatches.length > 0" class="card-thai bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200 overflow-hidden">
          <div class="flex items-center gap-2 mb-6">
            <StarFilled class="text-pink-500" />
            <h2 class="text-lg font-bold text-gray-900">Your Top Matches</h2>
          </div>

          <div class="grid sm:grid-cols-3 gap-4">
            <div
              v-for="(match, index) in topMatches"
              :key="match.attraction.slug"
              @click="goToAttraction(match.attraction.slug)"
              class="relative bg-white rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all group"
            >
              <!-- Rank Badge -->
              <div
                :class="[
                  'absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg',
                  index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' :
                  index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                  'bg-gradient-to-br from-amber-600 to-amber-700'
                ]"
              >
                {{ index + 1 }}
              </div>

              <!-- Score -->
              <div class="flex justify-end mb-2">
                <span
                  :class="[
                    'px-3 py-1 rounded-full text-sm font-bold',
                    getScoreBgColor(match.score)
                  ]"
                >
                  {{ match.score }}%
                </span>
              </div>

              <h3 class="font-semibold text-gray-900 group-hover:text-pink-600 transition-colors mb-1">
                {{ match.attraction.name }}
              </h3>
              <p class="text-xs text-gray-500 flex items-center gap-1 mb-2">
                <EnvironmentOutlined />
                {{ match.attraction.province }}
              </p>
              <p v-if="match.reason" class="text-xs text-pink-600 font-medium">
                {{ match.reason }}
              </p>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center gap-2">
            <FilterOutlined class="text-gray-400" />
            <span class="text-sm text-gray-600">Filter:</span>
          </div>

          <select v-model="selectedCategory" class="input-thai text-sm py-2 px-3">
            <option v-for="cat in categories" :key="cat.value" :value="cat.value">
              {{ cat.label }}
            </option>
          </select>

          <select v-model="minScore" class="input-thai text-sm py-2 px-3">
            <option :value="0">Any match %</option>
            <option :value="50">50%+ matches</option>
            <option :value="70">70%+ matches</option>
            <option :value="85">85%+ matches</option>
          </select>

          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="showHiddenGems"
              type="checkbox"
              class="w-4 h-4 rounded border-gray-300 text-pink-500 focus:ring-pink-500"
            />
            <span class="text-sm text-gray-600">Hidden gems only</span>
          </label>

          <button
            @click="showFavoritesOnly = !showFavoritesOnly"
            :class="[
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all',
              showFavoritesOnly
                ? 'bg-red-100 text-red-700 ring-2 ring-red-500'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            ]"
          >
            <HeartFilled v-if="showFavoritesOnly" class="text-red-500" />
            <HeartOutlined v-else />
            Saved ({{ favoritesCount }})
          </button>
        </div>

        <!-- Results Stats -->
        <div class="flex items-center justify-between">
          <p class="text-sm text-gray-500">
            {{ filteredMatches.length }} places match your profile
          </p>
          <div class="flex items-center gap-4 text-xs text-gray-400">
            <span class="flex items-center gap-1">
              <span class="w-3 h-3 rounded-full bg-green-500"></span>
              Perfect (85%+)
            </span>
            <span class="flex items-center gap-1">
              <span class="w-3 h-3 rounded-full bg-blue-500"></span>
              Great (70-84%)
            </span>
            <span class="flex items-center gap-1">
              <span class="w-3 h-3 rounded-full bg-amber-500"></span>
              Good (50-69%)
            </span>
          </div>
        </div>

        <!-- Perfect Matches Section -->
        <div v-if="perfectMatches.length > 0">
          <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-green-500"></span>
            Perfect Matches
            <span class="text-sm font-normal text-gray-400">({{ perfectMatches.length }})</span>
          </h3>
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="match in perfectMatches"
              :key="match.attraction.slug"
              @click="goToAttraction(match.attraction.slug)"
              class="card-thai cursor-pointer hover:shadow-lg transition-all group relative"
            >
              <button
                @click.stop="toggleFavorite(match.attraction.slug, match.score, match.reason)"
                :disabled="savingFavorite === match.attraction.slug"
                class="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white transition-colors disabled:opacity-50"
              >
                <LoadingOutlined v-if="savingFavorite === match.attraction.slug" class="text-gray-400 animate-spin" />
                <HeartFilled v-else-if="isFavorite(match.attraction.slug)" class="text-red-500" />
                <HeartOutlined v-else class="text-gray-400" />
              </button>

              <div class="flex items-start justify-between mb-3">
                <div
                  :class="[
                    'px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r text-white',
                    getScoreColor(match.score)
                  ]"
                >
                  {{ match.score }}% match
                </div>
                <span v-if="match.attraction.isHiddenGem" class="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                  💎 Hidden Gem
                </span>
              </div>

              <h4 class="font-semibold text-gray-900 group-hover:text-pink-600 transition-colors mb-1">
                {{ match.attraction.name }}
              </h4>
              <p class="text-sm text-gray-500 flex items-center gap-1 mb-2">
                <EnvironmentOutlined />
                {{ match.attraction.province }}
              </p>
              <p v-if="match.reason" class="text-sm text-green-600 font-medium">
                {{ match.reason }}
              </p>
            </div>
          </div>
        </div>

        <!-- Great Matches Section -->
        <div v-if="greatMatches.length > 0">
          <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-blue-500"></span>
            Great Matches
            <span class="text-sm font-normal text-gray-400">({{ greatMatches.length }})</span>
          </h3>
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="match in greatMatches"
              :key="match.attraction.slug"
              @click="goToAttraction(match.attraction.slug)"
              class="card-thai cursor-pointer hover:shadow-lg transition-all group relative"
            >
              <button
                @click.stop="toggleFavorite(match.attraction.slug, match.score, match.reason)"
                :disabled="savingFavorite === match.attraction.slug"
                class="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white transition-colors disabled:opacity-50"
              >
                <LoadingOutlined v-if="savingFavorite === match.attraction.slug" class="text-gray-400 animate-spin" />
                <HeartFilled v-else-if="isFavorite(match.attraction.slug)" class="text-red-500" />
                <HeartOutlined v-else class="text-gray-400" />
              </button>

              <div class="flex items-start justify-between mb-3">
                <div :class="['px-3 py-1 rounded-full text-sm font-bold', getScoreBgColor(match.score)]">
                  {{ match.score }}% match
                </div>
                <span v-if="match.attraction.isHiddenGem" class="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full mr-10">
                  💎
                </span>
              </div>

              <h4 class="font-semibold text-gray-900 group-hover:text-pink-600 transition-colors mb-1">
                {{ match.attraction.name }}
              </h4>
              <p class="text-sm text-gray-500 mb-2">{{ match.attraction.province }}</p>
              <p v-if="match.reason" class="text-sm text-blue-600">{{ match.reason }}</p>
            </div>
          </div>
        </div>

        <!-- Good Matches Section -->
        <div v-if="goodMatches.length > 0">
          <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-amber-500"></span>
            Good Matches
            <span class="text-sm font-normal text-gray-400">({{ goodMatches.length }})</span>
          </h3>
          <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div
              v-for="match in goodMatches"
              :key="match.attraction.slug"
              @click="goToAttraction(match.attraction.slug)"
              class="p-4 bg-white rounded-xl border border-gray-100 cursor-pointer hover:shadow-md transition-all group"
            >
              <div class="flex items-center justify-between mb-2">
                <span :class="['text-sm font-medium', getScoreBgColor(match.score).split(' ')[1]]">
                  {{ match.score }}%
                </span>
                <span v-if="match.attraction.isHiddenGem">💎</span>
              </div>
              <h4 class="font-medium text-gray-900 group-hover:text-pink-600 transition-colors text-sm">
                {{ match.attraction.name }}
              </h4>
              <p class="text-xs text-gray-400">{{ match.attraction.province }}</p>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredMatches.length === 0" class="card-thai text-center py-12">
          <span class="text-5xl block mb-4">🔍</span>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">No matches found</h3>
          <p class="text-gray-500">Try adjusting your filters or updating your profile.</p>
        </div>
      </div>
    </div>
  </div>
</template>
