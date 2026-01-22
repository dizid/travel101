import { ref, computed } from 'vue'
import type { Festival, UpcomingFestival } from '@/types'

const upcomingFestivals = ref<UpcomingFestival[]>([])
const allFestivals = ref<Festival[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

export function useFestivals() {
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
    if (festival.slug === 'songkran') return '💦'
    if (festival.slug === 'loy-krathong') return '🪷'
    if (festival.slug === 'yi-peng') return '🏮'
    if (festival.slug === 'chinese-new-year') return '🐉'
    if (festival.slug === 'vegetarian-festival') return '🥬'
    if (festival.slug === 'candle-festival') return '🕯️'
    if (festival.slug === 'rocket-festival') return '🚀'
    if (festival.slug === 'phi-ta-khon') return '👻'

    switch (festival.religion) {
      case 'buddhist': return '🙏'
      case 'taoist': return '☯️'
      case 'hindu': return '🕉️'
      case 'animist': return '🌿'
      default: return '🎉'
    }
  }

  return {
    upcomingFestivals,
    allFestivals,
    loading,
    error,
    nextFestival,
    fetchUpcoming,
    fetchAll,
    fetchByMonth,
    fetchByProvince,
    formatFestivalDate,
    getFestivalEmoji,
  }
}
