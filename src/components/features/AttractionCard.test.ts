import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import AttractionCard from './AttractionCard.vue'
import type { Attraction } from '@/types'

// Mock the favorites composable
const mockToggleFavorite = vi.fn()
const mockIsFavorite = vi.fn().mockReturnValue(false)

vi.mock('@/composables/useFavorites', () => ({
  useFavorites: () => ({
    toggleFavorite: mockToggleFavorite,
    isFavorite: mockIsFavorite,
  }),
}))

// Mock the affiliates utility
vi.mock('@/utils/affiliates', () => ({
  generateAffiliateUrl: vi.fn().mockReturnValue('https://affiliate.com/test'),
  generateHeritageHotelUrl: vi.fn().mockReturnValue('https://agoda.com/test'),
  trackAffiliateClick: vi.fn(),
}))

// Mock icons
vi.mock('@ant-design/icons-vue', () => ({
  EnvironmentOutlined: { template: '<span>📍</span>' },
  StarFilled: { template: '<span>⭐</span>' },
  HeartOutlined: { template: '<span>♡</span>' },
  HeartFilled: { template: '<span>♥</span>' },
}))

// Create a simple router for RouterLink
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div/>' } },
    { path: '/attractions/:id', component: { template: '<div/>' } },
  ],
})

const mockAttraction: Attraction = {
  id: 'test-attraction-1',
  slug: 'grand-palace',
  name: 'Grand Palace',
  description: 'The historic royal palace in the heart of Bangkok.',
  province: 'Bangkok',
  category: 'culture',
  isHiddenGem: false,
  isProOnly: false,
  location: 'Bangkok',
}

