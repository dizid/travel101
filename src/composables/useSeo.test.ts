import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ref, nextTick, defineComponent } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { usePageMeta, useAttractionMeta, useAttractionSchema, useBreadcrumbs } from './useSeo'

// Mock the seo utils
vi.mock('@/utils/seo', () => ({
  updateMetaTags: vi.fn(),
  generateAttractionSchema: vi.fn((data) => ({ '@type': 'TouristAttraction', ...data })),
  generateBreadcrumbSchema: vi.fn((items) => ({ '@type': 'BreadcrumbList', items })),
  injectStructuredData: vi.fn(),
  removeStructuredData: vi.fn(),
}))

import {
  updateMetaTags,
  generateAttractionSchema,
  generateBreadcrumbSchema,
  injectStructuredData,
  removeStructuredData,
} from '@/utils/seo'

// Helper to mount a composable in a component context
function mountComposable<T>(composableFn: () => T): { result: T; unmount: () => void } {
  let result: T
  const wrapper = mount(
    defineComponent({
      setup() {
        result = composableFn()
        return {}
      },
      template: '<div></div>',
    })
  )
  return { result: result!, unmount: () => wrapper.unmount() }
}

describe('useSeo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('usePageMeta', () => {
    it('should call updateMetaTags with static meta object on mount', () => {
      const meta = {
        title: 'Test Page',
        description: 'Test description',
        url: '/test',
      }

      mountComposable(() => usePageMeta(meta))

      expect(updateMetaTags).toHaveBeenCalledWith(meta)
    })

    it('should handle ref meta and watch for changes', async () => {
      const meta = ref({
        title: 'Initial Title',
        description: 'Initial description',
      })

      mountComposable(() => usePageMeta(meta))

      // Initial call on mount
      expect(updateMetaTags).toHaveBeenCalledWith({
        title: 'Initial Title',
        description: 'Initial description',
      })

      // Update the ref
      meta.value = {
        title: 'Updated Title',
        description: 'Updated description',
      }

      await nextTick()

      expect(updateMetaTags).toHaveBeenCalledWith({
        title: 'Updated Title',
        description: 'Updated description',
      })
    })
  })

  describe('useAttractionMeta', () => {
    it('should update meta tags when attraction is provided', () => {
      const attraction = ref({
        name: 'Grand Palace',
        description: 'The Grand Palace is a complex of buildings at the heart of Bangkok.',
        slug: 'grand-palace',
        province: 'Bangkok',
        image_url: 'https://example.com/grand-palace.jpg',
      })

      mountComposable(() => useAttractionMeta(attraction))

      expect(updateMetaTags).toHaveBeenCalledWith({
        title: 'Grand Palace - Bangkok',
        description: expect.stringContaining('Grand Palace'),
        url: '/attractions/grand-palace',
        image: 'https://example.com/grand-palace.jpg',
        type: 'place',
      })
    })

    it('should truncate description to 160 characters', () => {
      const longDescription = 'A'.repeat(200)
      const attraction = ref({
        name: 'Test',
        description: longDescription,
        slug: 'test',
        province: 'Bangkok',
      })

      mountComposable(() => useAttractionMeta(attraction))

      const call = (updateMetaTags as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(call.description).toHaveLength(160)
    })

    it('should not update meta when attraction is null', () => {
      const attraction = ref(null)

      mountComposable(() => useAttractionMeta(attraction))

      expect(updateMetaTags).not.toHaveBeenCalled()
    })

    it('should update meta when attraction changes', async () => {
      const attraction = ref<{
        name: string
        description: string
        slug: string
        province: string
      } | null>({
        name: 'First',
        description: 'First description',
        slug: 'first',
        province: 'Bangkok',
      })

      mountComposable(() => useAttractionMeta(attraction))

      expect(updateMetaTags).toHaveBeenCalledTimes(1)

      attraction.value = {
        name: 'Second',
        description: 'Second description',
        slug: 'second',
        province: 'Chiang Mai',
      }

      await nextTick()

      expect(updateMetaTags).toHaveBeenCalledTimes(2)
      expect(updateMetaTags).toHaveBeenLastCalledWith(
        expect.objectContaining({
          title: 'Second - Chiang Mai',
        })
      )
    })
  })

  describe('useAttractionSchema', () => {
    it('should inject structured data when attraction is provided', () => {
      const attraction = ref({
        name: 'Wat Pho',
        description: 'Temple of the Reclining Buddha',
      })

      mountComposable(() => useAttractionSchema(attraction))

      expect(generateAttractionSchema).toHaveBeenCalledWith({
        name: 'Wat Pho',
        description: 'Temple of the Reclining Buddha',
      })
      expect(injectStructuredData).toHaveBeenCalledWith(
        'attraction-schema',
        expect.objectContaining({ '@type': 'TouristAttraction' })
      )
    })

    it('should not inject schema when attraction is null', () => {
      const attraction = ref(null)

      mountComposable(() => useAttractionSchema(attraction))

      expect(injectStructuredData).not.toHaveBeenCalled()
    })

    it('should update schema when attraction changes', async () => {
      const attraction = ref<{ name: string } | null>({
        name: 'First Attraction',
      })

      mountComposable(() => useAttractionSchema(attraction))

      attraction.value = { name: 'Second Attraction' }

      await nextTick()

      expect(generateAttractionSchema).toHaveBeenCalledTimes(2)
      expect(generateAttractionSchema).toHaveBeenLastCalledWith({
        name: 'Second Attraction',
      })
    })

    it('should remove schema on unmount', () => {
      const attraction = ref({ name: 'Test' })

      const { unmount } = mountComposable(() => useAttractionSchema(attraction))

      unmount()

      expect(removeStructuredData).toHaveBeenCalledWith('attraction-schema')
    })
  })

  describe('useBreadcrumbs', () => {
    it('should inject breadcrumb structured data', () => {
      const items = [
        { name: 'Home', url: '/' },
        { name: 'Attractions', url: '/attractions' },
        { name: 'Grand Palace', url: '/attractions/grand-palace' },
      ]

      mountComposable(() => useBreadcrumbs(items))

      expect(generateBreadcrumbSchema).toHaveBeenCalledWith(items)
      expect(injectStructuredData).toHaveBeenCalledWith(
        'breadcrumb-schema',
        expect.objectContaining({ '@type': 'BreadcrumbList' })
      )
    })

    it('should handle empty breadcrumbs', () => {
      mountComposable(() => useBreadcrumbs([]))

      expect(generateBreadcrumbSchema).toHaveBeenCalledWith([])
      expect(injectStructuredData).toHaveBeenCalled()
    })

    it('should remove breadcrumbs on unmount', () => {
      const { unmount } = mountComposable(() => useBreadcrumbs([{ name: 'Home', url: '/' }]))

      unmount()

      expect(removeStructuredData).toHaveBeenCalledWith('breadcrumb-schema')
    })
  })
})
