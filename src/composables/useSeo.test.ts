import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, nextTick, defineComponent, computed } from 'vue'
import { mount } from '@vue/test-utils'
import { usePageMeta, useAttractionMeta, useAttractionSchema, useBreadcrumbs } from './useSeo'

// Track useHead() calls
const useHeadMock = vi.fn()

vi.mock('@unhead/vue', () => ({
  useHead: (...args: unknown[]) => useHeadMock(...args),
}))

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

// Extract the resolved value from a computed ref passed to useHead
function resolveHeadConfig(callIndex = 0) {
  const arg = useHeadMock.mock.calls[callIndex]?.[0]
  if (!arg) return null
  // useHead receives a computed ref — resolve its .value
  return arg.value !== undefined ? arg.value : arg
}

describe('useSeo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('usePageMeta', () => {
    it('should call useHead with title and meta tags for static meta', () => {
      const meta = {
        title: 'Test Page',
        description: 'Test description',
        url: '/test',
      }

      mountComposable(() => usePageMeta(meta))

      expect(useHeadMock).toHaveBeenCalled()
      const config = resolveHeadConfig()
      expect(config.title).toContain('Test Page')
      expect(config.meta).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'description', content: 'Test description' }),
        ])
      )
      expect(config.link).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ rel: 'canonical', href: expect.stringContaining('/test') }),
        ])
      )
    })

    it('should handle ref meta and react to changes', async () => {
      const meta = ref({
        title: 'Initial Title',
        description: 'Initial description',
      })

      mountComposable(() => usePageMeta(meta))

      // useHead is called with a computed — the computed reacts to changes
      expect(useHeadMock).toHaveBeenCalled()
      const config = resolveHeadConfig()
      expect(config.title).toContain('Initial Title')

      // Update the ref — computed will re-evaluate
      meta.value = {
        title: 'Updated Title',
        description: 'Updated description',
      }

      await nextTick()

      // The same computed ref now resolves to updated values
      const updated = resolveHeadConfig()
      expect(updated.title).toContain('Updated Title')
    })
  })

  describe('useAttractionMeta', () => {
    it('should set meta tags when attraction is provided', () => {
      const attraction = ref({
        name: 'Grand Palace',
        description: 'The Grand Palace is a complex of buildings at the heart of Bangkok.',
        slug: 'grand-palace',
        province: 'Bangkok',
        image_url: 'https://example.com/grand-palace.jpg',
      })

      mountComposable(() => useAttractionMeta(attraction))

      expect(useHeadMock).toHaveBeenCalled()
      const config = resolveHeadConfig()
      expect(config.title).toContain('Grand Palace')
      expect(config.title).toContain('Bangkok')
      expect(config.meta).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'description', content: expect.stringContaining('Grand Palace') }),
        ])
      )
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

      const config = resolveHeadConfig()
      const descMeta = config.meta.find((m: any) => m.name === 'description')
      expect(descMeta.content).toHaveLength(160)
    })

    it('should produce empty config when attraction is null', () => {
      const attraction = ref(null)

      mountComposable(() => useAttractionMeta(attraction))

      expect(useHeadMock).toHaveBeenCalled()
      const config = resolveHeadConfig()
      // null attraction → empty config (no title, no meta)
      expect(config).toEqual({})
    })

    it('should react when attraction changes', async () => {
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

      const initialConfig = resolveHeadConfig()
      expect(initialConfig.title).toContain('First')

      attraction.value = {
        name: 'Second',
        description: 'Second description',
        slug: 'second',
        province: 'Chiang Mai',
      }

      await nextTick()

      const updatedConfig = resolveHeadConfig()
      expect(updatedConfig.title).toContain('Second')
      expect(updatedConfig.title).toContain('Chiang Mai')
    })
  })

  describe('useAttractionSchema', () => {
    it('should inject JSON-LD script when attraction is provided', () => {
      const attraction = ref({
        name: 'Wat Pho',
        description: 'Temple of the Reclining Buddha',
        address: 'Bangkok',
        province: 'Bangkok',
        slug: 'wat-pho',
      })

      mountComposable(() => useAttractionSchema(attraction))

      // useHead called twice: once from useAttractionSchema, once internally
      const scriptCall = useHeadMock.mock.calls.find((call: any) => {
        const val = call[0]?.value !== undefined ? call[0].value : call[0]
        return val?.script?.some((s: any) => s.id === 'attraction-schema')
      })

      expect(scriptCall).toBeTruthy()
      const config = scriptCall[0].value !== undefined ? scriptCall[0].value : scriptCall[0]
      const script = config.script[0]
      expect(script.type).toBe('application/ld+json')
      const schema = JSON.parse(script.innerHTML)
      expect(schema['@type']).toBe('TouristAttraction')
      expect(schema.name).toBe('Wat Pho')
    })

    it('should produce empty config when attraction is null', () => {
      const attraction = ref(null)

      mountComposable(() => useAttractionSchema(attraction))

      // useHead called but config should have no script
      const scriptCall = useHeadMock.mock.calls.find((call: any) => {
        const val = call[0]?.value !== undefined ? call[0].value : call[0]
        return val?.script?.length > 0
      })
      expect(scriptCall).toBeFalsy()
    })
  })

  describe('useBreadcrumbs', () => {
    it('should inject breadcrumb JSON-LD', () => {
      const items = [
        { name: 'Home', url: '/' },
        { name: 'Attractions', url: '/attractions' },
        { name: 'Grand Palace', url: '/attractions/grand-palace' },
      ]

      mountComposable(() => useBreadcrumbs(items))

      const scriptCall = useHeadMock.mock.calls.find((call: any) => {
        const val = call[0]?.value !== undefined ? call[0].value : call[0]
        return val?.script?.some((s: any) => s.id === 'breadcrumb-schema')
      })

      expect(scriptCall).toBeTruthy()
      const config = scriptCall[0].value !== undefined ? scriptCall[0].value : scriptCall[0]
      const schema = JSON.parse(config.script[0].innerHTML)
      expect(schema['@type']).toBe('BreadcrumbList')
      expect(schema.itemListElement).toHaveLength(3)
    })

    it('should handle empty breadcrumbs', () => {
      mountComposable(() => useBreadcrumbs([]))

      const scriptCall = useHeadMock.mock.calls.find((call: any) => {
        const val = call[0]?.value !== undefined ? call[0].value : call[0]
        return val?.script?.some((s: any) => s.id === 'breadcrumb-schema')
      })

      expect(scriptCall).toBeTruthy()
    })
  })
})
