<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { CalendarOutlined, EnvironmentOutlined, RightOutlined } from '@ant-design/icons-vue'
import { useFestivals } from '@/composables/useFestivals'
import type { UpcomingFestival } from '@/types'

const props = defineProps<{
  province?: string  // Filter by province if provided
  limit?: number
}>()

const { fetchUpcoming, fetchByProvince, formatFestivalDate, getFestivalEmoji, getCountdownText, loading } = useFestivals()

const festivals = ref<UpcomingFestival[]>([])
const expanded = ref(false)

onMounted(async () => {
  let result: UpcomingFestival[]
  if (props.province) {
    // Fetch festivals for specific province
    const provinceFestivals = await fetchByProvince(props.province)
    // Use Thailand time for date comparisons (all festivals are in Thailand)
    const now = new Date()
    const thai = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
    const year = thai.getFullYear()
    result = provinceFestivals
      .filter((f) => {
        const dateStr = year === 2025 ? f.date2025 : f.date2026
        if (!dateStr) return false
        const startDate = new Date(dateStr)
        const endDate = new Date(startDate.getTime() + ((f.durationDays || 1) - 1) * 86400000)
        return endDate >= thai
      })
      .map((f) => {
        const dateStr = (year === 2025 ? f.date2025 : f.date2026)!
        const startDate = new Date(dateStr)
        const endDate = new Date(startDate.getTime() + ((f.durationDays || 1) - 1) * 86400000)
        const daysUntilStart = Math.ceil((startDate.getTime() - thai.getTime()) / 86400000)
        return {
          ...f,
          nextDate: dateStr,
          daysUntil: Math.max(0, daysUntilStart),
          isOngoing: daysUntilStart < 0 && endDate >= thai,
        }
      })
      .sort((a, b) => a.daysUntil - b.daysUntil)
  } else {
    result = await fetchUpcoming(90)
  }
  festivals.value = result.slice(0, props.limit || 3)
})

function getUrgencyClass(festival: UpcomingFestival): string {
  if (festival.isOngoing) return 'bg-green-50 border-green-200 text-green-700'
  if (festival.daysUntil <= 7) return 'bg-red-50 border-red-200 text-red-700'
  if (festival.daysUntil <= 30) return 'bg-amber-50 border-amber-200 text-amber-700'
  return 'bg-blue-50 border-blue-200 text-blue-700'
}
</script>

<template>
  <div v-if="!loading && festivals.length > 0" class="mb-6">
    <!-- Compact banner for first festival -->
    <div
      class="rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md"
      :class="getUrgencyClass(festivals[0])"
      @click="expanded = !expanded"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-2xl">{{ getFestivalEmoji(festivals[0]) }}</span>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-semibold">{{ festivals[0].name }}</span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-white/50">
                {{ getCountdownText(festivals[0].daysUntil, festivals[0].isOngoing) }}
              </span>
            </div>
            <div class="text-sm opacity-75 flex items-center gap-3 mt-0.5">
              <span class="flex items-center gap-1">
                <CalendarOutlined />
                {{ formatFestivalDate(festivals[0].nextDate, festivals[0].durationDays) }}
              </span>
              <span v-if="festivals[0].bestLocations?.length" class="flex items-center gap-1">
                <EnvironmentOutlined />
                {{ festivals[0].bestLocations[0] }}
              </span>
            </div>
          </div>
        </div>
        <RightOutlined
          class="transition-transform"
          :class="{ 'rotate-90': expanded }"
        />
      </div>

      <!-- Expanded content -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 max-h-0"
        enter-to-class="opacity-100 max-h-96"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 max-h-96"
        leave-to-class="opacity-0 max-h-0"
      >
        <div v-if="expanded" class="mt-4 pt-4 border-t border-current/10 overflow-hidden">
          <p v-if="festivals[0].description" class="text-sm mb-3">
            {{ festivals[0].description }}
          </p>

          <!-- Activities -->
          <div v-if="festivals[0].activities?.length" class="mb-3">
            <div class="text-xs font-medium mb-1 opacity-75">What to expect:</div>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="activity in festivals[0].activities.slice(0, 4)"
                :key="activity"
                class="text-xs px-2 py-1 bg-white/50 rounded-full"
              >
                {{ activity }}
              </span>
            </div>
          </div>

          <!-- Tips -->
          <div v-if="festivals[0].tips?.length" class="text-sm">
            <div class="text-xs font-medium mb-1 opacity-75">Tip:</div>
            <p class="italic">{{ festivals[0].tips[0] }}</p>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Additional upcoming festivals (collapsed) -->
    <div v-if="festivals.length > 1 && !expanded" class="flex gap-2 mt-2 overflow-x-auto pb-1">
      <div
        v-for="festival in festivals.slice(1)"
        :key="festival.slug"
        class="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border text-sm"
      >
        <span>{{ getFestivalEmoji(festival) }}</span>
        <span class="font-medium">{{ festival.name }}</span>
        <span class="text-xs text-gray-500">{{ getCountdownText(festival.daysUntil, festival.isOngoing) }}</span>
      </div>
    </div>
  </div>
</template>
