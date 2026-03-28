import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import EmptyState from './EmptyState.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div/>' } },
    { path: '/attractions', component: { template: '<div/>' } },
  ],
})

function mountEmptyState(props: Record<string, unknown>) {
  return mount(EmptyState, {
    props,
    global: { plugins: [router] },
  })
}

describe('EmptyState', () => {
  it('renders icon, title, and description', () => {
    const wrapper = mountEmptyState({
      icon: '🔍',
      title: 'No Results',
      description: 'Try a different search',
    })
    expect(wrapper.text()).toContain('🔍')
    expect(wrapper.text()).toContain('No Results')
    expect(wrapper.text()).toContain('Try a different search')
  })

  it('renders RouterLink when actionTo is provided', () => {
    const wrapper = mountEmptyState({
      icon: '🔍',
      title: 'No Results',
      description: 'Try browsing',
      actionLabel: 'Browse All',
      actionTo: '/attractions',
    })
    const link = wrapper.find('a')
    expect(link.exists()).toBe(true)
    expect(link.text()).toBe('Browse All')
  })

  it('renders button when actionLabel but no actionTo', () => {
    const wrapper = mountEmptyState({
      icon: '🔍',
      title: 'No Results',
      description: 'Try again',
      actionLabel: 'Retry',
    })
    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    expect(button.text()).toBe('Retry')
  })

  it('emits action event on button click', async () => {
    const wrapper = mountEmptyState({
      icon: '🔍',
      title: 'No Results',
      description: 'Try again',
      actionLabel: 'Retry',
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('action')).toHaveLength(1)
  })

  it('shows no action element when neither actionTo nor actionLabel', () => {
    const wrapper = mountEmptyState({
      icon: '🔍',
      title: 'No Results',
      description: 'Nothing to do',
    })
    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.find('a').exists()).toBe(false)
  })
})
