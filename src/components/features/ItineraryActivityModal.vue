<script setup lang="ts">
import { ref, watch } from 'vue'
import { CheckOutlined } from '@ant-design/icons-vue'
import type { ItineraryActivity } from '@/composables/useItinerary'

interface Props {
  visible: boolean
  mode: 'add' | 'edit'
  activity?: ItineraryActivity | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  save: [data: {
    id?: string
    title: string
    description?: string
    timeSlot: string
    activityType: string
    durationMinutes?: number
    estimatedCostThb?: number
  }]
}>()

const activityIcons: Record<string, string> = {
  transport: '✈️',
  accommodation: '🏨',
  attraction: '🏛️',
  food: '🍜',
  shopping: '🛍️',
  nightlife: '🌙',
  beach: '🏖️',
  nature: '🌿',
  wellness: '🧘',
}

const form = ref({
  id: '',
  title: '',
  description: '',
  timeSlot: '09:00',
  activityType: 'attraction',
  durationMinutes: 60,
  estimatedCostThb: 0,
})

// Reset form when modal opens or activity changes
watch(
  () => [props.visible, props.activity],
  () => {
    if (props.visible) {
      if (props.mode === 'edit' && props.activity) {
        form.value = {
          id: props.activity.id,
          title: props.activity.title,
          description: props.activity.description || '',
          timeSlot: props.activity.timeSlot || '09:00',
          activityType: props.activity.activityType || 'attraction',
          durationMinutes: props.activity.durationMinutes || 60,
          estimatedCostThb: props.activity.estimatedCostThb || 0,
        }
      } else {
        form.value = {
          id: '',
          title: '',
          description: '',
          timeSlot: '09:00',
          activityType: 'attraction',
          durationMinutes: 60,
          estimatedCostThb: 0,
        }
      }
    }
  },
  { immediate: true }
)

function handleSave() {
  if (!form.value.title.trim()) return

  emit('save', {
    id: props.mode === 'edit' ? form.value.id : undefined,
    title: form.value.title.trim(),
    description: form.value.description.trim() || undefined,
    timeSlot: form.value.timeSlot,
    activityType: form.value.activityType,
    durationMinutes: form.value.durationMinutes || undefined,
    estimatedCostThb: form.value.estimatedCostThb || undefined,
  })
}
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    leave-active-class="transition-opacity duration-200"
    leave-to-class="opacity-0"
  >
    <div
      v-if="visible"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      @click.self="emit('close')"
    >
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div class="p-6">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xl">
              {{ activityIcons[form.activityType] || '📌' }}
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-900">
                {{ mode === 'add' ? 'Add Activity' : 'Edit Activity' }}
              </h2>
              <p class="text-sm text-gray-500">Fill in the details below</p>
            </div>
          </div>

          <!-- Title -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Activity Title</label>
            <input
              v-model="form.title"
              type="text"
              placeholder="e.g., Visit Grand Palace"
              class="input-thai"
            />
          </div>

          <!-- Activity Type -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="(icon, type) in activityIcons"
                :key="type"
                @click="form.activityType = type"
                :class="[
                  'px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1',
                  form.activityType === type
                    ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-500'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                ]"
              >
                {{ icon }} {{ type }}
              </button>
            </div>
          </div>

          <!-- Time & Duration -->
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                v-model="form.timeSlot"
                type="time"
                class="input-thai"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
              <input
                v-model.number="form.durationMinutes"
                type="number"
                min="0"
                step="15"
                class="input-thai"
              />
            </div>
          </div>

          <!-- Cost -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Estimated Cost (THB)</label>
            <input
              v-model.number="form.estimatedCostThb"
              type="number"
              min="0"
              step="100"
              placeholder="0"
              class="input-thai"
            />
          </div>

          <!-- Description -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              v-model="form.description"
              rows="2"
              placeholder="Any tips or details..."
              class="input-thai"
            />
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              @click="emit('close')"
              class="flex-1 btn-thai-outline"
            >
              Cancel
            </button>
            <button
              @click="handleSave"
              :disabled="!form.title.trim()"
              class="flex-1 btn-thai flex items-center justify-center gap-2"
            >
              <CheckOutlined />
              {{ mode === 'add' ? 'Add Activity' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
