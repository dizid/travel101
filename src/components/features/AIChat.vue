<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useAI } from '@/composables/useAI'
import { useUserStore } from '@/stores/userStore'
import {
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  LoadingOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue'

const userStore = useUserStore()
const { ask, loading, conversationHistory, clearHistory } = useAI()

const inputMessage = ref('')
const chatContainer = ref<HTMLElement | null>(null)

async function sendMessage() {
  if (!inputMessage.value.trim() || loading.value) return

  const message = inputMessage.value.trim()
  inputMessage.value = ''

  await ask(message)

  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}
</script>

<template>
  <div class="flex flex-col h-full bg-white rounded-2xl shadow-thai overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
      <div class="flex items-center gap-2">
        <RobotOutlined class="text-lg" />
        <span class="font-semibold">Thailand Travel Advisor</span>
      </div>
      <button
        v-if="conversationHistory.length > 0"
        @click="clearHistory"
        class="p-2 hover:bg-white/20 rounded-lg transition-colors"
        title="Clear conversation"
      >
        <DeleteOutlined />
      </button>
    </div>

    <!-- Chat messages -->
    <div
      ref="chatContainer"
      class="flex-1 overflow-y-auto p-4 space-y-4"
    >
      <!-- Welcome message -->
      <div v-if="conversationHistory.length === 0" class="text-center py-8">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
          <RobotOutlined class="text-3xl text-primary-600" />
        </div>
        <h3 class="font-semibold text-gray-900 mb-2">How can I help you?</h3>
        <p class="text-sm text-gray-500 max-w-sm mx-auto">
          Ask me anything about Thailand travel - visas, destinations, local tips, or help planning your trip!
        </p>
        <div class="mt-6 flex flex-wrap justify-center gap-2">
          <button
            v-for="suggestion in [
              'What visa do I need?',
              'Best time to visit?',
              'Hidden gems to explore',
              'Safety tips',
            ]"
            :key="suggestion"
            @click="inputMessage = suggestion; sendMessage()"
            class="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
          >
            {{ suggestion }}
          </button>
        </div>
      </div>

      <!-- Messages -->
      <div
        v-for="(msg, index) in conversationHistory"
        :key="index"
        class="flex gap-3"
        :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
      >
        <div
          v-if="msg.role === 'assistant'"
          class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0"
        >
          <RobotOutlined class="text-primary-600" />
        </div>

        <div
          class="max-w-[80%] px-4 py-3 rounded-2xl"
          :class="msg.role === 'user'
            ? 'bg-primary-500 text-white rounded-br-none'
            : 'bg-gray-100 text-gray-900 rounded-bl-none'"
        >
          <p class="whitespace-pre-wrap text-sm">{{ msg.content }}</p>
        </div>

        <div
          v-if="msg.role === 'user'"
          class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0"
        >
          <UserOutlined class="text-gray-600" />
        </div>
      </div>

      <!-- Loading indicator -->
      <div v-if="loading" class="flex gap-3">
        <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
          <LoadingOutlined class="text-primary-600 animate-spin" />
        </div>
        <div class="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-none">
          <div class="flex gap-1">
            <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms" />
            <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms" />
            <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms" />
          </div>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="p-4 border-t border-gray-100">
      <div class="flex gap-2">
        <textarea
          v-model="inputMessage"
          @keydown="handleKeydown"
          placeholder="Ask about Thailand..."
          rows="1"
          class="flex-1 px-4 py-3 bg-gray-100 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          :disabled="loading"
        />
        <button
          @click="sendMessage"
          :disabled="!inputMessage.trim() || loading"
          class="px-4 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <SendOutlined />
        </button>
      </div>
      <p v-if="!userStore.isPro" class="text-xs text-gray-400 mt-2 text-center">
        Pro members get unlimited AI conversations
      </p>
    </div>
  </div>
</template>
