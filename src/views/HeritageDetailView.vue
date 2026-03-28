<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi'
import { useWeather } from '@/composables/useWeather'
import { useFestivals } from '@/composables/useFestivals'
import { useLandmarkSchema, useBreadcrumbs } from '@/composables/useSeo'
import { updateMetaTags } from '@/utils/seo'
import type { LandmarkSchema } from '@/utils/seo'
import type { HeritageDetail, HeritageImage, HeritageEvent, HeritageMetadata, UpcomingFestival } from '@/types'
import HeritageGallery from '@/components/features/heritage/HeritageGallery.vue'
import HeritageTimeline from '@/components/features/heritage/HeritageTimeline.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import AffiliateButton from '@/components/common/AffiliateButton.vue'
import BreadcrumbNav from '@/components/ui/BreadcrumbNav.vue'
import {
  EnvironmentOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  HistoryOutlined,
  StarOutlined,
  ShareAltOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()
const { get } = useApi()

// State
const site = ref<HeritageDetail | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const activeTab = ref<'overview' | 'history' | 'tips' | 'nearby'>('overview')

// Weather
const { fetchWeather, weatherData, weatherIcon, currentTemp, rainChanceToday, uvLevel } = useWeather()

// Festivals
const { fetchByProvince, getFestivalEmoji, formatFestivalDate } = useFestivals()
const provinceFestivals = ref<UpcomingFestival[]>([])

// SEO: Landmark structured data
const landmarkSchema = computed<LandmarkSchema | null>(() => {
  if (!site.value) return null
  const s = site.value
  const meta = s.heritageMetadata || {}
  return {
    name: s.name,
    description: (s.description || '').slice(0, 300),
    address: s.province,
    province: s.province,
    slug: s.slug,
    isUNESCO: meta.unescoStatus === 'world_heritage_site',
    yearBuilt: meta.constructionDate ? parseInt(meta.constructionDate) || undefined : undefined,
  }
})
useLandmarkSchema(landmarkSchema)

// SEO: Breadcrumbs
useBreadcrumbs([
  { name: 'Home', url: '/' },
  { name: 'Heritage', url: '/heritage' },
])

// SEO: Update meta tags when site loads
watch(() => site.value, (s) => {
  if (s) {
    updateMetaTags({
      title: `${s.name} - ${s.province}`,
      description: (s.description || '').slice(0, 160),
      url: `/heritage/${s.slug}`,
      type: 'place',
    })
  }
}, { immediate: true })

// Computed
const metadata = computed<HeritageMetadata>(() => site.value?.heritageMetadata || {})
const images = computed<HeritageImage[]>(() => site.value?.images || [])
const timeline = computed<HeritageEvent[]>(() => site.value?.timeline || [])

const isUNESCO = computed(() => metadata.value?.unescoStatus === 'world_heritage_site')

const tabs = computed(() => [
  { key: 'overview', label: 'Overview', icon: InfoCircleOutlined },
  { key: 'history', label: 'History', icon: HistoryOutlined, count: timeline.value.length },
  { key: 'tips', label: 'Tips', icon: StarOutlined, count: site.value?.tips?.length || 0 },
  { key: 'nearby', label: 'Nearby', icon: EnvironmentOutlined, count: site.value?.recommendations?.length || 0 },
])

// Format entry fee display
const entryFeeDisplay = computed(() => {
  if (!metadata.value?.entryFeeForeignerTHB && !metadata.value?.entryFeeTHB) return null

  const parts = []
  if (metadata.value.entryFeeForeignerTHB) {
    parts.push(`฿${metadata.value.entryFeeForeignerTHB} foreigners`)
  }
  if (metadata.value.entryFeeTHB) {
    parts.push(`฿${metadata.value.entryFeeTHB} Thai nationals`)
  }
  return parts.join(' / ')
})

async function fetchSite() {
  const slug = route.params.slug as string
  loading.value = true
  error.value = null

  try {
    const response = await get<{ site: HeritageDetail }>(`/heritage/${slug}`)
    if (response) {
      site.value = response.site
    }
  } catch (err) {
    console.error('Failed to fetch heritage site:', err)
    error.value = 'Failed to load heritage site'
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/heritage')
}

function share() {
  if (navigator.share && site.value) {
    navigator.share({
      title: site.value.name,
      text: site.value.description,
      url: window.location.href,
    })
  }
}

// Fetch weather and festivals when site loads
watch(() => site.value?.province, async (province) => {
  if (province) {
    // Fetch weather for the province
    fetchWeather(province, 3)

    // Fetch upcoming festivals in this province
    const festivals = await fetchByProvince(province)
    const today = new Date()
    const year = today.getFullYear()
    provinceFestivals.value = festivals
      .filter((f) => {
        const dateStr = year === 2025 ? f.date2025 : f.date2026
        return dateStr && new Date(dateStr) >= today
      })
      .map((f) => {
        const dateStr = (year === 2025 ? f.date2025 : f.date2026)!
        return {
          ...f,
          nextDate: dateStr,
          daysUntil: Math.ceil((new Date(dateStr).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
        }
      })
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 2)
  }
}, { immediate: true })

onMounted(() => {
  fetchSite()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <LoadingSpinner size="lg" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex flex-col items-center justify-center min-h-screen p-4">
      <span class="text-6xl mb-6">😕</span>
      <h2 class="text-xl font-semibold text-gray-900 mb-2">Site not found</h2>
      <p class="text-gray-600 mb-6">{{ error }}</p>
      <button
        @click="goBack"
        class="px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
      >
        Back to Heritage Sites
      </button>
    </div>

    <!-- Content -->
    <template v-else-if="site">
      <!-- Gallery Section -->
      <div class="bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <!-- Breadcrumb navigation (shown once site data is loaded) -->
          <BreadcrumbNav
            v-if="site"
            :items="[
              { name: 'Home', url: '/' },
              { name: 'Heritage', url: '/heritage' },
              { name: site.name },
            ]"
            class="mb-2"
          />

          <!-- Back Button -->
          <button
            @click="goBack"
            class="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeftOutlined />
            <span>All Heritage Sites</span>
          </button>

          <!-- Gallery -->
          <HeritageGallery :images="images" :site-name="site.name" />
        </div>
      </div>

      <!-- Main Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Left Column - Main Content -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Header -->
            <div>
              <!-- Badges -->
              <div class="flex flex-wrap items-center gap-2 mb-3">
                <span
                  v-if="isUNESCO"
                  class="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-semibold"
                >
                  <span>🏆</span>
                  UNESCO World Heritage
                </span>
                <span
                  v-if="metadata.constructionEra"
                  class="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium"
                >
                  {{ metadata.constructionEra }}
                </span>
                <span
                  v-if="metadata.heritageType"
                  class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium capitalize"
                >
                  {{ metadata.heritageType.replace('_', ' ') }}
                </span>
              </div>

              <!-- Title -->
              <h1 class="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-2">
                {{ site.name }}
              </h1>

              <!-- Location -->
              <div class="flex items-center gap-4 text-gray-600">
                <span class="flex items-center gap-1">
                  <EnvironmentOutlined />
                  {{ site.province }}, Thailand
                </span>
                <button
                  @click="share"
                  class="flex items-center gap-1 hover:text-primary-600 transition-colors"
                >
                  <ShareAltOutlined />
                  Share
                </button>
              </div>
            </div>

            <!-- Quick Info Bar -->
            <div class="flex flex-wrap gap-4 p-4 bg-white rounded-xl shadow-sm">
              <div v-if="metadata.openingHours" class="flex items-center gap-2">
                <ClockCircleOutlined class="text-gray-400" />
                <span class="text-sm">{{ metadata.openingHours }}</span>
              </div>
              <div v-if="entryFeeDisplay" class="flex items-center gap-2">
                <DollarOutlined class="text-gray-400" />
                <span class="text-sm">{{ entryFeeDisplay }}</span>
              </div>
              <div v-if="metadata.dressCode" class="flex items-center gap-2">
                <InfoCircleOutlined class="text-gray-400" />
                <span class="text-sm">{{ metadata.dressCode }}</span>
              </div>
            </div>

            <!-- Tabs -->
            <div class="border-b border-gray-200">
              <nav class="flex gap-6">
                <button
                  v-for="tab in tabs"
                  :key="tab.key"
                  @click="activeTab = tab.key as any"
                  class="flex items-center gap-2 py-3 border-b-2 text-sm font-medium transition-colors"
                  :class="activeTab === tab.key
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'"
                >
                  <component :is="tab.icon" />
                  {{ tab.label }}
                  <span
                    v-if="tab.count"
                    class="px-1.5 py-0.5 bg-gray-100 rounded text-xs"
                  >
                    {{ tab.count }}
                  </span>
                </button>
              </nav>
            </div>

            <!-- Tab Content -->
            <div class="bg-white rounded-xl shadow-sm p-6">
              <!-- Overview Tab -->
              <div v-if="activeTab === 'overview'" class="space-y-6">
                <div>
                  <h2 class="text-lg font-semibold text-gray-900 mb-3">About</h2>
                  <p class="text-gray-600 leading-relaxed whitespace-pre-line">
                    {{ site.about || site.description }}
                  </p>
                </div>

                <div v-if="metadata.historicalSignificance">
                  <h3 class="text-lg font-semibold text-gray-900 mb-3">Historical Significance</h3>
                  <p class="text-gray-600 leading-relaxed">
                    {{ metadata.historicalSignificance }}
                  </p>
                </div>

                <div v-if="metadata.architecturalStyles?.length">
                  <h3 class="text-lg font-semibold text-gray-900 mb-3">Architectural Styles</h3>
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="style in metadata.architecturalStyles"
                      :key="style"
                      class="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm"
                    >
                      {{ style }}
                    </span>
                  </div>
                </div>

                <div v-if="metadata.religiousSignificance">
                  <h3 class="text-lg font-semibold text-gray-900 mb-3">Religious Significance</h3>
                  <p class="text-gray-600">{{ metadata.religiousSignificance }}</p>
                </div>

                <!-- Hotel booking CTA — mobile only (desktop sidebar has "Stay Nearby" card) -->
                <!-- Heritage visitors plan accommodation around specific sites — capture that intent -->
                <div class="lg:hidden pt-4 border-t border-amber-200">
                  <div class="flex items-start gap-3 p-3 rounded-xl border border-amber-200 bg-amber-50">
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-800 mb-2">Stay near {{ site.name }}</p>
                      <AffiliateButton
                        partner="agoda"
                        :destination="site.province"
                        :label="`Find Hotels near ${site.name}`"
                        variant="secondary"
                      />
                      <p class="text-xs text-gray-400 mt-2">Affiliate link</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- History Tab -->
              <div v-else-if="activeTab === 'history'">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">Historical Timeline</h2>
                <HeritageTimeline :events="timeline" />
              </div>

              <!-- Tips Tab -->
              <div v-else-if="activeTab === 'tips'" class="space-y-4">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">Visitor Tips</h2>

                <div v-if="site.tips && site.tips.length > 0" class="space-y-4">
                  <div
                    v-for="tip in site.tips"
                    :key="tip.id"
                    class="p-4 bg-gray-50 rounded-lg"
                  >
                    <div class="flex items-center gap-2 mb-2">
                      <span class="text-lg">
                        {{ tip.tipType === 'timing' ? '⏰' :
                           tip.tipType === 'transport' ? '🚗' :
                           tip.tipType === 'money_saving' ? '💰' :
                           tip.tipType === 'photography' ? '📷' :
                           tip.tipType === 'preparation' ? '📋' : '💡' }}
                      </span>
                      <h4 class="font-medium text-gray-900">{{ tip.title }}</h4>
                    </div>
                    <p class="text-gray-600 text-sm">{{ tip.content }}</p>
                  </div>
                </div>

                <div v-else class="text-center py-8 text-gray-500">
                  No tips available yet
                </div>
              </div>

              <!-- Nearby Tab -->
              <div v-else-if="activeTab === 'nearby'" class="space-y-4">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">Nearby Recommendations</h2>

                <div v-if="site.recommendations && site.recommendations.length > 0" class="space-y-4">
                  <div
                    v-for="rec in site.recommendations"
                    :key="rec.id"
                    class="p-4 bg-gray-50 rounded-lg"
                  >
                    <div class="flex items-start justify-between">
                      <div>
                        <div class="flex items-center gap-2 mb-1">
                          <span class="text-lg">
                            {{ rec.recType === 'restaurant' ? '🍽️' :
                               rec.recType === 'cafe' ? '☕' :
                               rec.recType === 'hotel' ? '🏨' :
                               rec.recType === 'activity' ? '🎯' : '📍' }}
                          </span>
                          <h4 class="font-medium text-gray-900">{{ rec.name }}</h4>
                          <span
                            v-if="rec.priceRange"
                            class="text-xs text-gray-500"
                          >
                            {{ rec.priceRange }}
                          </span>
                        </div>
                        <p class="text-gray-600 text-sm">{{ rec.description }}</p>
                        <p v-if="rec.whySpecial" class="text-primary-600 text-sm mt-1">
                          {{ rec.whySpecial }}
                        </p>
                      </div>
                      <a
                        v-if="rec.googleMapsUrl"
                        :href="rec.googleMapsUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="flex-shrink-0 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Maps
                      </a>
                    </div>
                  </div>
                </div>

                <div v-else class="text-center py-8 text-gray-500">
                  No nearby recommendations available yet
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column - Sidebar -->
          <div class="space-y-6">
            <!-- Quick Facts Card -->
            <div class="bg-white rounded-xl shadow-sm p-6">
              <h3 class="font-semibold text-gray-900 mb-4">Quick Facts</h3>

              <dl class="space-y-3">
                <div v-if="metadata.constructionDate">
                  <dt class="text-xs text-gray-500 uppercase tracking-wide">Built</dt>
                  <dd class="text-gray-900">{{ metadata.constructionDate }}</dd>
                </div>

                <div v-if="metadata.constructionEra">
                  <dt class="text-xs text-gray-500 uppercase tracking-wide">Era</dt>
                  <dd class="text-gray-900">{{ metadata.constructionEra }}</dd>
                </div>

                <div v-if="metadata.kingdomDynasty">
                  <dt class="text-xs text-gray-500 uppercase tracking-wide">Kingdom/Dynasty</dt>
                  <dd class="text-gray-900">{{ metadata.kingdomDynasty }}</dd>
                </div>

                <div v-if="isUNESCO && metadata.unescoInscriptionYear">
                  <dt class="text-xs text-gray-500 uppercase tracking-wide">UNESCO Inscription</dt>
                  <dd class="text-gray-900">{{ metadata.unescoInscriptionYear }}</dd>
                </div>

                <div v-if="metadata.unescoCriteria?.length">
                  <dt class="text-xs text-gray-500 uppercase tracking-wide">UNESCO Criteria</dt>
                  <dd class="text-gray-900">{{ metadata.unescoCriteria.join(', ') }}</dd>
                </div>

                <div v-if="metadata.openingHours">
                  <dt class="text-xs text-gray-500 uppercase tracking-wide">Opening Hours</dt>
                  <dd class="text-gray-900">{{ metadata.openingHours }}</dd>
                </div>

                <div v-if="entryFeeDisplay">
                  <dt class="text-xs text-gray-500 uppercase tracking-wide">Entry Fee</dt>
                  <dd class="text-gray-900">{{ entryFeeDisplay }}</dd>
                </div>

                <div v-if="metadata.dressCode">
                  <dt class="text-xs text-gray-500 uppercase tracking-wide">Dress Code</dt>
                  <dd class="text-gray-900">{{ metadata.dressCode }}</dd>
                </div>

                <div v-if="metadata.bestTimeToVisit">
                  <dt class="text-xs text-gray-500 uppercase tracking-wide">Best Time to Visit</dt>
                  <dd class="text-gray-900">{{ metadata.bestTimeToVisit }}</dd>
                </div>
              </dl>
            </div>

            <!-- Weather Card -->
            <div v-if="weatherData" class="bg-white rounded-xl shadow-sm p-6">
              <h3 class="font-semibold text-gray-900 mb-4">Current Weather</h3>
              <div class="flex items-center gap-4 mb-4">
                <span class="text-4xl">{{ weatherIcon }}</span>
                <div>
                  <div class="text-2xl font-bold text-gray-900">{{ currentTemp }}°C</div>
                  <div class="text-sm text-gray-600">{{ weatherData.current.condition }}</div>
                </div>
              </div>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">Rain chance</span>
                  <span :class="rainChanceToday > 50 ? 'text-blue-600 font-medium' : 'text-gray-900'">
                    {{ rainChanceToday }}%
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">UV Index</span>
                  <span :class="uvLevel.color">{{ uvLevel.level }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Humidity</span>
                  <span class="text-gray-900">{{ weatherData.current.humidity }}%</span>
                </div>
              </div>
              <div v-if="rainChanceToday > 40" class="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                💡 Bring an umbrella - rain is likely
              </div>
              <div v-else-if="uvLevel.level === 'Very High' || uvLevel.level === 'Extreme'" class="mt-4 p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
                ☀️ {{ uvLevel.advice }} - bring sunscreen
              </div>
            </div>

            <!-- Upcoming Festivals Card -->
            <div v-if="provinceFestivals.length > 0" class="bg-white rounded-xl shadow-sm p-6">
              <h3 class="font-semibold text-gray-900 mb-4">Upcoming Festivals</h3>
              <div class="space-y-3">
                <div
                  v-for="festival in provinceFestivals"
                  :key="festival.slug"
                  class="flex items-start gap-3"
                >
                  <span class="text-2xl">{{ getFestivalEmoji(festival) }}</span>
                  <div>
                    <div class="font-medium text-gray-900">{{ festival.name }}</div>
                    <div class="text-sm text-gray-500">
                      {{ formatFestivalDate(festival.nextDate, festival.durationDays) }}
                      <span class="text-primary-600 ml-1">
                        ({{ festival.daysUntil === 0 ? 'Today!' : festival.daysUntil === 1 ? 'Tomorrow!' : `in ${festival.daysUntil} days` }})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Book Tours Card -->
            <div v-if="site" class="bg-white rounded-xl shadow-sm p-6">
              <h3 class="font-semibold text-gray-900 mb-2">Book a Tour</h3>
              <p class="text-sm text-gray-500 mb-4">
                Explore {{ site.name }} with an expert local guide
              </p>
              <div class="space-y-2">
                <AffiliateButton partner="klook" :destination="site.province" :attraction-name="site.name" variant="primary" />
                <AffiliateButton partner="getyourguide" :destination="site.province" :attraction-name="site.name" variant="secondary" />
                <AffiliateButton partner="viator" :destination="site.province" :attraction-name="site.name" variant="secondary" />
              </div>
              <p class="text-xs text-gray-400 mt-3">Affiliate links</p>
            </div>

            <!-- Stay Nearby Card -->
            <div v-if="site" class="bg-white rounded-xl shadow-sm p-6">
              <h3 class="font-semibold text-gray-900 mb-2">Stay Nearby</h3>
              <p class="text-sm text-gray-500 mb-4">
                Find hotels near {{ site.name }}
              </p>
              <AffiliateButton partner="agoda" :destination="site.province" variant="primary" />
              <p class="text-xs text-gray-400 mt-3">Affiliate link</p>
            </div>

            <!-- Location Map Placeholder -->
            <div class="bg-white rounded-xl shadow-sm overflow-hidden">
              <div class="aspect-video bg-gray-100 flex items-center justify-center">
                <div class="text-center text-gray-400">
                  <EnvironmentOutlined class="text-3xl mb-2" />
                  <p class="text-sm">Map coming soon</p>
                </div>
              </div>
              <div class="p-4">
                <h4 class="font-medium text-gray-900">{{ site.name }}</h4>
                <p class="text-sm text-gray-600">{{ site.province }}, Thailand</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
