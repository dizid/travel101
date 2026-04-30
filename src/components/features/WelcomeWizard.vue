<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useUserStore } from '@stores/userStore'
import type { TripType, TravelStyle, GroupType } from '@/types'
import { RightOutlined, LeftOutlined, CheckOutlined } from '@ant-design/icons-vue'

const props = defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ close: []; complete: [] }>()

const userStore = useUserStore()

const STORAGE_KEY = 'welcome-wizard-completed'

const step = ref(1)
const tripType = ref<TripType>('holiday')
const travelStyle = ref<TravelStyle[]>([])
const groupType = ref<GroupType>('solo')
const nationality = ref('')

const tripOptions: { value: TripType; icon: string; title: string; blurb: string }[] = [
  { value: 'holiday', icon: '🏖️', title: 'Holiday traveler', blurb: 'A trip of a few days or weeks' },
  { value: 'digital_nomad', icon: '💻', title: 'Digital nomad', blurb: 'Working remotely from Thailand' },
  { value: 'expat', icon: '🏡', title: 'Moving here', blurb: 'Relocating long-term or retiring' },
]

const styleOptions: { value: TravelStyle; icon: string; label: string }[] = [
  { value: 'adventure', icon: '🧗', label: 'Adventure' },
  { value: 'relaxation', icon: '🌴', label: 'Relaxation' },
  { value: 'culture', icon: '🛕', label: 'Culture' },
  { value: 'party', icon: '🎶', label: 'Party' },
]

const groupOptions: { value: GroupType; icon: string; label: string }[] = [
  { value: 'solo', icon: '🧍', label: 'Solo' },
  { value: 'couple', icon: '💑', label: 'Couple' },
  { value: 'family', icon: '👨‍👩‍👧', label: 'Family' },
  { value: 'friends', icon: '👯', label: 'Friends' },
]

const nationalityChips = ['United States', 'United Kingdom', 'Germany', 'France', 'Australia', 'Canada', 'Netherlands', 'Singapore', 'India', 'China']

const totalSteps = 3
const isLastStep = computed(() => step.value === totalSteps)
const canAdvance = computed(() => {
  if (step.value === 1) return !!tripType.value
  if (step.value === 2) return travelStyle.value.length > 0 && !!groupType.value
  if (step.value === 3) return nationality.value.trim().length > 0
  return false
})

function toggleStyle(value: TravelStyle) {
  const i = travelStyle.value.indexOf(value)
  if (i === -1) travelStyle.value.push(value)
  else travelStyle.value.splice(i, 1)
}

function next() {
  if (!canAdvance.value) return
  if (isLastStep.value) finish()
  else step.value += 1
}

function back() {
  if (step.value > 1) step.value -= 1
}

function markCompleted() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, '1')
  }
}

function skip() {
  markCompleted()
  emit('close')
}

function finish() {
  userStore.updatePreferences({
    tripType: tripType.value,
    travelStyle: travelStyle.value,
    groupType: groupType.value,
    nationality: nationality.value.trim(),
  })
  markCompleted()
  emit('complete')
  emit('close')
}

function onKeydown(e: KeyboardEvent) {
  if (!props.isOpen) return
  if (e.key === 'Escape') skip()
}

watch(
  () => props.isOpen,
  (open) => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) step.value = 1
  },
)

