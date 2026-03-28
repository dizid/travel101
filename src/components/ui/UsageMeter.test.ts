import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UsageMeter from './UsageMeter.vue'

describe('UsageMeter', () => {
  it('renders progress bar with correct width', () => {
    const wrapper = mount(UsageMeter, { props: { used: 3, limit: 10 } })
    const bar = wrapper.find('.h-full')
    expect(bar.attributes('style')).toContain('width: 30%')
  })

  it('caps percentage at 100%', () => {
    const wrapper = mount(UsageMeter, { props: { used: 15, limit: 10 } })
    const bar = wrapper.find('.h-full')
    expect(bar.attributes('style')).toContain('width: 100%')
  })

  it('applies red color when remaining is 0', () => {
    const wrapper = mount(UsageMeter, { props: { used: 10, limit: 10 } })
    const bar = wrapper.find('.h-full')
    expect(bar.classes()).toContain('bg-red-500')
  })

  it('applies amber color when remaining is 1', () => {
    const wrapper = mount(UsageMeter, { props: { used: 9, limit: 10 } })
    const bar = wrapper.find('.h-full')
    expect(bar.classes()).toContain('bg-amber-500')
  })

  it('applies primary color when remaining > 1', () => {
    const wrapper = mount(UsageMeter, { props: { used: 5, limit: 10 } })
    const bar = wrapper.find('.h-full')
    expect(bar.classes()).toContain('bg-primary-500')
  })

  it('shows label when showLabel is true', () => {
    const wrapper = mount(UsageMeter, { props: { used: 3, limit: 10, showLabel: true } })
    expect(wrapper.text()).toContain('3/10')
  })

  it('hides label when showLabel is false', () => {
    const wrapper = mount(UsageMeter, { props: { used: 3, limit: 10, showLabel: false } })
    expect(wrapper.text()).not.toContain('3/10')
  })

  it('hides label by default', () => {
    const wrapper = mount(UsageMeter, { props: { used: 3, limit: 10 } })
    expect(wrapper.find('span').exists()).toBe(false)
  })
})
