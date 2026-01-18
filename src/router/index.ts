import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { updateMetaTags, getPageMeta } from '@/utils/seo'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@views/HomeView.vue'),
    meta: { title: 'Thailand Travel Guide', seoKey: 'home' },
  },
  {
    path: '/visa',
    name: 'visa',
    component: () => import('@views/VisaWizardView.vue'),
    meta: { title: 'Thailand Visa Guide', seoKey: 'visa' },
  },
  {
    path: '/tdac',
    name: 'tdac',
    component: () => import('@views/TDACGuideView.vue'),
    meta: { title: 'Thailand Arrival Card Guide', seoKey: 'tdac' },
  },
  {
    path: '/warnings',
    name: 'warnings',
    component: () => import('@views/WarningsView.vue'),
    meta: { title: 'Thailand Travel Tips', seoKey: 'warnings' },
  },
  {
    path: '/attractions',
    name: 'attractions',
    component: () => import('@views/AttractionsView.vue'),
    meta: { title: 'Places to Visit in Thailand', seoKey: 'attractions' },
  },
  {
    path: '/attractions/:id',
    name: 'attraction-detail',
    component: () => import('@views/AttractionDetailView.vue'),
    meta: { title: 'Attraction', dynamicSeo: true },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@views/DashboardView.vue'),
    meta: { title: 'My Dashboard', seoKey: 'dashboard', requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@views/ProfileView.vue'),
    meta: { title: 'Travel Profile', seoKey: 'profile' },
  },
  {
    path: '/itinerary',
    name: 'itinerary',
    component: () => import('@views/ItineraryView.vue'),
    meta: { title: 'Trip Itinerary Planner', seoKey: 'itinerary', requiresPro: true },
  },
  {
    path: '/alerts',
    name: 'alerts',
    component: () => import('@views/AlertsView.vue'),
    meta: { title: 'Oversight Alerts', requiresPro: true },
  },
  {
    path: '/smart-match',
    name: 'smart-match',
    component: () => import('@views/SmartMatchView.vue'),
    meta: { title: 'Smart Match', requiresPro: true },
  },
  {
    path: '/saved',
    name: 'saved',
    component: () => import('@views/SavedPlacesView.vue'),
    meta: { title: 'Saved Places', requiresAuth: true },
  },
  {
    path: '/privacy',
    name: 'privacy',
    component: () => import('@views/PrivacyView.vue'),
    meta: { title: 'Privacy Policy' },
  },
  {
    path: '/terms',
    name: 'terms',
    component: () => import('@views/TermsView.vue'),
    meta: { title: 'Terms of Service' },
  },
  {
    path: '/contact',
    name: 'contact',
    component: () => import('@views/ContactView.vue'),
    meta: { title: 'Contact Us' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@views/NotFoundView.vue'),
    meta: { title: 'Page Not Found' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    return { top: 0, behavior: 'smooth' }
  },
})

// Update page title and meta tags
router.beforeEach((to, _from, next) => {
  const seoKey = to.meta.seoKey as string | undefined
  const dynamicSeo = to.meta.dynamicSeo as boolean | undefined

  // For pages with static SEO, update meta tags from pageMeta config
  if (seoKey && !dynamicSeo) {
    const meta = getPageMeta(seoKey as any)
    updateMetaTags({
      ...meta,
      url: to.path,
    })
  } else if (!dynamicSeo) {
    // Fallback for pages without seoKey
    const title = to.meta.title as string
    updateMetaTags({
      title: title || 'Thailand Travel Guide',
      description: 'Your personalized Thailand travel guide with AI-powered recommendations.',
      url: to.path,
    })
  }
  // dynamicSeo pages (like attraction-detail) handle their own meta in the component

  next()
})

export default router
