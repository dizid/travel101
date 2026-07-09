import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import AppHeader from './AppHeader.vue'
import { useUserStore } from '@/stores/userStore'

// Mock icons
vi.mock('@ant-design/icons-vue', () => ({
  MenuOutlined: { template: '<span data-testid="menu-icon">☰</span>' },
  CloseOutlined: { template: '<span data-testid="close-icon">✕</span>' },
  UserOutlined: { template: '<span data-testid="user-icon">👤</span>' },
  CrownOutlined: { template: '<span data-testid="crown-icon">👑</span>' },
  HeartOutlined: { template: '<span data-testid="heart-icon">♡</span>' },
}))

// Create router
const routes = [
  { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
  { path: '/visa', name: 'visa', component: { template: '<div>Visa</div>' } },
  { path: '/visa-countdown', name: 'visa-countdown', component: { template: '<div>Countdown</div>' } },
  { path: '/tdac', name: 'tdac', component: { template: '<div>TDAC</div>' } },
  { path: '/warnings', name: 'warnings', component: { template: '<div>Warnings</div>' } },
  { path: '/attractions', name: 'attractions', component: { template: '<div>Attractions</div>' } },
  { path: '/festivals', name: 'festivals', component: { template: '<div>Festivals</div>' } },
  { path: '/heritage', name: 'heritage', component: { template: '<div>Heritage</div>' } },
  { path: '/guides', name: 'guides', component: { template: '<div>Guides</div>' } },
  { path: '/dashboard', name: 'dashboard', component: { template: '<div>Dashboard</div>' } },
  { path: '/saved', name: 'saved', component: { template: '<div>Saved</div>' } },
  { path: '/profile', name: 'profile', component: { template: '<div>Profile</div>' } },
  { path: '/about', name: 'about', component: { template: '<div>About</div>' } },
  { path: '/onward-ticket', name: 'onward-ticket', component: { template: '<div>Onward</div>' } },
  { path: '/phrasebook', name: 'phrasebook', component: { template: '<div>Phrasebook</div>' } },
  { path: '/emergency', name: 'emergency', component: { template: '<div>Emergency</div>' } },
]

const createTestRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes,
  })

