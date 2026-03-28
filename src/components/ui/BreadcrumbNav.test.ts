import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import BreadcrumbNav from './BreadcrumbNav.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div/>' } },
    { path: '/attractions', component: { template: '<div/>' } },
    { path: '/attractions/:id', component: { template: '<div/>' } },
  ],
})

function mountBreadcrumb(items: { name: string; url?: string }[]) {
  return mount(BreadcrumbNav, {
    props: { items },
    global: { plugins: [router] },
  })
}

describe('BreadcrumbNav', () => {
  it('renders all breadcrumb items', () => {
    const wrapper = mountBreadcrumb([
      { name: 'Home', url: '/' },
      { name: 'Attractions', url: '/attractions' },
      { name: 'Grand Palace' },
    ])
    expect(wrapper.text()).toContain('Home')
    expect(wrapper.text()).toContain('Attractions')
    expect(wrapper.text()).toContain('Grand Palace')
  })

  it('renders last item as plain text (not a link)', () => {
    const wrapper = mountBreadcrumb([
      { name: 'Home', url: '/' },
      { name: 'Current Page' },
    ])
    const items = wrapper.findAll('li')
    const lastItem = items[items.length - 1]
    expect(lastItem.find('a').exists()).toBe(false)
    expect(lastItem.find('.text-gray-700').text()).toBe('Current Page')
  })

  it('renders middle items with URLs as links', () => {
    const wrapper = mountBreadcrumb([
      { name: 'Home', url: '/' },
      { name: 'Attractions', url: '/attractions' },
      { name: 'Detail' },
    ])
    const links = wrapper.findAll('a')
    expect(links).toHaveLength(2)
  })

  it('shows separator between items', () => {
    const wrapper = mountBreadcrumb([
      { name: 'Home', url: '/' },
      { name: 'Detail' },
    ])
    expect(wrapper.text()).toContain('/')
  })

  it('has correct accessibility label', () => {
    const wrapper = mountBreadcrumb([{ name: 'Home' }])
    const nav = wrapper.find('nav')
    expect(nav.attributes('aria-label')).toBe('Breadcrumb')
  })
})
