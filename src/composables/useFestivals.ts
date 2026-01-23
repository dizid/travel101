import { ref, computed } from 'vue'
import type {
  Festival,
  UpcomingFestival,
  FestivalType,
  FestivalRegion,
  FestivalFilters
} from '@/types'

const upcomingFestivals = ref<UpcomingFestival[]>([])
const allFestivals = ref<Festival[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

export function useFestivals() {
  // Fetch upcoming festivals (within N days)
  async function fetchUpcoming(days = 60): Promise<UpcomingFestival[]> {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`/api/festivals/upcoming?days=${days}`)
      if (!response.ok) throw new Error('Failed to fetch upcoming festivals')

      const data = await response.json()
      upcomingFestivals.value = data.festivals
      return data.festivals
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      return []
    } finally {
      loading.value = false
    }
  }

  // Fetch all festivals
  async function fetchAll(): Promise<Festival[]> {
    loading.value = true
    error.value = null

    try {
      const response = await fetch('/api/festivals')
      if (!response.ok) throw new Error('Failed to fetch festivals')

      const data = await response.json()
      allFestivals.value = data.festivals
      return data.festivals
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      return []
    } finally {
      loading.value = false
    }
  }

  // Fetch festivals with filters
  async function fetchFiltered(filters: FestivalFilters): Promise<{ festivals: Festival[]; total: number; hasMore: boolean }> {
    loading.value = true
    error.value = null

    try {
      const params = new URLSearchParams()
      if (filters.type) params.set('type', filters.type)
      if (filters.region) params.set('region', filters.region)
      if (filters.hidden) params.set('hidden', 'true')
      if (filters.month) params.set('month', filters.month.toString())
      if (filters.search) params.set('search', filters.search)

      const response = await fetch(`/api/festivals?${params}`)
      if (!response.ok) throw new Error('Failed to fetch festivals')

      const data = await response.json()
      return {
        festivals: data.festivals,
        total: data.total || data.count,
        hasMore: data.hasMore || false
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      return { festivals: [], total: 0, hasMore: false }
    } finally {
      loading.value = false
    }
  }

  // Fetch by month
  async function fetchByMonth(month: number): Promise<Festival[]> {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`/api/festivals?month=${month}`)
      if (!response.ok) throw new Error('Failed to fetch festivals')

      const data = await response.json()
      return data.festivals
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      return []
    } finally {
      loading.value = false
    }
  }

  // Fetch by province
  async function fetchByProvince(province: string): Promise<Festival[]> {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`/api/festivals?province=${encodeURIComponent(province)}`)
      if (!response.ok) throw new Error('Failed to fetch festivals')

      const data = await response.json()
      return data.festivals
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      return []
    } finally {
      loading.value = false
    }
  }

  // Fetch by type
  async function fetchByType(type: FestivalType): Promise<Festival[]> {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`/api/festivals?type=${type}`)
      if (!response.ok) throw new Error('Failed to fetch festivals')

      const data = await response.json()
      return data.festivals
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      return []
    } finally {
      loading.value = false
    }
  }

  // Fetch by region
  async function fetchByRegion(region: FestivalRegion): Promise<Festival[]> {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`/api/festivals?region=${region}`)
      if (!response.ok) throw new Error('Failed to fetch festivals')

      const data = await response.json()
      return data.festivals
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      return []
    } finally {
      loading.value = false
    }
  }

  // Fetch hidden gems only
  async function fetchHiddenGems(): Promise<Festival[]> {
    loading.value = true
    error.value = null

    try {
      const response = await fetch('/api/festivals?hidden=true')
      if (!response.ok) throw new Error('Failed to fetch festivals')

      const data = await response.json()
      return data.festivals
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      return []
    } finally {
      loading.value = false
    }
  }

  // Fetch single festival by slug
  async function fetchBySlug(slug: string): Promise<UpcomingFestival | null> {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`/api/festivals/${slug}`)
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error('Failed to fetch festival')
      }

      return await response.json()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      return null
    } finally {
      loading.value = false
    }
  }

  // Search festivals
  async function searchFestivals(query: string): Promise<Festival[]> {
    if (!query.trim()) return []

    loading.value = true
    error.value = null

    try {
      const response = await fetch(`/api/festivals?search=${encodeURIComponent(query)}`)
      if (!response.ok) throw new Error('Failed to search festivals')

      const data = await response.json()
      return data.festivals
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      return []
    } finally {
      loading.value = false
    }
  }

  // Fetch festival types with counts
  async function fetchTypes(): Promise<{ type: string; count: number }[]> {
    try {
      const response = await fetch('/api/festivals/types')
      if (!response.ok) throw new Error('Failed to fetch festival types')

      const data = await response.json()
      return data.types
    } catch (e) {
      console.error('Error fetching festival types:', e)
      return []
    }
  }

  // Fetch regions with counts
  async function fetchRegions(): Promise<{ region: string; count: number }[]> {
    try {
      const response = await fetch('/api/festivals/regions')
      if (!response.ok) throw new Error('Failed to fetch regions')

      const data = await response.json()
      return data.regions
    } catch (e) {
      console.error('Error fetching regions:', e)
      return []
    }
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

  // Get festival emoji based on type
  function getFestivalEmoji(festival: Festival): string {
    // Specific festival emojis
    if (festival.slug === 'songkran') return '💦'
    if (festival.slug === 'loy-krathong') return '🪷'
    if (festival.slug === 'yi-peng') return '🏮'
    if (festival.slug === 'chinese-new-year') return '🐉'
    if (festival.slug === 'vegetarian-festival' || festival.slug === 'trang-vegetarian') return '🥬'
    if (festival.slug === 'ubon-candle-festival') return '🕯️'
    if (festival.slug === 'bun-bang-fai') return '🚀'
    if (festival.slug === 'phi-ta-khon') return '👻'
    if (festival.slug === 'naga-fireballs') return '🔥'
    if (festival.slug === 'buffalo-racing') return '🐃'
    if (festival.slug === 'surin-elephant-roundup' || festival.slug === 'elephant-day') return '🐘'
    if (festival.slug === 'wonderfruit') return '🎪'
    if (festival.slug === 'full-moon-party') return '🌕'
    if (festival.slug === 'lopburi-monkey-festival') return '🐒'
    if (festival.slug === 'chiang-mai-flower-festival' || festival.slug === 'saraburi-sunflowers') return '🌻'
    if (festival.slug === 'bo-sang-umbrella') return '☂️'
    if (festival.slug === 'pattaya-fireworks') return '🎆'
    if (festival.slug === 'bangkok-countdown') return '🎉'
    if (festival.slug === 'hua-hin-jazz') return '🎷'
    if (festival.slug === 'khon-kaen-silk-festival') return '🧵'
    if (festival.slug === 'lamphun-longan') return '🍇'

    // Royal festivals
    if (festival.festivalType === 'royal') return '👑'

    // By religion
    switch (festival.religion) {
      case 'buddhist': return '🙏'
      case 'taoist': return '☯️'
      case 'hindu': return '🕉️'
      case 'animist': return '🌿'
      default: return '🎉'
    }
  }

  // Get color class based on festival type
  function getFestivalTypeColor(type?: string): string {
    switch (type) {
      case 'religious': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'cultural': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'royal': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'modern': return 'bg-teal-100 text-teal-700 border-teal-200'
      case 'harvest': return 'bg-green-100 text-green-700 border-green-200'
      case 'water': return 'bg-cyan-100 text-cyan-700 border-cyan-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  // Get crowd level indicator
  function getCrowdLevelColor(level?: string): string {
    switch (level) {
      case 'low': return 'bg-green-500'
      case 'medium': return 'bg-yellow-500'
      case 'high': return 'bg-orange-500'
      case 'extreme': return 'bg-red-500'
      default: return 'bg-gray-400'
    }
  }

  // Get countdown text
  function getCountdownText(days: number): string {
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

    // Helpers
    formatFestivalDate,
    getFestivalEmoji,
    getFestivalTypeColor,
    getCrowdLevelColor,
    getCountdownText,
    getMonthName,
  }
}