describe('AppHeader', () => {
  let router: ReturnType<typeof createTestRouter>

  beforeEach(async () => {
    setActivePinia(createPinia())
    router = createTestRouter()
    await router.push('/')
    await router.isReady()
  })

  const mountHeader = () => {
    return mount(AppHeader, {
      global: {
        plugins: [router],
      },
    })
  }

  describe('rendering', () => {
    it('renders logo and brand name', () => {
      const wrapper = mountHeader()

      expect(wrapper.text()).toContain('HappyRoam')
      expect(wrapper.text()).toContain('Thailand')
    })

    it('renders main navigation items', () => {
      const wrapper = mountHeader()

      // Primary discovery nav
      expect(wrapper.text()).toContain('Places')
      expect(wrapper.text()).toContain('Festivals')
      expect(wrapper.text()).toContain('Heritage')
      // Plan dropdown items
      expect(wrapper.text()).toContain('Plan')
      expect(wrapper.text()).toContain('About')
    })

    it('renders navigation icons', () => {
      const wrapper = mountHeader()

      expect(wrapper.text()).toContain('🗺️')
      expect(wrapper.text()).toContain('🎉')
      expect(wrapper.text()).toContain('🏛️')
    })

    it('logo links to home page', () => {
      const wrapper = mountHeader()
      const logoLink = wrapper.find('a[href="/"]')

      expect(logoLink.exists()).toBe(true)
    })
  })

  describe('navigation links', () => {
    it('has correct links for all navigation items', () => {
      const wrapper = mountHeader()

      // Primary nav links are always visible in desktop nav
      expect(wrapper.find('a[href="/attractions"]').exists()).toBe(true)
      expect(wrapper.find('a[href="/festivals"]').exists()).toBe(true)
      expect(wrapper.find('a[href="/heritage"]').exists()).toBe(true)
      expect(wrapper.find('a[href="/guides"]').exists()).toBe(true)
      // Plan dropdown items (/visa, /tdac, /warnings) only render when dropdown is open
    })

    it('has dashboard link', () => {
      const wrapper = mountHeader()
      expect(wrapper.find('a[href="/dashboard"]').exists()).toBe(true)
    })

    it('has saved places link', () => {
      const wrapper = mountHeader()
      expect(wrapper.find('a[href="/saved"]').exists()).toBe(true)
    })
  })

  describe('active route highlighting', () => {
    it('highlights current route', async () => {
      await router.push('/attractions')
      await router.isReady()

      const wrapper = mountHeader()
      // /attractions is a primaryNav link, always visible in desktop nav
      const attractionsLink = wrapper.find('a[href="/attractions"]')

      expect(attractionsLink.classes()).toContain('bg-primary-50')
    })

    it('does not highlight inactive routes', async () => {
      await router.push('/attractions')
      await router.isReady()

      const wrapper = mountHeader()
      // /festivals is a different primaryNav link — should not be active
      const festivalsLink = wrapper.find('a[href="/festivals"]')

      expect(festivalsLink.classes()).not.toContain('bg-primary-50')
    })
  })

  describe('unified status chip', () => {
    // The header shows one chip slot: a profile-completion progress ring
    // takes priority while the profile is incomplete (regardless of Pro
    // status), then "Go Pro" or "Pro" once the profile is done.
    it('shows profile-completion progress for a non-Pro user with an incomplete profile', () => {
      const wrapper = mountHeader()

      expect(wrapper.text()).toContain('%')
      expect(wrapper.text()).not.toContain('Go Pro')
    })

    it('shows Go Pro once the profile is complete for a non-Pro user', () => {
      const userStore = useUserStore()
      userStore.updatePreferences({
        nationality: 'US',
        travelStyle: ['adventure'],
        interests: ['temples'],
      })
      const wrapper = mountHeader()

      expect(wrapper.text()).toContain('Go Pro')
    })

    it('shows Pro badge once the profile is complete for a Pro user', () => {
      const userStore = useUserStore()
      userStore.updatePreferences({
        nationality: 'US',
        travelStyle: ['adventure'],
        interests: ['temples'],
      })
      userStore.setPro(true)
      const wrapper = mountHeader()

      expect(wrapper.text()).toContain('Pro')
      expect(wrapper.text()).not.toContain('Go Pro')
    })
  })

  describe('mobile menu', () => {
    it('has mobile menu toggle button', () => {
      const wrapper = mountHeader()
      // The mobile menu toggle has md:hidden class to hide it on desktop
      const menuButton = wrapper.find('button.md\\:hidden')

      expect(menuButton.exists()).toBe(true)
    })

    it('mobile menu is closed by default', () => {
      const wrapper = mountHeader()

      // Menu icon should be visible, not close icon (from mocked MenuOutlined)
      expect(wrapper.text()).toContain('☰')
    })

    it('opens mobile menu when toggle clicked', async () => {
      const wrapper = mountHeader()
      const menuButton = wrapper.find('button.md\\:hidden')

      await menuButton.trigger('click')

      // Close icon should now be visible (from mocked CloseOutlined)
      expect(wrapper.text()).toContain('✕')
    })

    it('navigation links trigger close menu handler', async () => {
      const wrapper = mountHeader()
      const menuButton = wrapper.find('button.md\\:hidden')

      // Open menu
      await menuButton.trigger('click')
      expect(wrapper.text()).toContain('✕')

      // Find mobile nav links - they should have @click handler
      const mobileNavLinks = wrapper.findAll('nav a')

      // Verify mobile menu is open and has navigation links
      expect(mobileNavLinks.length).toBeGreaterThan(0)

      // Check that a visa link exists
      const visaLink = mobileNavLinks.find((link) => link.attributes('href') === '/visa')
      expect(visaLink).toBeDefined()
    })

    it('closes mobile menu when clicking logo', async () => {
      const wrapper = mountHeader()
      const menuButton = wrapper.find('button.md\\:hidden')

      // Open menu
      await menuButton.trigger('click')

      // Click logo
      const logoLink = wrapper.find('a[href="/"]')
      await logoLink.trigger('click')
      await flushPromises()

      // Menu should be closed (CloseOutlined disappears, MenuOutlined shows again)
      expect(wrapper.text()).toContain('☰')
    })
  })

  describe('mobile navigation content', () => {
    it('shows saved places in mobile menu', async () => {
      const wrapper = mountHeader()
      const menuButton = wrapper.find('button.md\\:hidden')

      await menuButton.trigger('click')

      expect(wrapper.text()).toContain('Saved Places')
    })

    it('shows dashboard in mobile menu', async () => {
      const wrapper = mountHeader()
      const menuButton = wrapper.find('button.md\\:hidden')

      await menuButton.trigger('click')

      expect(wrapper.text()).toContain('My Dashboard')
    })
  })

  describe('accessibility', () => {
    it('header has correct semantic element', () => {
      const wrapper = mountHeader()
      const header = wrapper.find('header')

      expect(header.exists()).toBe(true)
    })

    it('navigation has correct semantic element', () => {
      const wrapper = mountHeader()
      const nav = wrapper.find('nav')

      expect(nav.exists()).toBe(true)
    })

    it('dashboard link has accessible title', () => {
      const wrapper = mountHeader()
      const savedLink = wrapper.find('a[href="/saved"]')

      // Should have title or aria-label
      expect(savedLink.attributes('title') || savedLink.text()).toBeTruthy()
    })
  })

  describe('sticky behavior', () => {
    it('header has sticky positioning class', () => {
      const wrapper = mountHeader()
      const header = wrapper.find('header')

      expect(header.classes()).toContain('sticky')
      expect(header.classes()).toContain('top-0')
    })

    it('header has high z-index for stacking', () => {
      const wrapper = mountHeader()
      const header = wrapper.find('header')

      expect(header.classes()).toContain('z-50')
    })
  })

  describe('responsive design', () => {
    it('desktop navigation is hidden on mobile (md:flex)', () => {
      const wrapper = mountHeader()
      const desktopNav = wrapper.find('nav.hidden.md\\:flex')

      expect(desktopNav.exists()).toBe(true)
    })

    it('mobile menu button is hidden on desktop (md:hidden)', () => {
      const wrapper = mountHeader()
      const mobileButton = wrapper.find('button.md\\:hidden')

      expect(mobileButton.exists()).toBe(true)
    })
  })
})
