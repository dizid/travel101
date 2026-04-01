import { ref, computed } from 'vue'
import type {
  Festival,
  UpcomingFestival,
  FestivalType,
  FestivalRegion,
  FestivalFilters
} from '@/types'
import { getFestivalDistance, formatDistance as _formatDistance } from '@/data/thaiProvinces'

// Shared state across all composable instances
const upcomingFestivals = ref<UpcomingFestival[]>([])
const allFestivals = ref<Festival[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Cache for metadata endpoints (rarely change)
const metadataCache = {
  types: null as { type: string; count: number }[] | null,
  regions: null as { region: string; count: number }[] | null,
  typesPromise: null as Promise<{ type: string; count: number }[]> | null,
  regionsPromise: null as Promise<{ region: string; count: number }[]> | null,
}

// Generic fetch helper that handles loading state, errors, and response parsing
async function fetchApi<T>(
  url: string,
  options: {
    setLoading?: boolean
    errorMessage?: string
    extractKey?: string
    defaultValue: T
  }
): Promise<T> {
  const { setLoading = true, errorMessage = 'Request failed', extractKey, defaultValue } = options

  if (setLoading) {
    loading.value = true
    error.value = null
  }

  try {
    const response = await fetch(url)
    if (!response.ok) {
      if (response.status === 404) return defaultValue
      throw new Error(errorMessage)
    }

    const data = await response.json()
    return extractKey ? data[extractKey] : data
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Unknown error'
    if (!setLoading) console.error(errorMessage, e)
    return defaultValue
  } finally {
    if (setLoading) loading.value = false
  }
}

// Build URL with query parameters
function buildUrl(base: string, params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value))
    }
  }
  const queryString = searchParams.toString()
  return queryString ? `${base}?${queryString}` : base
}

