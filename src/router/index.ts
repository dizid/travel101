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
    path: '/onward-ticket',
    name: 'onward-ticket',
    component: () => import('@views/OnwardTicketView.vue'),
    meta: { title: 'Onward Ticket — Flight Reservation', seoKey: 'onwardTicket' },
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
    path: '/packing',
    name: 'packing',
    component: () => import('@views/PackingView.vue'),
    meta: { title: 'AI Packing Assistant', requiresPro: true },
  },
  {
    path: '/safety',
    name: 'safety',
    component: () => import('@views/SafetyView.vue'),
    meta: { title: 'Thailand Safety Guide', requiresPro: true },
  },
  {
    path: '/90-day',
    name: '90-day',
    component: () => import('@views/NinetyDayView.vue'),
    meta: { title: '90-Day Reporting', requiresPro: true },
  },
  {
    path: '/medical',
    name: 'medical',
    component: () => import('@views/MedicalView.vue'),
    meta: { title: 'Medical Tourism', requiresPro: true },
  },
  {
    path: '/cost-calculator',
    name: 'cost-calculator',
    component: () => import('@views/CostCalculatorView.vue'),
    meta: { title: 'Cost of Living', requiresPro: true },
  },
  {
    path: '/setup-guide',
    name: 'setup-guide',
    component: () => import('@views/SetupGuideView.vue'),
    meta: { title: 'Thailand Setup Guide', requiresPro: true },
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
    path: '/people',
    name: 'people',
    component: () => import('@views/PeopleView.vue'),
    meta: { title: 'People of Chiang Mai' },
  },
  {
    path: '/heritage',
    name: 'heritage',
    component: () => import('@views/HeritageView.vue'),
    meta: { title: 'Thailand Heritage Sites', seoKey: 'heritage' },
  },
  {
    path: '/heritage/:slug',
    name: 'heritage-detail',
    component: () => import('@views/HeritageDetailView.vue'),
    meta: { title: 'Heritage Site', dynamicSeo: true },
  },
  {
    path: '/festivals',
    name: 'festivals',
    component: () => import('@views/FestivalsView.vue'),
    meta: { title: 'Thai Festivals & Events', seoKey: 'festivals' },
  },
  {
    path: '/festivals/:slug',
    name: 'festival-detail',
    component: () => import('@views/FestivalDetailView.vue'),
    meta: { title: 'Festival', dynamicSeo: true },
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
