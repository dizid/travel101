<script setup lang="ts">
import { useSubscription } from '@/composables/useSubscription'
import {
  CrownFilled,
  CloseOutlined,
  LoadingOutlined,
} from '@ant-design/icons-vue'

defineProps<{
  isOpen: boolean
  featureName?: string
  triggerReason?: 'limit_reached' | 'pro_feature' | 'upgrade_prompt'
}>()

const emit = defineEmits<{
  close: []
}>()

const { startCheckout, loading } = useSubscription()

const proFeatures = [
  { icon: '♾️', label: 'Unlimited AI Chats', description: 'No daily limits' },
  { icon: '🎯', label: 'AI Itineraries', description: 'Personalized trip plans' },
  { icon: '💎', label: 'Hidden Gems', description: 'Pro-only secrets' },
  { icon: '💬', label: 'Persistent Chats', description: 'Resume conversations' },
  { icon: '🔔', label: 'Smart Alerts', description: 'Visa reminders' },
]

async function handleUpgrade() {
  await startCheckout()
}
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="modal-backdrop">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        @click="emit('close')"
      />
    </Transition>

    <!-- Modal -->
    <Transition name="modal-content">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          class="bg-white rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto overflow-hidden"
          @click.stop
        >
          <!-- Header with gradient -->
          <div class="bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 p-6 text-white relative">
            <button
              @click="emit('close')"
              class="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <CloseOutlined />
            </button>

            <div class="flex items-center gap-3 mb-3">
              <div class="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                <CrownFilled class="text-2xl" />
              </div>
              <div>
                <h2 class="text-xl font-bold">Upgrade to Pro</h2>
                <p class="text-amber-100 text-sm">Unlock unlimited AI features</p>
              </div>
            </div>

            <div v-if="triggerReason === 'limit_reached'" class="mt-4 p-3 bg-white/10 rounded-xl">
              <p class="text-sm">
                You've reached your daily {{ featureName || 'AI' }} limit. Upgrade for unlimited access!
              </p>
            </div>
          </div>

          <!-- Features -->
          <div class="p-6">
            <ul class="space-y-3 mb-6">
              <li
                v-for="feature in proFeatures"
                :key="feature.label"
                class="flex items-center gap-3"
              >
                <span class="text-xl">{{ feature.icon }}</span>
                <div>
                  <span class="font-medium text-gray-900">{{ feature.label }}</span>
                  <span class="text-gray-500 text-sm ml-2">{{ feature.description }}</span>
                </div>
              </li>
            </ul>

            <!-- Pricing -->
            <div class="text-center mb-6">
              <p class="text-xs text-gray-500 mb-1">7-day free trial, then</p>
              <p class="text-3xl font-bold text-gray-900">
                $10<span class="text-lg font-normal text-gray-500">/month</span>
              </p>
            </div>

            <!-- CTA -->
            <button
              @click="handleUpgrade"
              :disabled="loading"
              class="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <LoadingOutlined v-if="loading" class="animate-spin" />
              <CrownFilled v-else />
              {{ loading ? 'Loading...' : 'Start Free Trial' }}
            </button>

            <p class="text-center text-xs text-gray-400 mt-3">
              Cancel anytime. No charge for 7 days.
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop-enter-active,
.modal-backdrop-leave-active {
  transition: opacity 0.2s ease;
}
.modal-backdrop-enter-from,
.modal-backdrop-leave-to {
  opacity: 0;
}

.modal-content-enter-active,
.modal-content-leave-active {
  transition: all 0.3s ease;
}
.modal-content-enter-from,
.modal-content-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
</style>
