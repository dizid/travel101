<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ClockCircleOutlined,
  CalendarOutlined,
  ArrowLeftOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons-vue'
import BreadcrumbNav from '@/components/ui/BreadcrumbNav.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import NewsletterSignup from '@/components/ui/NewsletterSignup.vue'
import { useGuides, type Guide } from '@/composables/useGuides'
import { renderMarkdown, extractTOC } from '@/utils/markdown'
import {
  generateBreadcrumbSchema,
  generateArticleSchema,
  usePageHead,
  useStructuredData,
} from '@/utils/seo'

const route = useRoute()
const router = useRouter()
const { fetchBySlug, fetchAll, getCategoryConfig, formatDate, loading, error } = useGuides()

const guide = ref<Guide | null>(null)
const relatedGuides = ref<Guide[]>([])
const showTOC = ref(false)

// SEO — reactive, updates automatically when guide loads
usePageHead(computed(() => {
  if (!guide.value) return null
  return {
    title: guide.value.title,
    description: guide.value.excerpt || guide.value.subtitle || '',
    image: guide.value.imageUrl || undefined,
    url: `/guides/${guide.value.slug}`,
    type: 'article' as const,
  }
}))

useStructuredData('article-schema', computed(() => {
  if (!guide.value) return null
  return generateArticleSchema({
    title: guide.value.title,
    description: guide.value.excerpt || guide.value.subtitle || '',
    image: guide.value.imageUrl || undefined,
    slug: guide.value.slug,
    author: guide.value.author,
    publishedAt: guide.value.publishedAt,
    updatedAt: guide.value.updatedAt,
    wordCount: guide.value.content ? guide.value.content.split(/\s+/).length : 0,
  })
}))

useStructuredData('breadcrumb-schema', computed(() => {
  if (!guide.value) return null
  return generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Guides', url: '/guides' },
    { name: guide.value.title, url: `/guides/${guide.value.slug}` },
  ])
}))

const slug = computed(() => route.params.slug as string)

const renderedContent = computed(() => {
  if (!guide.value?.content) return ''
  return renderMarkdown(guide.value.content)
})

const toc = computed(() => {
  if (!guide.value?.content) return []
  return extractTOC(guide.value.content)
})

const breadcrumbs = computed(() => [
  { name: 'Home', url: '/' },
  { name: 'Guides', url: '/guides' },
  { name: guide.value?.title || 'Guide' },
])

const categoryConfig = computed(() =>
  guide.value ? getCategoryConfig(guide.value.category) : null
)


async function loadGuide() {
  const result = await fetchBySlug(slug.value)
  if (!result) {
    router.replace('/guides')
    return
  }
  guide.value = result

  // Load related guides (same category, excluding current)
  const allGuides = await fetchAll()
  relatedGuides.value = allGuides
    .filter(g => g.slug !== result.slug)
    .sort((a, b) => {
      // Prioritize same category
      const aMatch = a.category === result.category ? 1 : 0
      const bMatch = b.category === result.category ? 1 : 0
      return bMatch - aMatch
    })
    .slice(0, 3)
}

function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    showTOC.value = false
  }
}

onMounted(() => loadGuide())

