import { ref, computed } from 'vue'

export interface Guide {
  id: string
  slug: string
  title: string
  subtitle: string | null
  content?: string
  excerpt: string | null
  category: string
  province: string | null
  imageUrl: string | null
  imageAlt: string | null
  author: string
  readingTimeMin: number
  tags: string[]
  isPublished: boolean
  publishedAt: string
  updatedAt: string
  viewCount: number
}

export type GuideCategory = 'destination' | 'practical' | 'culture' | 'food' | 'budget' | 'neighborhood'

// Shared state
const guides = ref<Guide[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Category display config
const CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  destination: { label: 'Destination', icon: '📍', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  practical: { label: 'Practical', icon: '📋', color: 'bg-green-100 text-green-700 border-green-200' },
  culture: { label: 'Culture', icon: '🏛️', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  food: { label: 'Food', icon: '🍜', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  budget: { label: 'Budget', icon: '💰', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  neighborhood: { label: 'Neighborhood', icon: '🏘️', color: 'bg-amber-100 text-amber-700 border-amber-200' },
}

// Build URL with query params
function buildUrl(base: string, params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value))
    }
  }
  const qs = searchParams.toString()
  return qs ? `${base}?${qs}` : base
}

export function useGuides() {
  // Fetch all guides (listing, no content field) — SSG-aware
  async function fetchAll(): Promise<Guide[]> {
    // During SSG: read from pre-fetched data
    if (import.meta.env.SSR) {
      const { getSSGGuideList } = await import('@/lib/ssg-data')
      const list = getSSGGuideList() as Guide[]
      guides.value = list
      return list
    }

    loading.value = true
    error.value = null
    try {
      const response = await fetch('/api/guides')
      if (!response.ok) throw new Error('Failed to fetch guides')
      const data = await response.json()
      guides.value = data.guides || []
      return guides.value
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      return []
    } finally {
      loading.value = false
    }
  }

  // Fetch guides by category
  async function fetchByCategory(category: string): Promise<Guide[]> {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(buildUrl('/api/guides', { category }))
      if (!response.ok) throw new Error('Failed to fetch guides')
      const data = await response.json()
      guides.value = data.guides || []
      return guides.value
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      return []
    } finally {
      loading.value = false
    }
  }

  // Fetch single guide by slug (includes content) — SSG-aware
  async function fetchBySlug(slug: string): Promise<Guide | null> {
    // During SSG: read from pre-fetched data
    if (import.meta.env.SSR) {
      const { getSSGGuide } = await import('@/lib/ssg-data')
      return getSSGGuide(slug) as Guide | null
    }

    loading.value = true
    error.value = null
    try {
      const response = await fetch(`/api/guides/${encodeURIComponent(slug)}`)
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error('Failed to fetch guide')
      }
      return await response.json()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      return null
    } finally {
      loading.value = false
    }
  }

  // Search guides
  async function searchGuides(query: string): Promise<Guide[]> {
    if (!query.trim()) return []
    loading.value = true
    error.value = null
    try {
      const response = await fetch(buildUrl('/api/guides', { search: query }))
      if (!response.ok) throw new Error('Failed to search guides')
      const data = await response.json()
      return data.guides || []
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      return []
    } finally {
      loading.value = false
    }
  }

  // Category helpers
  function getCategoryConfig(category: string) {
    return CATEGORY_CONFIG[category] || CATEGORY_CONFIG.practical
  }

  function getCategoryLabel(category: string): string {
    return getCategoryConfig(category).label
  }

  function getCategoryColor(category: string): string {
    return getCategoryConfig(category).color
  }

  function getCategoryIcon(category: string): string {
    return getCategoryConfig(category).icon
  }

  // Format published date
  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Guide count by category
  const guidesByCategory = computed(() => {
    const grouped: Record<string, Guide[]> = {}
    for (const guide of guides.value) {
      if (!grouped[guide.category]) grouped[guide.category] = []
      grouped[guide.category].push(guide)
    }
    return grouped
  })

  return {
    // State
    guides,
    loading,
    error,
    guidesByCategory,

    // Fetch methods
    fetchAll,
    fetchByCategory,
    fetchBySlug,
    searchGuides,

    // Helpers
    getCategoryConfig,
    getCategoryLabel,
    getCategoryColor,
    getCategoryIcon,
    formatDate,
  }
}
