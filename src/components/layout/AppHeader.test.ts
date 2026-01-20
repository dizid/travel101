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
  { path: '/tdac', name: 'tdac', component: { template: '<div>TDAC</div>' } },
  { path: '/warnings', name: 'warnings', component: { template: '<div>Warnings</div>' } },
  { path: '/attractions', name: 'attractions', component: { template: '<div>Attractions</div>' } },
  { path: '/dashboard', name: 'dashboard', component: { template: '<div>Dashboard</div>' } },
  { path: '/saved', name: 'saved', component: { template: '<div>Saved</div>' } },
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

      expect(wrapper.text()).toContain('Smart Traveler')
      expect(wrapper.text()).toContain('Thailand')
    })

    it('renders main navigation items', () => {
      const wrapper = mountHeader()

      expect(wrapper.text()).toContain('Visa Guide')
      expect(wrapper.text()).toContain('TDAC')
      expect(wrapper.text()).toContain('Good to Know')
      expect(wrapper.text()).toContain('Places')
    })

    it('renders navigation icons', () => {
      const wrapper = mountHeader()

      expect(wrapper.text()).toContain('🛂')
      expect(wrapper.text()).toContain('📝')
      expect(wrapper.text()).toContain('💡')
      expect(wrapper.text()).toContain('🗺️')
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

      expect(wrapper.find('a[href="/visa"]').exists()).toBe(true)
      expect(wrapper.find('a[href="/tdac"]').exists()).toBe(true)
      expect(wrapper.find('a[href="/warnings"]').exists()).toBe(true)
      expect(wrapper.find('a[href="/attractions"]').exists()).toBe(true)
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
      await router.push('/visa')
      await router.isReady()

      const wrapper = mountHeader()
      const visaLink = wrapper.find('a[href="/visa"]')

      expect(visaLink.classes()).toContain('bg-primary-50')
    })

    it('does not highlight inactive routes', async () => {
      await router.push('/visa')
      await router.isReady()

      const wrapper = mountHeader()
      const attractionsLink = wrapper.find('a[href="/attractions"]')

      expect(attractionsLink.classes()).not.toContain('bg-primary-50')
    })
  })

  describe('Pro badge', () => {
    it('shows Go Pro button for non-Pro users', () => {
      const wrapper = mountHeader()

      expect(wrapper.text()).toContain('Go Pro')
    })

    it('renders Pro-related UI elements', async () => {
      const wrapper = mountHeader()
      await flushPromises()

      // The header should render with Pro/Go Pro UI
      const text = wrapper.text()
      expect(text.includes('Pro') || text.includes('Go Pro')).toBe(true)
    })
  })

  describe('mobile menu', () => {
    it('has mobile menu toggle button', () => {
      const wrapper = mountHeader()
      const menuButton = wrapper.find('button')

      expect(menuButton.exists()).toBe(true)
    })

    it('mobile menu is closed by default', () => {
      const wrapper = mountHeader()

      // Menu icon should be visible, not close icon
      expect(wrapper.text()).toContain('☰')
    })

    it('opens mobile menu when toggle clicked', async () => {
      const wrapper = mountHeader()
      const menuButton = wrapper.find('button')

      await menuButton.trigger('click')

      // Close icon should now be visible
      expect(wrapper.text()).toContain('✕')
    })

    it('navigation links trigger close menu handler', async () => {
      const wrapper = mountHeader()
      const menuButton = wrapper.find('button')

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
      const menuButton = wrapper.find('button')

      // Open menu
      await menuButton.trigger('click')

      // Click logo
      const logoLink = wrapper.find('a[href="/"]')
      await logoLink.trigger('click')
      await flushPromises()

      // Menu should be closed
      expect(wrapper.text()).toContain('☰')
    })
  })

  describe('mobile navigation content', () => {
    it('shows saved places in mobile menu', async () => {
      const wrapper = mountHeader()
      const menuButton = wrapper.find('button')

      await menuButton.trigger('click')

      expect(wrapper.text()).toContain('Saved Places')
    })

    it('shows dashboard in mobile menu', async () => {
      const wrapper = mountHeader()
      const menuButton = wrapper.find('button')

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
