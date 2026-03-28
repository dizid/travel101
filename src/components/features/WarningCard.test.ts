import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import WarningCard from './WarningCard.vue'
import type { Warning, SeverityLevel } from '@/types'

function makeWarning(overrides: Partial<Warning> = {}): Warning {
  return {
    id: 'w-1',
    countryId: 'TH',
    category: 'scams',
    title: 'Common Taxi Scam',
    content: 'Always use the meter when taking taxis in Bangkok.',
    severity: 3 as SeverityLevel,
    tags: ['taxi', 'bangkok'],
    ...overrides,
  }
}

function mountWarningCard(warning: Warning, compact = false) {
  return mount(WarningCard, {
    props: { warning, compact },
  })
}

describe('WarningCard', () => {
  it('renders warning title and content', () => {
    const wrapper = mountWarningCard(makeWarning())
    expect(wrapper.text()).toContain('Common Taxi Scam')
    expect(wrapper.text()).toContain('Always use the meter')
  })

  it('shows tip icon and label for severity 1', () => {
    const wrapper = mountWarningCard(makeWarning({ severity: 1 }))
    expect(wrapper.text()).toContain('💡')
    expect(wrapper.text()).toContain('Tip')
  })

  it('shows note label for severity 2', () => {
    const wrapper = mountWarningCard(makeWarning({ severity: 2 }))
    expect(wrapper.text()).toContain('📋')
    expect(wrapper.text()).toContain('Note')
  })

  it('shows warning label for severity 3', () => {
    const wrapper = mountWarningCard(makeWarning({ severity: 3 }))
    expect(wrapper.text()).toContain('⚠️')
    expect(wrapper.text()).toContain('Heads Up')
  })

  it('shows important label for severity 4', () => {
    const wrapper = mountWarningCard(makeWarning({ severity: 4 }))
    expect(wrapper.text()).toContain('🚨')
    expect(wrapper.text()).toContain('Important')
  })

  it('maps category to readable label', () => {
    const wrapper = mountWarningCard(makeWarning({ category: 'royal_family' }))
    expect(wrapper.text()).toContain('Royal Family')
  })

  it('falls back to raw category when no label exists', () => {
    const wrapper = mountWarningCard(makeWarning({ category: 'other' as any }))
    expect(wrapper.text()).toContain('other')
  })

  it('renders tags when not compact', () => {
    const wrapper = mountWarningCard(makeWarning({ tags: ['taxi', 'bangkok'] }), false)
    expect(wrapper.text()).toContain('#taxi')
    expect(wrapper.text()).toContain('#bangkok')
  })

  it('hides tags when compact', () => {
    const wrapper = mountWarningCard(makeWarning({ tags: ['taxi'] }), true)
    expect(wrapper.text()).not.toContain('#taxi')
  })

  it('applies compact padding', () => {
    const wrapper = mountWarningCard(makeWarning(), true)
    expect(wrapper.find('article').classes()).toContain('p-4')
  })

  it('applies full padding by default', () => {
    const wrapper = mountWarningCard(makeWarning(), false)
    expect(wrapper.find('article').classes()).toContain('p-6')
  })

  it('applies severity background classes', () => {
    const wrapper = mountWarningCard(makeWarning({ severity: 4 }))
    const icon = wrapper.find('.flex-shrink-0')
    expect(icon.classes()).toContain('bg-red-100')
  })
})
