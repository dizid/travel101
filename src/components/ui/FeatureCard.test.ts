import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import FeatureCard from './FeatureCard.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div/>' } },
    { path: '/features', component: { template: '<div/>' } },
  ],
})

function mountFeatureCard(props: Record<string, unknown>) {
  return mount(FeatureCard, {
    props,
    global: { plugins: [router] },
  })
}

describe('FeatureCard', () => {
  it('renders icon, title, and description', () => {
    const wrapper = mountFeatureCard({
      icon: '🏛️',
      title: 'Temples',
      description: 'Explore ancient temples',
    })
    expect(wrapper.text()).toContain('🏛️')
    expect(wrapper.text()).toContain('Temples')
    expect(wrapper.text()).toContain('Explore ancient temples')
  })

  it('renders as div when no to prop', () => {
    const wrapper = mountFeatureCard({
      icon: '🏛️',
      title: 'Temples',
      description: 'Desc',
    })
    expect(wrapper.element.tagName).toBe('DIV')
  })

  it('renders as RouterLink when to prop is provided', () => {
    const wrapper = mountFeatureCard({
      icon: '🏛️',
      title: 'Temples',
      description: 'Desc',
      to: '/features',
    })
    expect(wrapper.find('a').exists()).toBe(true)
  })

  it('shows badge when badge prop is present', () => {
    const wrapper = mountFeatureCard({
      icon: '🏛️',
      title: 'Temples',
      description: 'Desc',
      badge: 'New',
    })
    expect(wrapper.text()).toContain('New')
  })

  it('does not show badge when badge prop is absent', () => {
    const wrapper = mountFeatureCard({
      icon: '🏛️',
      title: 'Temples',
      description: 'Desc',
    })
    const badges = wrapper.findAll('.rounded-full')
    expect(badges).toHaveLength(0)
  })

  it('applies gold badge color class', () => {
    const wrapper = mountFeatureCard({
      icon: '🏛️',
      title: 'Temples',
      description: 'Desc',
      badge: 'Pro',
      badgeColor: 'gold',
    })
    const badge = wrapper.find('.rounded-full')
    expect(badge.classes()).toContain('bg-amber-100')
    expect(badge.classes()).toContain('text-amber-700')
  })

  it('applies teal badge color class', () => {
    const wrapper = mountFeatureCard({
      icon: '🏛️',
      title: 'Temples',
      description: 'Desc',
      badge: 'Free',
      badgeColor: 'teal',
    })
    const badge = wrapper.find('.rounded-full')
    expect(badge.classes()).toContain('bg-teal-100')
  })

  it('defaults badge color to primary', () => {
    const wrapper = mountFeatureCard({
      icon: '🏛️',
      title: 'Temples',
      description: 'Desc',
      badge: 'Hot',
    })
    const badge = wrapper.find('.rounded-full')
    expect(badge.classes()).toContain('bg-primary-100')
  })
})
