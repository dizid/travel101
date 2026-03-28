import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import AILimitBanner from './AILimitBanner.vue'

// Mock icons
vi.mock('@ant-design/icons-vue', () => ({
  ThunderboltOutlined: { template: '<span>⚡</span>' },
  CrownOutlined: { template: '<span>👑</span>' },
}))

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div/>' } },
    { path: '/dashboard', component: { template: '<div/>' } },
  ],
})

function mountBanner(props: { used: number; limit: number; featureName?: string; compact?: boolean }) {
  return mount(AILimitBanner, {
    props,
    global: { plugins: [router] },
  })
}

describe('AILimitBanner', () => {
  it('shows uses remaining when not exhausted', () => {
    const wrapper = mountBanner({ used: 3, limit: 10 })
    expect(wrapper.text()).toContain('7')
    expect(wrapper.text()).toContain('uses left today')
  })

  it('shows singular "use" when 1 remaining', () => {
    const wrapper = mountBanner({ used: 9, limit: 10 })
    expect(wrapper.text()).toContain('1')
    expect(wrapper.text()).toContain('use left today')
  })

  it('shows limit reached message when exhausted', () => {
    const wrapper = mountBanner({ used: 10, limit: 10 })
    expect(wrapper.text()).toContain('limit reached')
  })

  it('shows upgrade link when exhausted', () => {
    const wrapper = mountBanner({ used: 10, limit: 10 })
    const link = wrapper.find('a')
    expect(link.exists()).toBe(true)
    expect(link.text()).toContain('Upgrade')
  })

  it('shows upgrade link when low (1 remaining)', () => {
    const wrapper = mountBanner({ used: 9, limit: 10 })
    const link = wrapper.find('a')
    expect(link.exists()).toBe(true)
  })

  it('hides upgrade link when plenty of uses remaining', () => {
    const wrapper = mountBanner({ used: 3, limit: 10 })
    const link = wrapper.find('a')
    expect(link.exists()).toBe(false)
  })

  it('uses custom featureName', () => {
    const wrapper = mountBanner({ used: 10, limit: 10, featureName: 'Chat' })
    expect(wrapper.text()).toContain('Chat')
  })

  it('defaults featureName to AI', () => {
    const wrapper = mountBanner({ used: 10, limit: 10 })
    expect(wrapper.text()).toContain('AI')
  })

  it('hides progress bar when compact', () => {
    const wrapper = mountBanner({ used: 5, limit: 10, compact: true })
    expect(wrapper.find('.h-1\\.5').exists()).toBe(false)
  })

  it('shows progress bar when not compact', () => {
    const wrapper = mountBanner({ used: 5, limit: 10, compact: false })
    expect(wrapper.find('.h-1\\.5').exists()).toBe(true)
  })

  it('applies amber styling when exhausted', () => {
    const wrapper = mountBanner({ used: 10, limit: 10 })
    expect(wrapper.find('.rounded-lg').classes()).toContain('bg-amber-50')
  })

  it('applies default styling when plenty remaining', () => {
    const wrapper = mountBanner({ used: 3, limit: 10 })
    expect(wrapper.find('.rounded-lg').classes()).toContain('bg-gray-50')
  })
})
