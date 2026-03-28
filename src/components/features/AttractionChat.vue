<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useAI } from '@/composables/useAI'
import { useUserStore } from '@/stores/userStore'
import { generateAffiliateUrl } from '@/utils/affiliates'
import {
  CloseOutlined,
  SendOutlined,
  LoadingOutlined,
  RobotOutlined,
} from '@ant-design/icons-vue'

const props = defineProps<{
  isOpen: boolean
  attractionSlug: string
  attractionName: string
  attractionProvince?: string
}>()

const emit = defineEmits<{
  close: []
}>()

const userStore = useUserStore()
const { askAboutAttraction, getAttractionHistory, loading, clearAttractionHistory } = useAI()

// Map of bold partner names the AI may produce to their affiliate URLs.
// Computed so URLs update reactively if prop changes.
const partnerMap = computed(() => {
  const destination = props.attractionProvince || 'Thailand'
  const attraction = props.attractionName
  return [
    {
      pattern: /\*\*Klook\*\*/g,
      label: 'Klook',
      url: generateAffiliateUrl('klook', destination, attraction),
    },
    {
      pattern: /\*\*GetYourGuide\*\*/g,
      label: 'GetYourGuide',
      url: generateAffiliateUrl('getyourguide', destination, attraction),
    },
    {
      pattern: /\*\*Agoda\*\*/g,
      label: 'Agoda',
      url: generateAffiliateUrl('agoda', destination),
    },
    {
      pattern: /\*\*12Go Asia\*\*/g,
      label: '12Go Asia',
      url: generateAffiliateUrl('12go', destination),
    },
    {
      pattern: /\*\*12Go\*\*/g,
      label: '12Go',
      url: generateAffiliateUrl('12go', destination),
    },
    {
      pattern: /\*\*SafetyWing\*\*/g,
      label: 'SafetyWing',
      url: generateAffiliateUrl('safetywing', destination),
    },
  ]
})

/**
 * Convert AI response text to safe HTML:
 * 1. Escape all HTML entities to prevent XSS
 * 2. Replace **PartnerName** patterns with clickable affiliate links
 * 3. Convert newlines to <br> for whitespace preservation
 */
function renderAIMessage(text: string): string {
  // Step 1: escape HTML — must happen before any link injection
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

  // Step 2: replace **PartnerName** patterns with affiliate anchor tags
  let result = escaped
  for (const { pattern, label, url } of partnerMap.value) {
    const safeUrl = encodeURI(url)
    const link = `<a href="${safeUrl}" target="_blank" rel="nofollow noopener noreferrer" class="text-blue-600 underline font-semibold hover:text-blue-800">${label}</a>`
    result = result.replace(pattern, link)
  }

  // Step 3: preserve line breaks
  return result.replace(/\n/g, '<br>')
}

const inputMessage = ref('')
const messagesContainer = ref<HTMLElement | null>(null)

// Get conversation history for this attraction
const messages = computed(() => getAttractionHistory(props.attractionSlug))

// Generate suggested questions based on user profile
const suggestedQuestions = computed(() => {
  const prefs = userStore.profile.prefs
  const questions: string[] = []

  // Base questions
  questions.push(`What's the best time to visit ${props.attractionName}?`)
  questions.push('What should I not miss here?')

  // Profile-based questions
  if (prefs?.budget === 'budget') {
    questions.push('What are some budget-friendly tips?')
  } else if (prefs?.budget === 'luxury') {
    questions.push('What premium experiences are available?')
  }

  if (prefs?.groupType === 'family') {
    questions.push('Is this place family-friendly?')
  } else if (prefs?.groupType === 'couple') {
    questions.push('What romantic spots are nearby?')
  } else if (prefs?.groupType === 'solo') {
    questions.push('Is this safe for solo travelers?')
  }

  if (prefs?.interests?.includes('food')) {
    questions.push('What local food should I try here?')
  }

  if (prefs?.interests?.includes('temples')) {
    questions.push('What cultural etiquette should I know?')
  }

  if (prefs?.tripType === 'digital_nomad') {
    questions.push('Are there good cafes with WiFi nearby?')
  }

  return questions.slice(0, 4)
})

async function sendMessage() {
  const message = inputMessage.value.trim()
  if (!message || loading.value) return

  inputMessage.value = ''
  await askAboutAttraction(props.attractionSlug, message)
  scrollToBottom()
}

