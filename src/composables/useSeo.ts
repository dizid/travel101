/**
 * Composable for managing SEO meta tags and structured data
 */

import { onMounted, onUnmounted, watch } from 'vue'
import type { Ref } from 'vue'
import {
  updateMetaTags,
  generateAttractionSchema,
  generateBreadcrumbSchema,
  injectStructuredData,
  removeStructuredData,
  type PageMeta,
  type AttractionSchema,
} from '@/utils/seo'

/**
 * Set page meta tags reactively
 */
export function usePageMeta(meta: PageMeta | Ref<PageMeta>) {
  const applyMeta = () => {
    const metaValue = 'value' in meta ? meta.value : meta
    updateMetaTags(metaValue)
  }

  onMounted(() => {
    applyMeta()
  })

  if ('value' in meta) {
    watch(meta, applyMeta, { deep: true })
  }
}

/**
 * Add attraction structured data to page
 */
export function useAttractionSchema(attraction: Ref<AttractionSchema | null>) {
  const SCHEMA_ID = 'attraction-schema'

  const applySchema = () => {
    if (attraction.value) {
      const schema = generateAttractionSchema(attraction.value)
      injectStructuredData(SCHEMA_ID, schema)
    }
  }

  onMounted(() => {
    applySchema()
  })

  watch(attraction, applySchema, { deep: true })

  onUnmounted(() => {
    removeStructuredData(SCHEMA_ID)
  })
}

/**
 * Add breadcrumb structured data to page
 */
export function useBreadcrumbs(items: { name: string; url: string }[]) {
  const SCHEMA_ID = 'breadcrumb-schema'

  onMounted(() => {
    const schema = generateBreadcrumbSchema(items)
    injectStructuredData(SCHEMA_ID, schema)
  })

  onUnmounted(() => {
    removeStructuredData(SCHEMA_ID)
  })
}

/**
 * Set dynamic attraction page meta
 */
export function useAttractionMeta(attraction: Ref<{
  name: string
  description: string
  slug: string
  province: string
  image_url?: string
} | null>) {
  watch(
    attraction,
    (attr) => {
      if (attr) {
        updateMetaTags({
          title: `${attr.name} - ${attr.province}`,
          description: attr.description.slice(0, 160),
          url: `/attractions/${attr.slug}`,
          image: attr.image_url,
          type: 'place',
        })
      }
    },
    { immediate: true }
  )
}
