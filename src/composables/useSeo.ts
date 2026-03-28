/**
 * Composable for managing SEO meta tags and structured data.
 * Uses @unhead/vue for SSR + client-side compatibility.
 */

import { computed, toValue } from 'vue'
import type { Ref, MaybeRefOrGetter } from 'vue'
import { useHead } from '@unhead/vue'
import {
  getPageMeta,
  generateAttractionSchema,
  generateEventSchema,
  generateLandmarkSchema,
  generateBreadcrumbSchema,
  usePageHead,
  type PageMeta,
  type AttractionSchema,
  type EventSchema,
  type LandmarkSchema,
} from '@/utils/seo'

/**
 * Set page meta tags reactively (SSR-safe).
 * For static meta, pass an object. For reactive, pass a Ref.
 */
export function usePageMeta(meta: PageMeta | Ref<PageMeta>) {
  usePageHead(meta)
}

/**
 * Apply SEO meta from route's seoKey config.
 * Call in views that have a static seoKey in route meta.
 */
export function useRouteSeo(seoKey: string, urlOverride?: string) {
  const meta = getPageMeta(seoKey as any)
  if (urlOverride) {
    usePageHead({ ...meta, url: urlOverride })
  } else {
    usePageHead(meta)
  }
}

/**
 * Add attraction structured data to page (SSR-safe)
 */
export function useAttractionSchema(attraction: Ref<AttractionSchema | null>) {
  const schema = computed(() => {
    if (!attraction.value) return null
    return generateAttractionSchema(attraction.value)
  })

  useHead(computed(() => {
    const s = schema.value
    if (!s) return {}
    return {
      script: [{ id: 'attraction-schema', type: 'application/ld+json', innerHTML: s }],
    }
  }))
}

/**
 * Add breadcrumb structured data to page (SSR-safe)
 */
export function useBreadcrumbs(items: { name: string; url: string }[]) {
  const schema = generateBreadcrumbSchema(items)

  useHead({
    script: [{ id: 'breadcrumb-schema', type: 'application/ld+json', innerHTML: schema }],
  })
}

/**
 * Add event structured data to page (SSR-safe, for festivals)
 */
export function useEventSchema(event: Ref<EventSchema | null>) {
  const schema = computed(() => {
    if (!event.value) return null
    return generateEventSchema(event.value)
  })

  useHead(computed(() => {
    const s = schema.value
    if (!s) return {}
    return {
      script: [{ id: 'event-schema', type: 'application/ld+json', innerHTML: s }],
    }
  }))
}

/**
 * Add landmark structured data to page (SSR-safe, for heritage sites)
 */
export function useLandmarkSchema(landmark: Ref<LandmarkSchema | null>) {
  const schema = computed(() => {
    if (!landmark.value) return null
    return generateLandmarkSchema(landmark.value)
  })

  useHead(computed(() => {
    const s = schema.value
    if (!s) return {}
    return {
      script: [{ id: 'landmark-schema', type: 'application/ld+json', innerHTML: s }],
    }
  }))
}

/**
 * Set dynamic attraction page meta (SSR-safe)
 */
export function useAttractionMeta(attraction: Ref<{
  name: string
  description: string
  slug: string
  province: string
  image_url?: string
} | null>) {
  const meta = computed<PageMeta | null>(() => {
    const attr = attraction.value
    if (!attr) return null
    return {
      title: `${attr.name} - ${attr.province}`,
      description: attr.description.slice(0, 160),
      url: `/attractions/${attr.slug}`,
      image: attr.image_url,
      type: 'place',
    }
  })

  usePageHead(meta)
}
