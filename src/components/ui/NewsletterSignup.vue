<script setup lang="ts">
import { ref } from 'vue'
import { SendOutlined, CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons-vue'

const email = ref('')
const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const errorMessage = ref('')

async function handleSubmit() {
  if (!email.value || !email.value.includes('@')) {
    errorMessage.value = 'Please enter a valid email'
    status.value = 'error'
    return
  }

  status.value = 'loading'
  errorMessage.value = ''

  try {
    const response = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value }),
    })

    if (response.ok) {
      status.value = 'success'
      email.value = ''
    } else {
      throw new Error('Failed to subscribe')
    }
  } catch (err) {
    status.value = 'error'
    errorMessage.value = 'Something went wrong. Please try again.'
  }
}
</script>

<template>
  <div class="w-full">
    <h3 class="text-sm font-semibold text-gray-900 mb-3">
      Get Travel Tips
    </h3>
    <p class="text-sm text-gray-600 mb-4">
      Weekly Thailand travel tips, deals, and hidden gems
    </p>

    <!-- Success State -->
    <div v-if="status === 'success'" class="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
      <CheckCircleOutlined />
      <span class="text-sm">Thanks! Check your inbox for a welcome gift.</span>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="handleSubmit" class="flex gap-2">
      <div class="flex-1 relative">
        <input
          v-model="email"
          type="email"
          placeholder="your@email.com"
          class="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          :disabled="status === 'loading'"
        />
        <p v-if="errorMessage" class="absolute -bottom-5 left-0 text-xs text-red-500">
          {{ errorMessage }}
        </p>
      </div>
      <button
        type="submit"
        class="px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        :disabled="status === 'loading'"
      >
        <LoadingOutlined v-if="status === 'loading'" class="animate-spin" />
        <SendOutlined v-else />
      </button>
    </form>
  </div>
</template>
