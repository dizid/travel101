import { ref, computed } from 'vue'
import { useApi } from './useApi'
import { useUserStore } from '@/stores/userStore'

export interface Alert {
  id: string
  userId: string
  alertType: 'visa_expiry' | 'visa_extension' | '90day_report' | 'departure_reminder' | 'travel_tip' | 'weather_alert' | 'event_reminder'
  title: string
  message: string
  triggerDate: string
  referenceData: Record<string, unknown>
  isRead: boolean
  isDismissed: boolean
  isSent: boolean
  priority: 1 | 2 | 3 | 4
  createdAt: string
  updatedAt: string
}

export interface VisaInfo {
  type: string
  entryDate: string
  expiryDate: string
  daysRemaining: number
}

export type VisaType =
  | 'visa_exempt'
  | 'visa_exempt_60'
  | 'tourist_visa_60'
  | 'tourist_visa_90'
  | 'dtv'
  | 'ed_visa'
  | 'retirement_visa'
  | 'work_permit'

const VISA_LABELS: Record<VisaType, string> = {
  visa_exempt: 'Visa Exempt (30 days)',
  visa_exempt_60: 'Visa Exempt (60 days)',
  tourist_visa_60: 'Tourist Visa (60 days)',
  tourist_visa_90: 'Tourist Visa (90 days)',
  dtv: 'Destination Thailand Visa (DTV)',
  ed_visa: 'Education Visa (ED)',
  retirement_visa: 'Retirement Visa (O-A)',
  work_permit: 'Work Permit (Non-B)',
}

export function useAlerts() {
  const { get, post, put, del, loading, error } = useApi()
  const userStore = useUserStore()

  const alerts = ref<Alert[]>([])
  const unreadCount = ref(0)
  const upcomingAlerts = ref<Alert[]>([])
  const visaInfo = ref<VisaInfo | null>(null)

  const isPro = computed(() => userStore.isPro)

  async function fetchAlerts(showDismissed = false) {
    if (!isPro.value) return []
    const result = await get<{ alerts: Alert[] }>(`/alerts${showDismissed ? '?showDismissed=true' : ''}`)
    if (result) {
      alerts.value = result.alerts
    }
    return alerts.value
  }

  async function fetchUnreadCount() {
    if (!isPro.value) return 0
    const result = await get<{ count: number }>('/alerts?action=unread-count')
    if (result) {
      unreadCount.value = result.count
    }
    return unreadCount.value
  }

  async function fetchUpcoming() {
    if (!isPro.value) return []
    const result = await get<{ alerts: Alert[] }>('/alerts?action=upcoming')
    if (result) {
      upcomingAlerts.value = result.alerts
    }
    return upcomingAlerts.value
  }

  async function setupVisaTracking(visaType: VisaType, entryDate: string, expiryDate?: string) {
    if (!isPro.value) return null
    const result = await post<{
      success: boolean
      alerts: Alert[]
      visaInfo: VisaInfo
    }>('/alerts', {
      action: 'setup-visa',
      visaType,
      entryDate,
      visaExpiryDate: expiryDate,
    })

    if (result) {
      visaInfo.value = result.visaInfo
      await fetchAlerts()
      await fetchUnreadCount()
      return result
    }
    return null
  }

  async function createAlert(data: {
    alertType: Alert['alertType']
    title: string
    message: string
    triggerDate: string
    referenceData?: Record<string, unknown>
    priority?: Alert['priority']
  }) {
    if (!isPro.value) return null
    const result = await post<{ alert: Alert }>('/alerts', data)
    if (result) {
      alerts.value.unshift(result.alert)
      await fetchUnreadCount()
    }
    return result?.alert
  }

  async function markAsRead(id: string) {
    if (!isPro.value) return false
    const result = await put<{ success: boolean }>(`/alerts?id=${id}`, { action: 'read' })
    if (result?.success) {
      const alert = alerts.value.find((a) => a.id === id)
      if (alert) alert.isRead = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
    return result?.success ?? false
  }

  async function dismissAlert(id: string) {
    if (!isPro.value) return false
    const result = await put<{ success: boolean }>(`/alerts?id=${id}`, { action: 'dismiss' })
    if (result?.success) {
      alerts.value = alerts.value.filter((a) => a.id !== id)
      upcomingAlerts.value = upcomingAlerts.value.filter((a) => a.id !== id)
      await fetchUnreadCount()
    }
    return result?.success ?? false
  }

  async function deleteAlert(id: string) {
    if (!isPro.value) return false
    const result = await del<{ success: boolean }>(`/alerts?id=${id}`)
    if (result?.success) {
      alerts.value = alerts.value.filter((a) => a.id !== id)
      upcomingAlerts.value = upcomingAlerts.value.filter((a) => a.id !== id)
      await fetchUnreadCount()
    }
    return result?.success ?? false
  }

  // Get priority label and color
  function getPriorityInfo(priority: Alert['priority']): { label: string; color: string; bgColor: string } {
    const map: Record<Alert['priority'], { label: string; color: string; bgColor: string }> = {
      1: { label: 'Low', color: 'text-gray-600', bgColor: 'bg-gray-100' },
      2: { label: 'Medium', color: 'text-blue-600', bgColor: 'bg-blue-100' },
      3: { label: 'High', color: 'text-amber-600', bgColor: 'bg-amber-100' },
      4: { label: 'Urgent', color: 'text-red-600', bgColor: 'bg-red-100' },
    }
    return map[priority]
  }

  // Get alert type icon
  function getAlertIcon(type: Alert['alertType']): string {
    const icons: Record<Alert['alertType'], string> = {
      visa_expiry: '🛂',
      visa_extension: '📝',
      '90day_report': '📋',
      departure_reminder: '✈️',
      travel_tip: '💡',
      weather_alert: '🌤️',
      event_reminder: '🎉',
    }
    return icons[type]
  }

  // Get days until alert triggers
  function getDaysUntil(triggerDate: string): number {
    const trigger = new Date(triggerDate)
    const now = new Date()
    return Math.ceil((trigger.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
  }

  // Format trigger date relative to today
  function formatTriggerDate(triggerDate: string): string {
    const days = getDaysUntil(triggerDate)
    if (days < 0) return 'Overdue'
    if (days === 0) return 'Today'
    if (days === 1) return 'Tomorrow'
    if (days < 7) return `In ${days} days`
    if (days < 30) return `In ${Math.ceil(days / 7)} weeks`
    return new Date(triggerDate).toLocaleDateString()
  }

  return {
    // State
    alerts,
    unreadCount,
    upcomingAlerts,
    visaInfo,
    loading,
    error,
    isPro,
    // Constants
    VISA_LABELS,
    // Actions
    fetchAlerts,
    fetchUnreadCount,
    fetchUpcoming,
    setupVisaTracking,
    createAlert,
    markAsRead,
    dismissAlert,
    deleteAlert,
    // Helpers
    getPriorityInfo,
    getAlertIcon,
    getDaysUntil,
    formatTriggerDate,
  }
}
