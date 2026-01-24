<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useUserStore } from '@stores/userStore'
import { useAuth } from '@/composables/useAuth'
import { CloseOutlined, CheckOutlined, LoadingOutlined } from '@ant-design/icons-vue'
import type { TravelStyle, Interest, BudgetLevel, GroupType } from '@/types'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const userStore = useUserStore()
const { savePreferences } = useAuth()

// Local state for editing
const localTravelStyle = ref<TravelStyle[]>([])
const localInterests = ref<Interest[]>([])
const localBudget = ref<BudgetLevel>('mid')
const localGroupType = ref<GroupType>('solo')

const isSaving = ref(false)
const showSuccess = ref(false)

// Sync local state when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    localTravelStyle.value = [...userStore.profile.prefs.travelStyle]
    localInterests.value = [...userStore.profile.prefs.interests]
    localBudget.value = userStore.profile.prefs.budget
    localGroupType.value = userStore.profile.prefs.groupType
    showSuccess.value = false
  }
})

// Options
const travelStyleOptions: { value: TravelStyle; label: string; icon: string }[] = [
  { value: 'party', label: 'Party', icon: '🎉' },
  { value: 'adventure', label: 'Adventure', icon: '⛰️' },
  { value: 'relaxation', label: 'Relaxation', icon: '🧘' },
  { value: 'culture', label: 'Culture', icon: '🏛️' },
]

const interestOptions: { value: Interest; label: string; icon: string }[] = [
  { value: 'beach', label: 'Beaches', icon: '🏖️' },
  { value: 'nightlife', label: 'Nightlife', icon: '🌙' },
  { value: 'temples', label: 'Temples', icon: '🛕' },
  { value: 'food', label: 'Food', icon: '🍜' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️' },
  { value: 'nature', label: 'Nature', icon: '🌿' },
  { value: 'wellness', label: 'Wellness', icon: '💆' },
]

const budgetOptions: { value: BudgetLevel; label: string; description: string }[] = [
  { value: 'budget', label: 'Budget', description: 'Hostels, street food, public transport' },
  { value: 'mid', label: 'Mid-range', description: 'Hotels, restaurants, mixed transport' },
  { value: 'luxury', label: 'Luxury', description: 'Resorts, fine dining, private transfers' },
]

const groupOptions: { value: GroupType; label: string; icon: string }[] = [
  { value: 'solo', label: 'Solo', icon: '👤' },
  { value: 'couple', label: 'Couple', icon: '💑' },
  { value: 'family', label: 'Family', icon: '👨‍👩‍👧' },
  { value: 'friends', label: 'Friends', icon: '👥' },
]

// Toggle functions
function toggleTravelStyle(style: TravelStyle) {
  const index = localTravelStyle.value.indexOf(style)
  if (index === -1) {
    localTravelStyle.value.push(style)
  } else {
    localTravelStyle.value.splice(index, 1)
  }
}

function toggleInterest(interest: Interest) {
  const index = localInterests.value.indexOf(interest)
  if (index === -1) {
    localInterests.value.push(interest)
  } else {
    localInterests.value.splice(index, 1)
  }
}

// Check if anything changed
const hasChanges = computed(() => {
  const prefs = userStore.profile.prefs
  return (
    JSON.stringify(localTravelStyle.value.sort()) !== JSON.stringify([...prefs.travelStyle].sort()) ||
    JSON.stringify(localInterests.value.sort()) !== JSON.stringify([...prefs.interests].sort()) ||
    localBudget.value !== prefs.budget ||
    localGroupType.value !== prefs.groupType
  )
})

// Save changes
async function handleSave() {
  if (!hasChanges.value) {
    emit('close')
    return
  }

  isSaving.value = true

  try {
    // Update store (this updates localStorage immediately)
    userStore.updatePreferences({
      travelStyle: localTravelStyle.value,
      interests: localInterests.value,
      budget: localBudget.value,
      groupType: localGroupType.value,
    })

    // Sync to backend if authenticated (reads from store)
    if (userStore.isAuthenticated) {
      await savePreferences()
    }

    showSuccess.value = true
    setTimeout(() => {
      emit('saved')
      emit('close')
    }, 800)
  } catch (error) {
    console.error('Failed to save preferences:', error)
  } finally {
    isSaving.value = false
  }
}

// Handle backdrop click
function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    emit('close')
  }
}