watch(slug, () => loadGuide())
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Loading -->
    <div v-if="loading" class="flex justify-center items-center min-h-[60vh]">
      <LoadingSpinner size="lg" text="Loading guide..." />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <p class="text-red-500 text-lg mb-4">{{ error }}</p>
      <RouterLink to="/guides" class="btn-thai">Back to Guides</RouterLink>
    </div>

    <template v-else-if="guide">
      <!-- Hero -->
      <section class="relative bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
        <img
          v-if="guide.imageUrl"
          :src="guide.imageUrl"
          :alt="guide.imageAlt || guide.title"
          class="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />

        <div class="relative max-w-4xl mx-auto px-4 py-16 md:py-24">
          <!-- Category badge -->
          <div v-if="categoryConfig" class="mb-4">
            <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur text-white">
              {{ categoryConfig.icon }} {{ categoryConfig.label }}
            </span>
          </div>

          <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            {{ guide.title }}
          </h1>

          <p v-if="guide.subtitle" class="text-lg md:text-xl text-white/80 mb-6 max-w-3xl">
            {{ guide.subtitle }}
          </p>

          <!-- Meta -->
          <div class="flex flex-wrap items-center gap-4 text-sm text-white/60">
            <span class="flex items-center gap-1.5">
              <CalendarOutlined />
              {{ formatDate(guide.publishedAt) }}
            </span>
            <span class="flex items-center gap-1.5">
              <ClockCircleOutlined />
              {{ guide.readingTimeMin }} min read
            </span>
            <span>By {{ guide.author }}</span>
            <span v-if="guide.updatedAt !== guide.publishedAt" class="text-white/40">
              Updated {{ formatDate(guide.updatedAt) }}
            </span>
          </div>
        </div>
      </section>

      <!-- Content area -->
      <div class="max-w-4xl mx-auto px-4 py-8">
        <!-- Breadcrumb -->
        <BreadcrumbNav :items="breadcrumbs" />

        <!-- Back link -->
        <RouterLink
          to="/guides"
          class="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors mb-6"
        >
          <ArrowLeftOutlined />
          All Guides
        </RouterLink>

        <div class="flex gap-8">
          <!-- Main content -->
          <article class="flex-1 min-w-0">
            <!-- Table of contents (mobile toggle) -->
            <div v-if="toc.length > 3" class="lg:hidden mb-6">
              <button
                @click="showTOC = !showTOC"
                class="flex items-center gap-2 w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-700"
              >
                <UnorderedListOutlined />
                Table of Contents
                <span class="ml-auto text-gray-400">{{ showTOC ? '−' : '+' }}</span>
              </button>
              <nav v-if="showTOC" class="mt-2 px-4 py-3 bg-white rounded-xl border border-gray-200">
                <ul class="space-y-2">
                  <li
                    v-for="item in toc"
                    :key="item.id"
                    :class="item.level === 3 ? 'pl-4' : ''"
                  >
                    <button
                      @click="scrollToSection(item.id)"
                      class="text-sm text-gray-600 hover:text-primary-600 transition-colors text-left"
                    >
                      {{ item.text }}
                    </button>
                  </li>
                </ul>
              </nav>
            </div>

            <!-- Rendered markdown -->
            <div
              class="prose-guide bg-white rounded-2xl p-6 md:p-10 shadow-soft"
              v-html="renderedContent"
            />

            <!-- Tags -->
            <div v-if="guide.tags && guide.tags.length" class="flex flex-wrap gap-2 mt-6">
              <span
                v-for="tag in guide.tags"
                :key="tag"
                class="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-600"
              >
                #{{ tag }}
              </span>
            </div>

            <!-- Related Guides -->
            <div v-if="relatedGuides.length" class="mt-10">
              <h3 class="text-lg font-bold text-gray-900 mb-4">More Travel Guides</h3>
              <div class="grid sm:grid-cols-3 gap-4">
                <RouterLink
                  v-for="related in relatedGuides"
                  :key="related.slug"
                  :to="`/guides/${related.slug}`"
                  class="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-primary-200 transition-all"
                >
                  <span
                    class="inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2"
                    :class="getCategoryConfig(related.category).color"
                  >
                    {{ getCategoryConfig(related.category).icon }} {{ getCategoryConfig(related.category).label }}
                  </span>
                  <h4 class="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
                    {{ related.title }}
                  </h4>
                  <p class="text-xs text-gray-500">{{ related.readingTimeMin }} min read</p>
                </RouterLink>
              </div>
            </div>

            <!-- Newsletter CTA -->
            <div class="mt-10">
              <NewsletterSignup source="guide-detail" />
            </div>
          </article>

          <!-- Sidebar TOC (desktop) -->
          <aside v-if="toc.length > 3" class="hidden lg:block w-64 shrink-0">
            <div class="sticky top-24">
              <h4 class="text-sm font-semibold text-gray-900 mb-3">In this guide</h4>
              <nav class="space-y-1.5">
                <button
                  v-for="item in toc"
                  :key="item.id"
                  @click="scrollToSection(item.id)"
                  class="block text-sm text-left w-full transition-colors"
                  :class="[
                    item.level === 3 ? 'pl-4 text-gray-400 hover:text-gray-600' : 'text-gray-600 hover:text-primary-600',
                  ]"
                >
                  {{ item.text }}
                </button>
              </nav>
            </div>
          </aside>
        </div>
      </div>
    </template>
  </div>
</template>