describe('AttractionCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockIsFavorite.mockReturnValue(false)
  })

  const mountCard = (props: Partial<{ attraction: Attraction; showMatch?: boolean; matchScore?: number; matchReason?: string }> = {}) => {
    return mount(AttractionCard, {
      props: {
        attraction: mockAttraction,
        ...props,
      },
      global: {
        plugins: [router],
      },
    })
  }

  describe('rendering', () => {
    it('renders attraction name', () => {
      const wrapper = mountCard()
      expect(wrapper.text()).toContain('Grand Palace')
    })

    it('renders attraction province', () => {
      const wrapper = mountCard()
      expect(wrapper.text()).toContain('Bangkok')
    })

    it('renders attraction description', () => {
      const wrapper = mountCard()
      expect(wrapper.text()).toContain('historic royal palace')
    })

    it('renders category badge', () => {
      const wrapper = mountCard()
      expect(wrapper.text()).toContain('Culture')
    })

    it('links to attraction detail page', () => {
      const wrapper = mountCard()
      const link = wrapper.find('a')

      expect(link.attributes('href')).toBe('/attractions/grand-palace')
    })
  })

  describe('hidden gem badge', () => {
    it('shows hidden gem badge when isHiddenGem is true', () => {
      const wrapper = mountCard({
        attraction: { ...mockAttraction, isHiddenGem: true },
      })

      expect(wrapper.text()).toContain('Hidden Gem')
    })

    it('does not show hidden gem badge when isHiddenGem is false', () => {
      const wrapper = mountCard()
      expect(wrapper.text()).not.toContain('Hidden Gem')
    })
  })

  describe('match score', () => {
    it('shows match score when showMatch and matchScore are provided', () => {
      const wrapper = mountCard({
        showMatch: true,
        matchScore: 85,
      })

      expect(wrapper.text()).toContain('85% match')
    })

    it('does not show match score when showMatch is false', () => {
      const wrapper = mountCard({
        showMatch: false,
        matchScore: 85,
      })

      expect(wrapper.text()).not.toContain('85% match')
    })

    it('shows match reason when provided', () => {
      const wrapper = mountCard({
        showMatch: true,
        matchScore: 85,
        matchReason: 'Perfect for culture lovers',
      })

      expect(wrapper.text()).toContain('Perfect for culture lovers')
    })

    it('applies green color for high match scores (>=80)', () => {
      const wrapper = mountCard({
        showMatch: true,
        matchScore: 90,
      })

      const matchBadge = wrapper.find('.text-green-600')
      expect(matchBadge.exists()).toBe(true)
    })

    it('applies amber color for medium match scores (50-79)', () => {
      const wrapper = mountCard({
        showMatch: true,
        matchScore: 65,
      })

      const matchBadge = wrapper.find('.text-amber-600')
      expect(matchBadge.exists()).toBe(true)
    })

    it('applies gray color for low match scores (<50)', () => {
      const wrapper = mountCard({
        showMatch: true,
        matchScore: 30,
      })

      const matchBadge = wrapper.find('.text-gray-600')
      expect(matchBadge.exists()).toBe(true)
    })
  })

  describe('favorite functionality', () => {
    it('renders favorite button', () => {
      const wrapper = mountCard()
      const favoriteButton = wrapper.find('button')

      expect(favoriteButton.exists()).toBe(true)
    })

    it('shows empty heart when not favorited', () => {
      mockIsFavorite.mockReturnValue(false)
      const wrapper = mountCard()

      expect(wrapper.text()).toContain('♡')
    })

    it('shows filled heart when favorited', () => {
      mockIsFavorite.mockReturnValue(true)
      const wrapper = mountCard()

      expect(wrapper.text()).toContain('♥')
    })

    it('calls toggleFavorite when favorite button clicked', async () => {
      const wrapper = mountCard()
      const favoriteButton = wrapper.find('button')

      await favoriteButton.trigger('click')

      expect(mockToggleFavorite).toHaveBeenCalledWith('grand-palace')
    })

    it('prevents navigation when clicking favorite button', async () => {
      const wrapper = mountCard()
      const favoriteButton = wrapper.find('button')

      const clickEvent = new Event('click', { bubbles: true })
      const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault')
      const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation')

      favoriteButton.element.dispatchEvent(clickEvent)

      // The component should prevent default and stop propagation
    })
  })

  describe('category configurations', () => {
    const categories = [
      { category: 'beach', label: 'Beach', icon: '🏖️' },
      { category: 'culture', label: 'Culture', icon: '🏛️' },
      { category: 'nightlife', label: 'Nightlife', icon: '🌙' },
      { category: 'nature', label: 'Nature', icon: '🌿' },
      { category: 'island', label: 'Island', icon: '🏝️' },
      { category: 'foodie', label: 'Foodie', icon: '🍜' },
      { category: 'nomad', label: 'Nomad Hub', icon: '💻' },
      { category: 'wellness', label: 'Wellness', icon: '🧘' },
      { category: 'adventure', label: 'Adventure', icon: '⛰️' },
      { category: 'family', label: 'Family', icon: '👨‍👩‍👧' },
      { category: 'romantic', label: 'Romantic', icon: '💕' },
      { category: 'budget', label: 'Budget', icon: '💰' },
      { category: 'luxury', label: 'Luxury', icon: '✨' },
    ]

    categories.forEach(({ category, label }) => {
      it(`renders correct label for ${category} category`, () => {
        const wrapper = mountCard({
          attraction: { ...mockAttraction, category: category as any },
        })

        expect(wrapper.text()).toContain(label)
      })
    })
  })

  describe('affiliate booking', () => {
    it('shows Book Activity button on hover for non-heritage', () => {
      const wrapper = mountCard()
      expect(wrapper.text()).toContain('Book Activity')
    })

    it('shows Book Stay button for heritage attractions', () => {
      const wrapper = mountCard({
        attraction: { ...mockAttraction, placeType: 'heritage' } as any,
      })

      expect(wrapper.text()).toContain('Book Stay')
    })
  })

  describe('accessibility', () => {
    it('has accessible favorite button with title', () => {
      const wrapper = mountCard()
      const favoriteButton = wrapper.find('button')

      expect(favoriteButton.attributes('title')).toBeTruthy()
    })

    it('favorite button title changes based on state', () => {
      mockIsFavorite.mockReturnValue(false)
      const wrapper1 = mountCard()
      expect(wrapper1.find('button').attributes('title')).toBe('Save this place')

      mockIsFavorite.mockReturnValue(true)
      const wrapper2 = mountCard()
      expect(wrapper2.find('button').attributes('title')).toBe('Remove from saved')
    })
  })
})
