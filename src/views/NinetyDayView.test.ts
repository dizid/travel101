import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'

// Icons render as plain spans in tests
vi.mock('@ant-design/icons-vue', () => {
  const icon = { template: '<span />' }
  return {
    CalendarOutlined: icon,
    CheckCircleFilled: icon,
    ClockCircleOutlined: icon,
    EnvironmentOutlined: icon,
    ExportOutlined: icon,
    BellOutlined: icon,
    LockOutlined: icon,
  }
})

// A Pro member viewing the page
vi.mock('@stores/userStore', () => ({
  useUserStore: vi.fn(() => ({ isPro: true })),
}))

vi.mock('@/composables/useSeo', () => ({
  useRouteSeo: vi.fn(),
}))

vi.mock('@/components/common/ToolIntro.vue', () => ({
  default: { template: '<div />' },
}))

import NinetyDayView from './NinetyDayView.vue'

async function mountView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/visa-countdown', component: { template: '<div />' } },
      { path: '/dashboard', component: { template: '<div />' } },
    ],
  })
  router.push('/')
  await router.isReady()
  const wrapper = mount(NinetyDayView, { global: { plugins: [router] } })
  await flushPromises()
  return wrapper
}

function saveStay(entry: object) {
  localStorage.setItem('happyroam_visa_countdown', JSON.stringify(entry))
}

describe('NinetyDayView (Pro)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'))
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('asks for an entry date when no stay is saved, and shows no made-up dates', async () => {
    const wrapper = await mountView()
    const text = wrapper.text()
    expect(text).toContain('Set my entry date')
    expect(text).not.toContain('2024')
    expect(text).not.toContain('Est. wait')
  })

  it('shows the saved entry, the next due date and the official window', async () => {
    saveStay({ entryDate: '2026-06-01', visaType: 'dtv', ninetyDayReports: [] })
    const wrapper = await mountView()
    const text = wrapper.text()
    expect(text).toContain('1 Jun 2026')
    expect(text).toContain('30 Aug 2026')
    expect(text).toContain('in 76 days')
    expect(text).toContain('15 Aug 2026')
    expect(text).toMatch(/6 Sept? 2026/)
    expect(text).toContain('Add reminder to calendar')
  })

  it('warns about the 2,000 THB fine once the 7-day window has closed', async () => {
    // Entry 2026-03-01 => due 2026-05-30, 16 days ago, nothing reported
    saveStay({ entryDate: '2026-03-01', visaType: 'retirement-visa', ninetyDayReports: [] })
    const wrapper = await mountView()
    expect(wrapper.text()).toContain('2,000 THB fine')
    expect(wrapper.text()).not.toContain('Add reminder to calendar')
  })

  it('says a short stay needs no report', async () => {
    saveStay({ entryDate: '2026-06-01', visaType: 'visa-exemption', ninetyDayReports: [] })
    const wrapper = await mountView()
    expect(wrapper.text()).toContain('no 90-day report is due')
  })

  it('links the official online TM.47 site', async () => {
    const wrapper = await mountView()
    const link = wrapper.find('a[href="https://tm47.immigration.go.th"]')
    expect(link.exists()).toBe(true)
  })
})