onMounted(() => {
  if (typeof window !== 'undefined') window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  if (typeof window !== 'undefined') window.removeEventListener('keydown', onKeydown)
  if (typeof document !== 'undefined') document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="wizard-backdrop">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        @click="skip"
      />
    </Transition>

    <Transition name="wizard-content">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center sm:p-4 pointer-events-none"
      >
        <div
          class="bg-white shadow-2xl w-full sm:max-w-lg sm:rounded-3xl pointer-events-auto overflow-hidden flex flex-col h-full sm:h-auto sm:max-h-[90vh]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wizard-title"
          @click.stop
        >
          <!-- Header -->
          <div class="bg-gradient-to-br from-primary-500 to-accent-500 p-5 sm:p-6 text-white relative">
            <button
              type="button"
              class="absolute top-3 right-3 sm:top-4 sm:right-4 text-white/80 hover:text-white text-sm font-medium px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              :aria-label="'Skip onboarding'"
              @click="skip"
            >
              Skip
            </button>

            <div class="flex items-center gap-2 mb-2 text-2xl">🙏</div>
            <h2 id="wizard-title" class="text-xl sm:text-2xl font-bold">Welcome to HappyRoam</h2>
            <p class="text-white/85 text-sm mt-1">
              30 seconds to personalize — visa info, smart matches, the works.
            </p>

            <!-- Progress dots -->
            <div class="flex items-center gap-2 mt-5">
              <div
                v-for="n in totalSteps"
                :key="n"
                class="h-1.5 rounded-full transition-all duration-300"
                :class="n <= step ? 'bg-white w-8' : 'bg-white/30 w-4'"
              />
              <span class="text-xs text-white/70 ml-2">Step {{ step }} of {{ totalSteps }}</span>
            </div>
          </div>

          <!-- Body -->
          <div class="p-5 sm:p-6 flex-1 overflow-y-auto">
            <!-- Step 1: Trip purpose -->
            <div v-if="step === 1">
              <h3 class="text-lg font-semibold text-gray-900 mb-1">What brings you to Thailand?</h3>
              <p class="text-sm text-gray-500 mb-5">We'll tailor visa info and recommendations to your trip.</p>
              <div class="space-y-2.5">
                <button
                  v-for="opt in tripOptions"
                  :key="opt.value"
                  type="button"
                  class="w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left min-h-[44px]"
                  :class="
                    tripType === opt.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  "
                  @click="tripType = opt.value"
                >
                  <span class="text-2xl">{{ opt.icon }}</span>
                  <span class="flex-1">
                    <span class="block font-medium text-gray-900">{{ opt.title }}</span>
                    <span class="block text-sm text-gray-500">{{ opt.blurb }}</span>
                  </span>
                  <CheckOutlined v-if="tripType === opt.value" class="text-primary-500" />
                </button>
              </div>
            </div>

            <!-- Step 2: Travel style + group -->
            <div v-else-if="step === 2">
              <h3 class="text-lg font-semibold text-gray-900 mb-1">Your travel style</h3>
              <p class="text-sm text-gray-500 mb-4">Pick everything that fits — Smart Match uses these.</p>
              <div class="flex flex-wrap gap-2 mb-6">
                <button
                  v-for="opt in styleOptions"
                  :key="opt.value"
                  type="button"
                  class="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border-2 text-sm font-medium transition-all min-h-[44px]"
                  :class="
                    travelStyle.includes(opt.value)
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  "
                  @click="toggleStyle(opt.value)"
                >
                  <span>{{ opt.icon }}</span>
                  <span>{{ opt.label }}</span>
                </button>
              </div>

              <h3 class="text-lg font-semibold text-gray-900 mb-1">Who's traveling?</h3>
              <p class="text-sm text-gray-500 mb-4">Affects activity and accommodation suggestions.</p>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="opt in groupOptions"
                  :key="opt.value"
                  type="button"
                  class="flex items-center gap-2.5 px-4 py-3 rounded-2xl border-2 text-sm font-medium transition-all min-h-[44px]"
                  :class="
                    groupType === opt.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  "
                  @click="groupType = opt.value"
                >
                  <span class="text-lg">{{ opt.icon }}</span>
                  <span>{{ opt.label }}</span>
                </button>
              </div>
            </div>

            <!-- Step 3: Nationality -->
            <div v-else-if="step === 3">
              <h3 class="text-lg font-semibold text-gray-900 mb-1">Your nationality</h3>
              <p class="text-sm text-gray-500 mb-4">
                Visa rules depend on this. We'll point you at the right entry route.
              </p>
              <input
                v-model="nationality"
                type="text"
                placeholder="e.g. United States"
                class="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-primary-500 focus:outline-none text-base mb-4"
                autocomplete="country-name"
                @keydown.enter.prevent="next"
              />
              <p class="text-xs text-gray-500 mb-2">Quick pick:</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="chip in nationalityChips"
                  :key="chip"
                  type="button"
                  class="px-3 py-1.5 rounded-full border text-sm transition-colors min-h-[36px]"
                  :class="
                    nationality === chip
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  "
                  @click="nationality = chip"
                >
                  {{ chip }}
                </button>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="border-t border-gray-100 p-4 sm:p-5 flex items-center justify-between gap-3 bg-white">
            <button
              v-if="step > 1"
              type="button"
              class="inline-flex items-center gap-1.5 px-4 py-2.5 text-gray-600 hover:text-gray-900 font-medium min-h-[44px]"
              @click="back"
            >
              <LeftOutlined class="text-xs" />
              Back
            </button>
            <span v-else />

            <button
              type="button"
              :disabled="!canAdvance"
              class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold rounded-full shadow-soft hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              @click="next"
            >
              {{ isLastStep ? 'Finish' : 'Next' }}
              <RightOutlined v-if="!isLastStep" class="text-xs" />
              <CheckOutlined v-else class="text-xs" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.wizard-backdrop-enter-active,
.wizard-backdrop-leave-active {
  transition: opacity 0.2s ease;
}
.wizard-backdrop-enter-from,
.wizard-backdrop-leave-to {
  opacity: 0;
}

.wizard-content-enter-active,
.wizard-content-leave-active {
  transition: all 0.25s ease;
}
.wizard-content-enter-from,
.wizard-content-leave-to {
  opacity: 0;
  transform: scale(0.97) translateY(8px);
}
</style>