async function askQuestion(question: string) {
  if (loading.value) return
  await askAboutAttraction(props.attractionSlug, question)
  scrollToBottom()
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

function handleClose() {
  emit('close')
}

function handleNewChat() {
  clearAttractionHistory(props.attractionSlug)
}

// Scroll to bottom when new messages arrive
watch(messages, () => {
  scrollToBottom()
}, { deep: true })

// Scroll to bottom when chat opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    scrollToBottom()
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="chat-backdrop">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        @click="handleClose"
      />
    </Transition>

    <Transition name="chat-panel">
      <div
        v-if="isOpen"
        class="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-white rounded-t-2xl shadow-2xl max-h-[80vh] md:max-h-[70vh] md:max-w-lg md:left-auto md:right-4 md:bottom-4 md:rounded-2xl"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <RobotOutlined class="text-primary-600" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 text-sm">Ask about {{ attractionName }}</h3>
              <p class="text-xs text-gray-500">AI travel advisor</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="messages.length > 0"
              @click="handleNewChat"
              class="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
            >
              New chat
            </button>
            <button
              @click="handleClose"
              class="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <CloseOutlined class="text-gray-500" />
            </button>
          </div>
        </div>

        <!-- Messages -->
        <div
          ref="messagesContainer"
          class="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]"
        >
          <!-- Empty state with suggestions -->
          <div v-if="messages.length === 0" class="space-y-4">
            <p class="text-sm text-gray-600 text-center">
              Ask me anything about {{ attractionName }}!
            </p>

            <div class="space-y-2">
              <p class="text-xs text-gray-500 text-center">Quick questions</p>
              <div class="flex flex-wrap gap-2 justify-center">
                <button
                  v-for="question in suggestedQuestions"
                  :key="question"
                  @click="askQuestion(question)"
                  :disabled="loading"
                  class="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors disabled:opacity-50"
                >
                  {{ question }}
                </button>
              </div>
            </div>
          </div>

          <!-- Chat messages -->
          <template v-for="(message, index) in messages" :key="index">
            <!-- User message -->
            <div v-if="message.role === 'user'" class="flex justify-end">
              <div class="flex items-end gap-2 max-w-[80%]">
                <div class="bg-primary-600 text-white rounded-2xl rounded-br-sm px-4 py-2">
                  <p class="text-sm">{{ message.content }}</p>
                </div>
              </div>
            </div>

            <!-- Assistant message: rendered as HTML so partner names become clickable links.
                 Content is HTML-escaped in renderAIMessage before links are injected — XSS safe. -->
            <div v-else class="flex justify-start">
              <div class="flex items-end gap-2 max-w-[85%]">
                <div class="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <RobotOutlined class="text-primary-600 text-xs" />
                </div>
                <div class="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-2">
                  <p class="text-sm text-gray-800" v-html="renderAIMessage(message.content)" />
                </div>
              </div>
            </div>
          </template>

          <!-- Loading indicator -->
          <div v-if="loading" class="flex justify-start">
            <div class="flex items-end gap-2">
              <div class="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <RobotOutlined class="text-primary-600 text-xs" />
              </div>
              <div class="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                <LoadingOutlined class="text-gray-500" />
              </div>
            </div>
          </div>
        </div>

        <!-- Suggested questions (when there are messages) -->
        <div v-if="messages.length > 0 && messages.length < 6" class="px-4 pb-2">
          <div class="flex gap-2 overflow-x-auto pb-2">
            <button
              v-for="question in suggestedQuestions.slice(0, 2)"
              :key="question"
              @click="askQuestion(question)"
              :disabled="loading"
              class="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full whitespace-nowrap transition-colors disabled:opacity-50"
            >
              {{ question }}
            </button>
          </div>
        </div>

        <!-- Input -->
        <div class="p-4 border-t border-gray-100">
          <form @submit.prevent="sendMessage" class="flex gap-2">
            <input
              v-model="inputMessage"
              type="text"
              :placeholder="`Ask about ${attractionName}...`"
              class="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
              :disabled="loading"
            />
            <button
              type="submit"
              :disabled="!inputMessage.trim() || loading"
              class="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SendOutlined v-if="!loading" />
              <LoadingOutlined v-else />
            </button>
          </form>
          <p class="text-xs text-gray-400 text-center mt-2">
            AI-powered travel advice
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Backdrop transition */
.chat-backdrop-enter-active,
.chat-backdrop-leave-active {
  transition: opacity 0.2s ease;
}
.chat-backdrop-enter-from,
.chat-backdrop-leave-to {
  opacity: 0;
}

/* Panel transition */
.chat-panel-enter-active,
.chat-panel-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.chat-panel-enter-from,
.chat-panel-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

@media (min-width: 768px) {
  .chat-panel-enter-from,
  .chat-panel-leave-to {
    transform: translateY(20px);
  }
}
</style>
