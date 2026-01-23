import type { Context, Config } from '@netlify/functions'
import { getDb } from './lib/db.mts'

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

async function requirePro(db: ReturnType<typeof getDb>, userId: string) {
  const result = await db`SELECT is_pro FROM user_profiles WHERE user_id = ${userId}`
  if (result.length === 0 || !result[0].is_pro) {
    throw new Error('Pro subscription required')
  }
}

interface CreateAlertRequest {
  alertType: string
  title: string
  message: string
  triggerDate: string
  referenceData?: Record<string, unknown>
  priority?: number
}

interface SetVisaInfoRequest {
  visaType: string
  entryDate: string
  visaExpiryDate?: string
}

export default async (req: Request, context: Context) => {
  const db = await getDb()
  const userId = req.headers.get('x-user-id')

  if (!userId) {
    return json({ error: 'Unauthorized' }, 401)
  }

  try {
    await requirePro(db, userId)

    const url = new URL(req.url)
    const alertId = url.searchParams.get('id')
    const action = url.searchParams.get('action')

    switch (req.method) {
      case 'GET': {
        if (action === 'unread-count') {
          const result = await db`
            SELECT COUNT(*) as count FROM user_alerts
            WHERE user_id = ${userId} AND is_read = false AND is_dismissed = false
            AND trigger_date <= CURRENT_DATE
          `
          return json({ count: parseInt(result[0].count) })
        }

        if (action === 'upcoming') {
          // Get alerts for next 30 days
          const alerts = await db`
            SELECT * FROM user_alerts
            WHERE user_id = ${userId}
            AND is_dismissed = false
            AND trigger_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
            ORDER BY trigger_date, priority DESC
          `
          return json({ alerts })
        }

        // Get all alerts
        const showDismissed = url.searchParams.get('showDismissed') === 'true'
        const alerts = await db`
          SELECT * FROM user_alerts
          WHERE user_id = ${userId}
          ${showDismissed ? db`` : db`AND is_dismissed = false`}
          ORDER BY trigger_date DESC, priority DESC
          LIMIT 50
        `
        return json({ alerts })
      }

      case 'POST': {
        const body = await req.json()

        // Handle visa info setup - automatically creates alerts
        if (body.action === 'setup-visa') {
          const visaReq = body as SetVisaInfoRequest & { action: string }
          return await setupVisaAlerts(db, userId, visaReq)
        }

        // Create manual alert
        const createReq = body as CreateAlertRequest
        const [alert] = await db`
          INSERT INTO user_alerts (
            user_id, alert_type, title, message, trigger_date, reference_data, priority
          )
          VALUES (
            ${userId},
            ${createReq.alertType},
            ${createReq.title},
            ${createReq.message},
            ${createReq.triggerDate},
            ${JSON.stringify(createReq.referenceData || {})},
            ${createReq.priority || 2}
          )
          RETURNING *
        `
        return json({ alert }, 201)
      }

      case 'PUT': {
        if (!alertId) {
          return json({ error: 'Alert ID required' }, 400)
        }

        const body = await req.json()

        // Mark as read
        if (body.action === 'read') {
          await db`
            UPDATE user_alerts
            SET is_read = true, updated_at = NOW()
            WHERE id = ${alertId} AND user_id = ${userId}
          `
          return json({ success: true })
        }

        // Mark as dismissed
        if (body.action === 'dismiss') {
          await db`
            UPDATE user_alerts
            SET is_dismissed = true, updated_at = NOW()
            WHERE id = ${alertId} AND user_id = ${userId}
          `
          return json({ success: true })
        }

        // Update alert
        const [updated] = await db`
          UPDATE user_alerts SET
            title = COALESCE(${body.title || null}, title),
            message = COALESCE(${body.message || null}, message),
            trigger_date = COALESCE(${body.triggerDate || null}, trigger_date),
            priority = COALESCE(${body.priority || null}, priority),
            updated_at = NOW()
          WHERE id = ${alertId} AND user_id = ${userId}
          RETURNING *
        `

        if (!updated) {
          return json({ error: 'Alert not found' }, 404)
        }

        return json({ alert: updated })
      }

      case 'DELETE': {
        if (!alertId) {
          return json({ error: 'Alert ID required' }, 400)
        }

        const deleted = await db`
          DELETE FROM user_alerts
          WHERE id = ${alertId} AND user_id = ${userId}
          RETURNING id
        `

        if (deleted.length === 0) {
          return json({ error: 'Alert not found' }, 404)
        }

        return json({ success: true })
      }

      default:
        return json({ error: 'Method not allowed' }, 405)
    }
  } catch (error) {
    console.error('Alerts error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message.includes('Pro subscription') ? 403 : 500
    return json({ error: message }, status)
  }
}

async function setupVisaAlerts(
  db: ReturnType<typeof getDb>,
  userId: string,
  request: SetVisaInfoRequest
) {
  const { visaType, entryDate, visaExpiryDate } = request

  // Update user profile with visa info
  await db`
    UPDATE user_profiles SET
      current_visa_type = ${visaType},
      entry_date = ${entryDate},
      visa_expiry_date = ${visaExpiryDate || null},
      updated_at = NOW()
    WHERE user_id = ${userId}
  `

  const alerts: Record<string, unknown>[] = []
  const entryDateObj = new Date(entryDate)

  // Visa-specific alerts based on type
  const visaConfigs: Record<string, { duration: number; extensible: boolean; reporting90: boolean }> = {
    visa_exempt: { duration: 30, extensible: true, reporting90: false },
    visa_exempt_60: { duration: 60, extensible: true, reporting90: false },
    tourist_visa_60: { duration: 60, extensible: true, reporting90: false },
    tourist_visa_90: { duration: 90, extensible: false, reporting90: true },
    dtv: { duration: 180, extensible: true, reporting90: true },
    ed_visa: { duration: 90, extensible: true, reporting90: true },
    retirement_visa: { duration: 365, extensible: true, reporting90: true },
    work_permit: { duration: 365, extensible: true, reporting90: true },
  }

  const config = visaConfigs[visaType] || { duration: 30, extensible: false, reporting90: false }
  const expiryDate = visaExpiryDate ? new Date(visaExpiryDate) : new Date(entryDateObj.getTime() + config.duration * 24 * 60 * 60 * 1000)

  // Clear existing visa alerts for this user
  await db`
    DELETE FROM user_alerts
    WHERE user_id = ${userId}
    AND alert_type IN ('visa_expiry', 'visa_extension', '90day_report')
  `

  // 1. Visa expiry warning (7 days before)
  const expiryWarningDate = new Date(expiryDate)
  expiryWarningDate.setDate(expiryWarningDate.getDate() - 7)

  const [expiryAlert] = await db`
    INSERT INTO user_alerts (user_id, alert_type, title, message, trigger_date, reference_data, priority)
    VALUES (
      ${userId},
      'visa_expiry',
      'Visa Expiring Soon',
      ${'Your ' + visaType.replace(/_/g, ' ') + ' expires in 7 days. ' + (config.extensible ? 'Consider applying for an extension at your local immigration office.' : 'Plan your departure or apply for a new visa.')},
      ${expiryWarningDate.toISOString().split('T')[0]},
      ${JSON.stringify({ visaType, expiryDate: expiryDate.toISOString().split('T')[0] })},
      4
    )
    RETURNING *
  `
  alerts.push(expiryAlert)

  // 2. Extension reminder (14 days before expiry, if extensible)
  if (config.extensible) {
    const extensionReminderDate = new Date(expiryDate)
    extensionReminderDate.setDate(extensionReminderDate.getDate() - 14)

    const [extensionAlert] = await db`
      INSERT INTO user_alerts (user_id, alert_type, title, message, trigger_date, reference_data, priority)
      VALUES (
        ${userId},
        'visa_extension',
        'Time to Extend Your Visa',
        'Your visa expires in 2 weeks. Visit immigration to apply for an extension. Bring: passport, TM.6 card, 4x6cm photos, 1,900 THB fee.',
        ${extensionReminderDate.toISOString().split('T')[0]},
        ${JSON.stringify({ visaType, expiryDate: expiryDate.toISOString().split('T')[0] })},
        3
      )
      RETURNING *
    `
    alerts.push(extensionAlert)
  }

  // 3. 90-day reporting reminders (if applicable)
  if (config.reporting90) {
    let reportDate = new Date(entryDateObj)
    reportDate.setDate(reportDate.getDate() + 90)

    while (reportDate < expiryDate) {
      // Reminder 7 days before 90-day report is due
      const reminderDate = new Date(reportDate)
      reminderDate.setDate(reminderDate.getDate() - 7)

      if (reminderDate > new Date()) {
        const [reportAlert] = await db`
          INSERT INTO user_alerts (user_id, alert_type, title, message, trigger_date, reference_data, priority)
          VALUES (
            ${userId},
            '90day_report',
            '90-Day Report Due Soon',
            'Your 90-day report is due on ${reportDate.toLocaleDateString()}. Report online at https://tm47.immigration.go.th or visit your local immigration office.',
            ${reminderDate.toISOString().split('T')[0]},
            ${JSON.stringify({ dueDate: reportDate.toISOString().split('T')[0] })},
            3
          )
          RETURNING *
        `
        alerts.push(reportAlert)
      }

      // Next 90-day report
      reportDate.setDate(reportDate.getDate() + 90)
    }
  }

  // 4. Add a welcome/confirmation alert
  const [welcomeAlert] = await db`
    INSERT INTO user_alerts (user_id, alert_type, title, message, trigger_date, reference_data, priority)
    VALUES (
      ${userId},
      'travel_tip',
      'Visa Tracking Active',
      'Your ${visaType.replace(/_/g, ' ')} is now being tracked. You''ll receive reminders for important dates. Your visa expires on ${expiryDate.toLocaleDateString()}.',
      ${new Date().toISOString().split('T')[0]},
      ${JSON.stringify({ visaType })},
      1
    )
    RETURNING *
  `
  alerts.push(welcomeAlert)

  return json({
    success: true,
    alerts,
    visaInfo: {
      type: visaType,
      entryDate,
      expiryDate: expiryDate.toISOString().split('T')[0],
      daysRemaining: Math.ceil((expiryDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
    },
  }, 201)
}

export const config: Config = {
  path: '/api/alerts',
}