export function useFestivals() {
  // Fetch upcoming festivals (within N days)
  async function fetchUpcoming(days = 60): Promise<UpcomingFestival[]> {
    const festivals = await fetchApi<UpcomingFestival[]>(
      buildUrl('/api/festivals/upcoming', { days }),
      { errorMessage: 'Failed to fetch upcoming festivals', extractKey: 'festivals', defaultValue: [] }
    )
    upcomingFestivals.value = festivals
    return festivals
  }

  // Fetch all festivals (or pre-fetched data during SSG)
  async function fetchAll(): Promise<Festival[]> {
    // During SSG: read from pre-fetched data
    if (import.meta.env.SSR) {
      const { getSSGFestivalList } = await import('@/lib/ssg-data')
      const list = getSSGFestivalList() as Festival[]
      allFestivals.value = list
      return list
    }

    const festivals = await fetchApi<Festival[]>(
      '/api/festivals',
      { errorMessage: 'Failed to fetch festivals', extractKey: 'festivals', defaultValue: [] }
    )
    allFestivals.value = festivals
    return festivals
  }

  // Fetch festivals with filters — SSG-aware
  async function fetchFiltered(filters: FestivalFilters): Promise<{ festivals: Festival[]; total: number; hasMore: boolean }> {
    // During SSG: return all festivals (no filtering needed for initial render)
    if (import.meta.env.SSR) {
      const { getSSGFestivalList } = await import('@/lib/ssg-data')
      const list = getSSGFestivalList() as Festival[]
      allFestivals.value = list
      return { festivals: list, total: list.length, hasMore: false }
    }

    const url = buildUrl('/api/festivals', {
      type: filters.type,
      region: filters.region,
      hidden: filters.hidden ? 'true' : undefined,
      month: filters.month,
      search: filters.search,
    })

    const data = await fetchApi<{ festivals: Festival[]; total?: number; count?: number; hasMore?: boolean }>(
      url,
      { errorMessage: 'Failed to fetch festivals', defaultValue: { festivals: [] } }
    )

    return {
      festivals: data.festivals || [],
      total: data.total || data.count || 0,
      hasMore: data.hasMore || false,
    }
  }

  // Fetch by single filter parameter
  async function fetchByFilter(filterKey: string, filterValue: string | number): Promise<Festival[]> {
    return fetchApi<Festival[]>(
      buildUrl('/api/festivals', { [filterKey]: filterValue }),
      { errorMessage: 'Failed to fetch festivals', extractKey: 'festivals', defaultValue: [] }
    )
  }

  // Convenience methods using fetchByFilter
  const fetchByMonth = (month: number) => fetchByFilter('month', month)
  const fetchByProvince = (province: string) => fetchByFilter('province', province)
  const fetchByType = (type: FestivalType) => fetchByFilter('type', type)
  const fetchByRegion = (region: FestivalRegion) => fetchByFilter('region', region)
  const fetchHiddenGems = () => fetchByFilter('hidden', 'true')

  // Fetch single festival by slug (or pre-fetched data during SSG)
  async function fetchBySlug(slug: string): Promise<UpcomingFestival | null> {
    // During SSG: read from pre-fetched data
    if (import.meta.env.SSR) {
      const { getSSGFestival } = await import('@/lib/ssg-data')
      return getSSGFestival(slug) as UpcomingFestival | null
    }

    return fetchApi<UpcomingFestival | null>(
      `/api/festivals/${encodeURIComponent(slug)}`,
      { errorMessage: 'Failed to fetch festival', defaultValue: null }
    )
  }

  // Search festivals
  async function searchFestivals(query: string): Promise<Festival[]> {
    if (!query.trim()) return []
    return fetchApi<Festival[]>(
      buildUrl('/api/festivals', { search: query }),
      { errorMessage: 'Failed to search festivals', extractKey: 'festivals', defaultValue: [] }
    )
  }

  // Fetch festival types with counts (cached)
  async function fetchTypes(): Promise<{ type: string; count: number }[]> {
    if (metadataCache.types) return metadataCache.types

    // Avoid duplicate requests
    if (!metadataCache.typesPromise) {
      metadataCache.typesPromise = fetchApi<{ type: string; count: number }[]>(
        '/api/festivals/types',
        { setLoading: false, errorMessage: 'Failed to fetch festival types', extractKey: 'types', defaultValue: [] }
      ).then(types => {
        metadataCache.types = types
        metadataCache.typesPromise = null
        return types
      })
    }

    return metadataCache.typesPromise
  }

  // Fetch regions with counts (cached)
  async function fetchRegions(): Promise<{ region: string; count: number }[]> {
    if (metadataCache.regions) return metadataCache.regions

    // Avoid duplicate requests
    if (!metadataCache.regionsPromise) {
      metadataCache.regionsPromise = fetchApi<{ region: string; count: number }[]>(
        '/api/festivals/regions',
        { setLoading: false, errorMessage: 'Failed to fetch regions', extractKey: 'regions', defaultValue: [] }
      ).then(regions => {
        metadataCache.regions = regions
        metadataCache.regionsPromise = null
        return regions
      })
    }

    return metadataCache.regionsPromise
  }

  // Next upcoming festival
  const nextFestival = computed(() => {
    if (upcomingFestivals.value.length === 0) return null
    return upcomingFestivals.value[0]
  })

  // Format date for display
  function formatFestivalDate(dateStr: string, durationDays = 1): string {
    const date = new Date(dateStr)
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }

    if (durationDays === 1) {
      return date.toLocaleDateString('en-US', options)
    }

    const endDate = new Date(date.getTime() + (durationDays - 1) * 24 * 60 * 60 * 1000)
    return `${date.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`
  }

  // Festival emoji lookup maps
  const FESTIVAL_EMOJI_MAP: Record<string, string> = {
    'songkran': '💦',
    'loy-krathong': '🪷',
    'yi-peng': '🏮',
    'chinese-new-year': '🐉',
    'vegetarian-festival': '🥬',
    'trang-vegetarian': '🥬',
    'ubon-candle-festival': '🕯️',
    'bun-bang-fai': '🚀',
    'phi-ta-khon': '👻',
    'naga-fireballs': '🔥',
    'buffalo-racing': '🐃',
    'surin-elephant-roundup': '🐘',
    'elephant-day': '🐘',
    'wonderfruit': '🎪',
    'full-moon-party': '🌕',
    'lopburi-monkey-festival': '🐒',
    'chiang-mai-flower-festival': '🌻',
    'saraburi-sunflowers': '🌻',
    'bo-sang-umbrella': '☂️',
    'pattaya-fireworks': '🎆',
    'bangkok-countdown': '🎉',
    'hua-hin-jazz': '🎷',
    'khon-kaen-silk-festival': '🧵',
    'lamphun-longan': '🍇',
    'tomorrowland-thailand': '🎶',
    '808-festival': '🎵',
    's2o-songkran': '💦',
    'pattaya-music-festival': '🎸',
    'lai-ruea-fai': '🛶',
    'chak-phra': '⛵',
    'phra-that-phanom': '🙏',
    'chiang-rai-flower-festival': '🌸',
    'samui-regatta': '⛵',
    'edc-thailand': '🎆',
  }

  const RELIGION_EMOJI_MAP: Record<string, string> = {
    'buddhist': '🙏',
    'taoist': '☯️',
    'hindu': '🕉️',
    'animist': '🌿',
  }

  const FESTIVAL_TYPE_COLORS: Record<string, string> = {
    'religious': 'bg-amber-100 text-amber-700 border-amber-200',
    'cultural': 'bg-purple-100 text-purple-700 border-purple-200',
    'royal': 'bg-blue-100 text-blue-700 border-blue-200',
    'modern': 'bg-teal-100 text-teal-700 border-teal-200',
    'harvest': 'bg-green-100 text-green-700 border-green-200',
    'water': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  }

  const CROWD_LEVEL_COLORS: Record<string, string> = {
    'low': 'bg-green-500',
    'medium': 'bg-yellow-500',
    'high': 'bg-orange-500',
    'extreme': 'bg-red-500',
  }

  // Get festival emoji based on slug, type, or religion
  function getFestivalEmoji(festival: Festival): string {
    // Check slug-specific emoji first
    if (festival.slug && FESTIVAL_EMOJI_MAP[festival.slug]) {
      return FESTIVAL_EMOJI_MAP[festival.slug]
    }
    // Royal festivals get crown
    if (festival.festivalType === 'royal') return '👑'
    // Fall back to religion-based emoji
    if (festival.religion && RELIGION_EMOJI_MAP[festival.religion]) {
      return RELIGION_EMOJI_MAP[festival.religion]
    }
    return '🎉'
  }

  // Get color class based on festival type
  function getFestivalTypeColor(type?: string): string {
    return (type && FESTIVAL_TYPE_COLORS[type]) || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  // Get crowd level indicator
  function getCrowdLevelColor(level?: string): string {
    return (level && CROWD_LEVEL_COLORS[level]) || 'bg-gray-400'
  }

  // Get countdown text
  function getCountdownText(days: number, isOngoing?: boolean): string {
    if (isOngoing) return 'Happening Now'
    if (days === 0) return 'Today!'
    if (days === 1) return 'Tomorrow!'
    if (days <= 7) return `In ${days} days`
    if (days <= 30) return `In ${Math.ceil(days / 7)} weeks`
    return `In ${Math.ceil(days / 30)} months`
  }

  // Get month name
  function getMonthName(month: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    return months[month - 1] || ''
  }

  // Annotate festivals with distance from user location
  function withDistances<T extends Festival>(
    festivals: T[],
    userLat: number,
    userLng: number
  ): (T & { distanceKm: number | null })[] {
    return festivals.map(f => ({
      ...f,
      distanceKm: getFestivalDistance(userLat, userLng, f.provinces, f.isNationwide)
    }))
  }

  // Sort festivals by proximity (nationwide first, then closest)
  function sortByProximity<T extends { distanceKm: number | null }>(festivals: T[]): T[] {
    return [...festivals].sort((a, b) => {
      if (a.distanceKm === null && b.distanceKm === null) return 0
      if (a.distanceKm === null) return 1
      if (b.distanceKm === null) return -1
      return a.distanceKm - b.distanceKm
    })
  }

  function formatDistanceText(km: number | null): string | null {
    return _formatDistance(km)
  }

  return {
    // State
    upcomingFestivals,
    allFestivals,
    loading,
    error,
    nextFestival,

    // Fetch methods
    fetchUpcoming,
    fetchAll,
    fetchFiltered,
    fetchByMonth,
    fetchByProvince,
    fetchByType,
    fetchByRegion,
    fetchHiddenGems,
    fetchBySlug,
    searchFestivals,
    fetchTypes,
    fetchRegions,

    // Distance helpers
    withDistances,
    sortByProximity,
    formatDistanceText,

    // Helpers
    formatFestivalDate,
    getFestivalEmoji,
    getFestivalTypeColor,
    getCrowdLevelColor,
    getCountdownText,
    getMonthName,
  }
}
