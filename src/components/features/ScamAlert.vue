<script setup lang="ts">
import { computed } from 'vue'
import {
  WarningOutlined,
  CheckCircleOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons-vue'
import type { ScamReport } from '@/composables/useSafety'
import { useSafety } from '@/composables/useSafety'

const props = defineProps<{
  report: ScamReport
  compact?: boolean
}>()

const { getSeverityInfo, getScamTypeInfo } = useSafety()

const severityInfo = computed(() => getSeverityInfo(props.report.severity))
const scamTypeInfo = computed(() => getScamTypeInfo(props.report.scam_type))

const timeAgo = computed(() => {
  const date = new Date(props.report.last_reported_at)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
})
</script>

<template>
  <div
    class="rounded-xl border p-4 transition-all hover:shadow-md"
    :class="severityInfo.bgColor"
  >
    <!-- Header -->
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-start gap-3">
        <span class="text-2xl">{{ scamTypeInfo?.icon || '⚠️' }}</span>
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="font-semibold text-gray-900">{{ report.title }}</h3>
            <span
              v-if="report.verified"
              class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full"
            >
              <CheckCircleOutlined class="text-xs" />
              Verified
            </span>
          </div>
          <div class="flex items-center gap-3 mt-1 text-sm text-gray-600">
            <span class="inline-flex items-center gap-1">
              <EnvironmentOutlined class="text-xs" />
              {{ report.location_name || report.province }}
            </span>
            <span v-if="!compact" class="inline-flex items-center gap-1">
              <ClockCircleOutlined class="text-xs" />
              {{ timeAgo }}
            </span>
          </div>
        </div>
      </div>

      <!-- Severity badge -->
      <span
        class="px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap"
        :class="[
          report.severity >= 3 ? 'bg-red-100 text-red-700' :
          report.severity >= 2 ? 'bg-amber-100 text-amber-700' :
          'bg-blue-100 text-blue-700'
        ]"
      >
        <WarningOutlined class="mr-1" />
        {{ severityInfo.label }}
      </span>
    </div>

    <!-- Description -->
    <p v-if="!compact" class="mt-3 text-sm text-gray-700 leading-relaxed">
      {{ report.description }}
    </p>

    <!-- Footer stats -->
    <div v-if="!compact" class="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
      <span>{{ scamTypeInfo?.label || report.scam_type }}</span>
      <span v-if="report.report_count > 1" class="font-medium text-gray-700">
        {{ report.report_count }} reports
      </span>
    </div>
  </div>
</template>
