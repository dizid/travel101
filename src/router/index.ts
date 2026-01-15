import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@views/HomeView.vue'),
    meta: { title: 'Welcome to Thailand' },
  },
  {
    path: '/visa',
    name: 'visa',
    component: () => import('@views/VisaWizardView.vue'),
    meta: { title: 'Visa Guide' },
  },
  {
    path: '/tdac',
    name: 'tdac',
    component: () => import('@views/TDACGuideView.vue'),
    meta: { title: 'TDAC Guide' },
  },
  {
    path: '/warnings',
    name: 'warnings',
    component: () => import('@views/WarningsView.vue'),
    meta: { title: 'Good to Know' },
  },
  {
    path: '/attractions',
    name: 'attractions',
    component: () => import('@views/AttractionsView.vue'),
    meta: { title: 'Places to Visit' },
  },
  {
    path: '/attractions/:id',
    name: 'attraction-detail',
    component: () => import('@views/AttractionDetailView.vue'),
    meta: { title: 'Attraction' },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@views/DashboardView.vue'),
    meta: { title: 'My Dashboard', requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@views/ProfileView.vue'),
    meta: { title: 'My Profile' },
  },
  {
    path: '/itinerary',
    name: 'itinerary',
    component: () => import('@views/ItineraryView.vue'),
    meta: { title: 'Plan Your Trip', requiresPro: true },
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

// Update page title
router.beforeEach((to, _from, next) => {
  const title = to.meta.title as string
  document.title = title
    ? `${title} | Global Smart Traveler`
    : 'Global Smart Traveler'
  next()
})

export default router
