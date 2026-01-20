import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAlerts, type Alert } from './useAlerts'
import { useUserStore } from '@/stores/userStore'
import { mockFetch, createMockResponse } from '@/test/setup'

describe('useAlerts', () => {
  let userStore: ReturnType<typeof useUserStore>

  const mockAlert: Alert = {
    id: 'alert-1',
    userId: 'user-123',
    alertType: 'visa_expiry',
    title: 'Visa Expiring Soon',
    message: 'Your visa expires in 7 days',
    triggerDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    referenceData: { visaType: 'tourist' },
    isRead: false,
    isDismissed: false,
    isSent: false,
    priority: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    userStore = useUserStore()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('Pro requirement', () => {
    it('should not fetch alerts for non-Pro users', async () => {
      userStore.setPro(false)

      const { fetchAlerts } = useAlerts()
      const result = await fetchAlerts()

      expect(result).toEqual([])
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should not allow visa tracking setup for non-Pro users', async () => {
      userStore.setPro(false)

      const { setupVisaTracking } = useAlerts()
      const result = await setupVisaTracking('visa_exempt', '2024-06-01')

      expect(result).toBeNull()
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should not allow alert creation for non-Pro users', async () => {
      userStore.setPro(false)

      const { createAlert } = useAlerts()
      const result = await createAlert({
        alertType: 'travel_tip',
        title: 'Test',
        message: 'Test message',
        triggerDate: '2024-07-01',
      })

      expect(result).toBeNull()
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('fetchAlerts', () => {
    it('should fetch alerts for Pro users', async () => {
      userStore.setPro(true)
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ alerts: [mockAlert] })
      )

      const { fetchAlerts, alerts } = useAlerts()
      await fetchAlerts()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/alerts'),
        expect.any(Object)
      )
      expect(alerts.value).toHaveLength(1)
      expect(alerts.value[0].id).toBe('alert-1')
    })

    it('should fetch dismissed alerts when requested', async () => {
      userStore.setPro(true)
      mockFetch.mockResolvedValueOnce(createMockResponse({ alerts: [] }))

      const { fetchAlerts } = useAlerts()
      await fetchAlerts(true)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/alerts?showDismissed=true'),
        expect.any(Object)
      )
    })
  })

  describe('fetchUnreadCount', () => {
    it('should fetch unread count for Pro users', async () => {
      userStore.setPro(true)
      mockFetch.mockResolvedValueOnce(createMockResponse({ count: 5 }))

      const { fetchUnreadCount, unreadCount } = useAlerts()
      await fetchUnreadCount()

      expect(unreadCount.value).toBe(5)
    })

    it('should return 0 for non-Pro users', async () => {
      userStore.setPro(false)

      const { fetchUnreadCount } = useAlerts()
      const result = await fetchUnreadCount()

      expect(result).toBe(0)
    })
  })

  describe('fetchUpcoming', () => {
    it('should fetch upcoming alerts for Pro users', async () => {
      userStore.setPro(true)
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ alerts: [mockAlert] })
      )

      const { fetchUpcoming, upcomingAlerts } = useAlerts()
      await fetchUpcoming()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/alerts?action=upcoming'),
        expect.any(Object)
      )
      expect(upcomingAlerts.value).toHaveLength(1)
    })
  })

  describe('setupVisaTracking', () => {
    it('should setup visa tracking and return visa info', async () => {
      userStore.setPro(true)
      const visaInfo = {
        type: 'visa_exempt',
        entryDate: '2024-06-01',
        expiryDate: '2024-06-30',
        daysRemaining: 15,
      }
      mockFetch
        .mockResolvedValueOnce(
          createMockResponse({
            success: true,
            alerts: [mockAlert],
            visaInfo,
          })
        )
        .mockResolvedValueOnce(createMockResponse({ alerts: [mockAlert] }))
        .mockResolvedValueOnce(createMockResponse({ count: 1 }))

      const { setupVisaTracking, visaInfo: storedVisaInfo } = useAlerts()
      await setupVisaTracking('visa_exempt', '2024-06-01', '2024-06-30')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/alerts'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('setup-visa'),
        })
      )
      expect(storedVisaInfo.value).toEqual(visaInfo)
    })
  })

  describe('createAlert', () => {
    it('should create alert and update state', async () => {
      userStore.setPro(true)
      mockFetch
        .mockResolvedValueOnce(createMockResponse({ alert: mockAlert }))
        .mockResolvedValueOnce(createMockResponse({ count: 1 }))

      const { createAlert, alerts } = useAlerts()
      const result = await createAlert({
        alertType: 'visa_expiry',
        title: 'Test Alert',
        message: 'Test message',
        triggerDate: '2024-07-01',
      })

      expect(result).toEqual(mockAlert)
      expect(alerts.value).toContainEqual(mockAlert)
    })
  })

  describe('markAsRead', () => {
    it('should mark alert as read', async () => {
      userStore.setPro(true)
      mockFetch
        .mockResolvedValueOnce(createMockResponse({ alerts: [mockAlert] }))
        .mockResolvedValueOnce(createMockResponse({ success: true }))

      const { fetchAlerts, markAsRead, alerts, unreadCount } = useAlerts()
      await fetchAlerts()
      unreadCount.value = 1

      const result = await markAsRead('alert-1')

      expect(result).toBe(true)
      expect(alerts.value[0].isRead).toBe(true)
      expect(unreadCount.value).toBe(0)
    })
  })

  describe('dismissAlert', () => {
    it('should dismiss alert and remove from lists', async () => {
      userStore.setPro(true)
      mockFetch
        .mockResolvedValueOnce(createMockResponse({ alerts: [mockAlert] }))
        .mockResolvedValueOnce(createMockResponse({ success: true }))
        .mockResolvedValueOnce(createMockResponse({ count: 0 }))

      const { fetchAlerts, dismissAlert, alerts } = useAlerts()
      await fetchAlerts()

      const result = await dismissAlert('alert-1')

      expect(result).toBe(true)
      expect(alerts.value).toHaveLength(0)
    })
  })

  describe('deleteAlert', () => {
    it('should delete alert', async () => {
      userStore.setPro(true)
      mockFetch
        .mockResolvedValueOnce(createMockResponse({ alerts: [mockAlert] }))
        .mockResolvedValueOnce(createMockResponse({ success: true }))
        .mockResolvedValueOnce(createMockResponse({ count: 0 }))

      const { fetchAlerts, deleteAlert, alerts } = useAlerts()
      await fetchAlerts()

      const result = await deleteAlert('alert-1')

      expect(result).toBe(true)
      expect(alerts.value).toHaveLength(0)
    })
  })

  describe('getPriorityInfo', () => {
    it('should return correct info for each priority level', () => {
      const { getPriorityInfo } = useAlerts()

      expect(getPriorityInfo(1)).toEqual({
        label: 'Low',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
      })

      expect(getPriorityInfo(2)).toEqual({
        label: 'Medium',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
      })

      expect(getPriorityInfo(3)).toEqual({
        label: 'High',
        color: 'text-amber-600',
        bgColor: 'bg-amber-100',
      })

      expect(getPriorityInfo(4)).toEqual({
        label: 'Urgent',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
      })
    })
  })

  describe('getAlertIcon', () => {
    it('should return correct emoji for each alert type', () => {
      const { getAlertIcon } = useAlerts()

      expect(getAlertIcon('visa_expiry')).toBe('🛂')
      expect(getAlertIcon('visa_extension')).toBe('📝')
      expect(getAlertIcon('90day_report')).toBe('📋')
      expect(getAlertIcon('departure_reminder')).toBe('✈️')
      expect(getAlertIcon('travel_tip')).toBe('💡')
      expect(getAlertIcon('weather_alert')).toBe('🌤️')
      expect(getAlertIcon('event_reminder')).toBe('🎉')
    })
  })

  describe('getDaysUntil', () => {
    it('should return positive days for future date', () => {
      const { getDaysUntil } = useAlerts()
      const futureDate = new Date('2024-06-22T12:00:00Z').toISOString() // 7 days from mock time

      expect(getDaysUntil(futureDate)).toBe(7)
    })

    it('should return 0 for today', () => {
      const { getDaysUntil } = useAlerts()
      const today = new Date('2024-06-15T23:59:59Z').toISOString()

      expect(getDaysUntil(today)).toBeLessThanOrEqual(1)
    })

    it('should return negative days for past date', () => {
      const { getDaysUntil } = useAlerts()
      const pastDate = new Date('2024-06-10T12:00:00Z').toISOString() // 5 days ago

      expect(getDaysUntil(pastDate)).toBe(-5)
    })
  })

  describe('formatTriggerDate', () => {
    it('should return "Overdue" for past dates', () => {
      const { formatTriggerDate } = useAlerts()
      const pastDate = new Date('2024-06-10T12:00:00Z').toISOString()

      expect(formatTriggerDate(pastDate)).toBe('Overdue')
    })

    it('should return "Today" for today', () => {
      const { formatTriggerDate } = useAlerts()
      const today = new Date('2024-06-15T12:00:00Z').toISOString()

      expect(formatTriggerDate(today)).toBe('Today')
    })

    it('should return "Tomorrow" for next day', () => {
      const { formatTriggerDate } = useAlerts()
      const tomorrow = new Date('2024-06-16T12:00:00Z').toISOString()

      expect(formatTriggerDate(tomorrow)).toBe('Tomorrow')
    })

    it('should return "In X days" for dates within a week', () => {
      const { formatTriggerDate } = useAlerts()
      const inFiveDays = new Date('2024-06-20T12:00:00Z').toISOString()

      expect(formatTriggerDate(inFiveDays)).toBe('In 5 days')
    })

    it('should return "In X weeks" for dates within a month', () => {
      const { formatTriggerDate } = useAlerts()
      const inTwoWeeks = new Date('2024-07-01T12:00:00Z').toISOString()

      expect(formatTriggerDate(inTwoWeeks)).toMatch(/In \d+ weeks/)
    })

    it('should return formatted date for dates beyond a month', () => {
      const { formatTriggerDate } = useAlerts()
      const farFuture = new Date('2024-08-15T12:00:00Z').toISOString()

      // Should return a locale-formatted date string
      expect(formatTriggerDate(farFuture)).toMatch(/\d/)
    })
  })

  describe('VISA_LABELS', () => {
    it('should have labels for all visa types', () => {
      const { VISA_LABELS } = useAlerts()

      expect(VISA_LABELS.visa_exempt).toBe('Visa Exempt (30 days)')
      expect(VISA_LABELS.visa_exempt_60).toBe('Visa Exempt (60 days)')
      expect(VISA_LABELS.tourist_visa_60).toBe('Tourist Visa (60 days)')
      expect(VISA_LABELS.tourist_visa_90).toBe('Tourist Visa (90 days)')
      expect(VISA_LABELS.dtv).toBe('Destination Thailand Visa (DTV)')
      expect(VISA_LABELS.ed_visa).toBe('Education Visa (ED)')
      expect(VISA_LABELS.retirement_visa).toBe('Retirement Visa (O-A)')
      expect(VISA_LABELS.work_permit).toBe('Work Permit (Non-B)')
    })
  })
})
