import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// Mock the icons before importing the component
vi.mock('@ant-design/icons-vue', () => ({
  SendOutlined: { template: '<span data-testid="send-icon">Send</span>' },
  RobotOutlined: { template: '<span data-testid="robot-icon">Robot</span>' },
  UserOutlined: { template: '<span data-testid="user-icon">User</span>' },
  LoadingOutlined: { template: '<span data-testid="loading-icon">Loading</span>' },
  DeleteOutlined: { template: '<span data-testid="delete-icon">Delete</span>' },
  PlusOutlined: { template: '<span data-testid="plus-icon">Plus</span>' },
}))

// Mock the composables
vi.mock('@/composables/useAI', () => ({
  useAI: vi.fn(() => ({
    ask: vi.fn(),
    loading: { value: false },
    conversationHistory: { value: [] },
    conversationLoaded: { value: true },
    clearHistory: vi.fn(),
    loadConversation: vi.fn().mockResolvedValue(false),
    startNewConversation: vi.fn(),
    isPro: { value: false },
  })),
}))

vi.mock('@/stores/userStore', () => ({
  useUserStore: vi.fn(() => ({
    isPro: false,
  })),
}))

import AIChat from './AIChat.vue'

describe('AIChat', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders the chat container', () => {
      const wrapper = mount(AIChat)
      expect(wrapper.find('div').exists()).toBe(true)
    })

    it('renders header with Thailand Travel Advisor title', () => {
      const wrapper = mount(AIChat)
      expect(wrapper.text()).toContain('Thailand Travel Advisor')
    })

    it('renders textarea input field', () => {
      const wrapper = mount(AIChat)
      const textarea = wrapper.find('textarea')
      expect(textarea.exists()).toBe(true)
    })

    it('textarea has correct placeholder', () => {
      const wrapper = mount(AIChat)
      const textarea = wrapper.find('textarea')
      expect(textarea.attributes('placeholder')).toBe('Ask about Thailand...')
    })

    it('renders send button', () => {
      const wrapper = mount(AIChat)
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('shows Pro message for non-Pro users', () => {
      const wrapper = mount(AIChat)
      expect(wrapper.text()).toContain('Pro members get unlimited AI conversations')
    })
  })

  describe('input functionality', () => {
    it('textarea accepts text input', async () => {
      const wrapper = mount(AIChat)
      const textarea = wrapper.find('textarea')

      await textarea.setValue('Hello world')
      expect((textarea.element as HTMLTextAreaElement).value).toBe('Hello world')
    })

    it('textarea is not disabled initially', () => {
      const wrapper = mount(AIChat)
      const textarea = wrapper.find('textarea')

      // Textarea should not have disabled attribute when not loading
      expect(textarea.attributes('disabled')).toBeFalsy()
    })
  })

  describe('keyboard interaction', () => {
    it('handles keydown events on textarea', async () => {
      const wrapper = mount(AIChat)
      const textarea = wrapper.find('textarea')

      await textarea.setValue('Test message')

      // Should be able to trigger keydown without errors
      await textarea.trigger('keydown', { key: 'Enter' })

      expect(wrapper.find('textarea').exists()).toBe(true)
    })

    it('Shift+Enter does not clear input', async () => {
      const wrapper = mount(AIChat)
      const textarea = wrapper.find('textarea')

      await textarea.setValue('Test message')
      await textarea.trigger('keydown', { key: 'Enter', shiftKey: true })

      // With Shift+Enter, the message should remain (newline behavior)
      expect((textarea.element as HTMLTextAreaElement).value).toBe('Test message')
    })
  })

  describe('structure', () => {
    it('has a header section', () => {
      const wrapper = mount(AIChat)
      // Header has the Robot icon and title
      expect(wrapper.text()).toContain('Robot')
      expect(wrapper.text()).toContain('Thailand Travel Advisor')
    })

    it('has an input section with textarea and button', () => {
      const wrapper = mount(AIChat)

      expect(wrapper.find('textarea').exists()).toBe(true)
      expect(wrapper.findAll('button').length).toBeGreaterThan(0)
    })
  })

  describe('accessibility', () => {
    it('textarea has placeholder for context', () => {
      const wrapper = mount(AIChat)
      const textarea = wrapper.find('textarea')

      expect(textarea.attributes('placeholder')).toBeTruthy()
    })

    it('buttons exist for interaction', () => {
      const wrapper = mount(AIChat)
      const buttons = wrapper.findAll('button')

      expect(buttons.length).toBeGreaterThan(0)
    })
  })
})