// Handle escape key
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('close')
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
      >
        <Transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0 translate-y-8 sm:translate-y-4 sm:scale-95"
          enter-to-class="opacity-100 translate-y-0 sm:scale-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="opacity-100 translate-y-0 sm:scale-100"
          leave-to-class="opacity-0 translate-y-8 sm:translate-y-4 sm:scale-95"
        >
          <div
            v-if="isOpen"
            class="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col"
          >
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 class="text-lg font-display font-bold text-gray-900">
                  Quick Edit Preferences
                </h2>
                <p class="text-sm text-gray-500">
                  Adjust what matters most to you
                </p>
              </div>
              <button
                @click="emit('close')"
                class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <CloseOutlined />
              </button>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <!-- Travel Style -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-3">
                  Travel Style
                </label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="option in travelStyleOptions"
                    :key="option.value"
                    @click="toggleTravelStyle(option.value)"
                    class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                    :class="[
                      localTravelStyle.includes(option.value)
                        ? 'bg-rose-100 text-rose-700 border-2 border-rose-300 shadow-sm'
                        : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100'
                    ]"
                  >
                    <span>{{ option.icon }}</span>
                    {{ option.label }}
                  </button>
                </div>
              </div>

              <!-- Interests -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-3">
                  Interests
                </label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="option in interestOptions"
                    :key="option.value"
                    @click="toggleInterest(option.value)"
                    class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                    :class="[
                      localInterests.includes(option.value)
                        ? 'bg-rose-100 text-rose-700 border-2 border-rose-300 shadow-sm'
                        : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100'
                    ]"
                  >
                    <span>{{ option.icon }}</span>
                    {{ option.label }}
                  </button>
                </div>
              </div>

              <!-- Group Type -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-3">
                  Traveling As
                </label>
                <div class="grid grid-cols-4 gap-2">
                  <button
                    v-for="option in groupOptions"
                    :key="option.value"
                    @click="localGroupType = option.value"
                    class="flex flex-col items-center gap-1 px-3 py-3 rounded-xl text-sm font-medium transition-all"
                    :class="[
                      localGroupType === option.value
                        ? 'bg-rose-100 text-rose-700 border-2 border-rose-300 shadow-sm'
                        : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100'
                    ]"
                  >
                    <span class="text-xl">{{ option.icon }}</span>
                    <span class="text-xs">{{ option.label }}</span>
                  </button>
                </div>
              </div>

              <!-- Budget -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-3">
                  Budget Level
                </label>
                <div class="space-y-2">
                  <button
                    v-for="option in budgetOptions"
                    :key="option.value"
                    @click="localBudget = option.value"
                    class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                    :class="[
                      localBudget === option.value
                        ? 'bg-rose-100 border-2 border-rose-300 shadow-sm'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    ]"
                  >
                    <div
                      class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
                      :class="[
                        localBudget === option.value
                          ? 'border-rose-500 bg-rose-500'
                          : 'border-gray-300'
                      ]"
                    >
                      <CheckOutlined v-if="localBudget === option.value" class="text-white text-xs" />
                    </div>
                    <div>
                      <p
                        class="font-medium text-sm"
                        :class="localBudget === option.value ? 'text-rose-700' : 'text-gray-700'"
                      >
                        {{ option.label }}
                      </p>
                      <p class="text-xs text-gray-500">{{ option.description }}</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t border-gray-100 bg-gray-50">
              <div class="flex items-center justify-end gap-3">
                <button
                  @click="emit('close')"
                  class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  @click="handleSave"
                  :disabled="isSaving"
                  class="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 rounded-lg shadow-sm transition-all hover:shadow disabled:opacity-50"
                >
                  <LoadingOutlined v-if="isSaving" class="animate-spin" />
                  <CheckOutlined v-else-if="showSuccess" />
                  <span v-if="showSuccess">Saved!</span>
                  <span v-else-if="isSaving">Saving...</span>
                  <span v-else>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
