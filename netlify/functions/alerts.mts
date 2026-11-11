import type { Context, Config } from '@netlify/functions'
import { getDb } from './lib/db.mts'
import { requireAuth } from './lib/auth.mts'

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

// The page reads camelCase fields (src/composables/useAlerts.ts); the table is snake_case.
function toAlert(row: Record<string, unknown>) {
  const triggerDate = row.trigger_date instanceof Date
    ? row.trigger_date.toISOString().split('T')[0]
    : row.trigger_date
  return {
    id: row.id,
    userId: row.user_id,
    alertType: row.alert_type,
    title: row.title,
    message: row.message,
    triggerDate,
    referenceData: row.reference_data,
    isRead: row.is_read,
    isDismissed: row.is_dismissed,
    isSent: row.is_sent,
    priority: row.priority,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const toAlerts = (rows: Record<string, unknown>[]) => rows.map(toAlert)

export default async (req: Request, context: Context) => {
  const db = await getDb()
  let userId: string
  try {
    userId = await requireAuth(req)
  } catch (response) {
    return response as Response
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
          return json({ alerts: toAlerts(alerts) })
        }

        // Get all alerts
        const showDismissed = url.searchParams.get('showDismissed') === 'true'
        let alerts
        if (showDismissed) {
          alerts = await db`
            SELECT * FROM user_alerts
            WHERE user_id = ${userId}
            ORDER BY trigger_date DESC, priority DESC
            LIMIT 50
          `
        } else {
          alerts = await db`
            SELECT * FROM user_alerts
            WHERE user_id = ${userId} AND is_dismissed = false
            ORDER BY trigger_date DESC, priority DESC
            LIMIT 50
          `
        }
        return json({ alerts: toAlerts(alerts) })
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
        return json({ alert: toAlert(alert) }, 201)
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

        return json({ alert: toAlert(updated) })
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

// Visa rules used for the reminders (checked 2026-11-12; same sources as countryStore.ts / ai.mts,
// T-0381 + T-0445: Thai embassy/immigration pages; extension = form TM.7, one 4x6 cm photo and
// 1,900 THB per thailand.go.th). duration = days of stay from the entry date, used only when the
// user leaves the expiry date empty; null = no safe default, the stamp date is required.
interface VisaConfig {
  label: string
  duration: number | null
  extensible: boolean
  reporting90: boolean
}

const VISA_CONFIGS: Record<string, VisaConfig> = {
  // 30-day general visa exemption (since 15 Sep 2026)
  visa_exempt: { label: 'visa-exempt stay', duration: 30, extensible: true, reporting90: false },
  // Key kept for stored rows. The old 60-day exemption ended on 15 Sep 2026; other nationalities
  // get 15 days or a bilateral 14, 30 or 90 days, so only the stamp date is reliable.
  visa_exempt_60: { label: 'visa-exempt stay', duration: null, extensible: true, reporting90: false },
  // Single-entry tourist visa (TR): usually 60 days; the visa states the permitted stay
  tourist_visa_60: { label: 'tourist visa stay', duration: 60, extensible: true, reporting90: false },
  // Key kept for stored rows only: Thailand has no 90-day tourist visa (not offered in the form)
  tourist_visa_90: { label: 'tourist visa stay', duration: null, extensible: false, reporting90: true },
  // DTV: up to 180 days per entry, one 180-day extension
  dtv: { label: 'DTV stay', duration: 180, extensible: true, reporting90: true },
  // Non-ED: 90 days on entry, then extensions
  ed_visa: { label: 'education visa stay', duration: 90, extensible: true, reporting90: true },
  // Non-O-A: 1 year per entry
  retirement_visa: { label: 'retirement visa (O-A) stay', duration: 365, extensible: true, reporting90: true },
  // Non-B: 90 days on entry, 1 year after an extension based on the work permit
  work_permit: { label: 'Non-B / work permit stay', duration: null, extensible: true, reporting90: true },
}

const DEFAULT_VISA_CONFIG: VisaConfig = { label: 'stay', duration: 30, extensible: false, reporting90: false }

const DAY_MS = 24 * 60 * 60 * 1000
// 90-day report: from 15 days before the due date; online (TM.47 site) until 7 days before it,
// in person until 7 days after it; later than that = 2,000 THB fine (immigration.go.th page_id=1666)
const REPORT_OPENS_DAYS_BEFORE = 15
const ONLINE_CLOSES_DAYS_BEFORE = 7
const IN_PERSON_CLOSES_DAYS_AFTER = 7

const addDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY_MS)
const isoDate = (date: Date) => date.toISOString().split('T')[0]
// '12 Nov 2026': the same for every reader (toLocaleDateString() gave US-style 11/12/2026)
const readableDate = (date: Date) =>
  date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

function parseIsoDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime()) || isoDate(date) !== value ? null : date
}

async function setupVisaAlerts(
  db: ReturnType<typeof getDb>,
  userId: string,
  request: SetVisaInfoRequest
) {
  const { visaType, entryDate, visaExpiryDate } = request
  const config = VISA_CONFIGS[visaType] || DEFAULT_VISA_CONFIG

  // Validate before anything is stored
  const entryDateObj = parseIsoDate(entryDate)
  if (!entryDateObj) {
    return json({ error: 'Enter your entry date (YYYY-MM-DD).' }, 400)
  }
  let expiryDate: Date
  if (visaExpiryDate) {
    const parsedExpiry = parseIsoDate(visaExpiryDate)
    if (!parsedExpiry || parsedExpiry <= entryDateObj) {
      return json({ error: 'The expiry date must be a valid date after your entry date.' }, 400)
    }
    expiryDate = parsedExpiry
  } else if (config.duration === null) {
    return json({ error: 'For this visa type, enter the date on your entry stamp (permitted to stay until).' }, 400)
  } else {
    expiryDate = addDays(entryDateObj, config.duration)
  }

  const today = new Date(`${isoDate(new Date())}T00:00:00Z`)
  const expiryText = readableDate(expiryDate)
  const insertedRows: Record<string, unknown>[] = []

  // Every text below is passed as one query parameter. A ${...} inside a quoted SQL string
  // made Postgres refuse the whole insert ('bind message supplies N parameters'), so visa
  // tracking could never be set up.
  async function insertAlert(alertType: string, title: string, message: string, triggerDate: Date, referenceData: Record<string, unknown>, priority: number) {
    const [row] = await db`
      INSERT INTO user_alerts (user_id, alert_type, title, message, trigger_date, reference_data, priority)
      VALUES (${userId}, ${alertType}, ${title}, ${message}, ${isoDate(triggerDate)}, ${JSON.stringify(referenceData)}, ${priority})
      RETURNING *
    `
    if (row) insertedRows.push(row)
  }

  // Update user profile with visa info
  await db`
    UPDATE user_profiles SET
      current_visa_type = ${visaType},
      entry_date = ${entryDate},
      visa_expiry_date = ${isoDate(expiryDate)},
      updated_at = NOW()
    WHERE user_id = ${userId}
  `

  // Clear existing visa alerts for this user
  await db`
    DELETE FROM user_alerts
    WHERE user_id = ${userId}
    AND alert_type IN ('visa_expiry', 'visa_extension', '90day_report')
  `

  const visaRef = { visaType, expiryDate: isoDate(expiryDate) }

  // 1. Permitted stay ends in 7 days
  await insertAlert(
    'visa_expiry',
    'Visa Expiring Soon',
    `Your ${config.label} ends in 7 days, on ${expiryText}. ` +
      (config.extensible
        ? 'To stay longer, apply for an extension at an immigration office before that date. '
        : 'Plan your departure or get a new visa before that date. ') +
      'Staying past it is an overstay: 500 THB per day (up to 20,000 THB), and a ban from Thailand if you are caught.',
    addDays(expiryDate, -7),
    visaRef,
    4
  )

  // 2. Extension reminder (14 days before the stay ends, if it can be extended)
  if (config.extensible) {
    await insertAlert(
      'visa_extension',
      'Time to Extend Your Visa',
      `Your ${config.label} ends in 2 weeks, on ${expiryText}. To stay longer, apply at your local immigration office before that date: ` +
        'passport, form TM.7, one 4x6 cm photo and the 1,900 THB fee; other documents depend on your visa type. ' +
        'An extension is at the immigration officer\'s discretion.',
      addDays(expiryDate, -14),
      visaRef,
      3
    )
  }

  // 3. 90-day reports: one alert per report, when its window opens (or today, if it is already open)
  if (config.reporting90) {
    for (let dueDate = addDays(entryDateObj, 90); dueDate < expiryDate; dueDate = addDays(dueDate, 90)) {
      const inPersonCloses = addDays(dueDate, IN_PERSON_CLOSES_DAYS_AFTER)
      if (inPersonCloses < today) continue // past report: nothing to remind
      const opens = addDays(dueDate, -REPORT_OPENS_DAYS_BEFORE)
      const onlineCloses = addDays(dueDate, -ONLINE_CLOSES_DAYS_BEFORE)
      const onlineText = onlineCloses >= today
        ? `online at tm47.immigration.go.th until ${readableDate(onlineCloses)}, or `
        : ''
      await insertAlert(
        '90day_report',
        '90-Day Report Due Soon',
        `Your 90-day report is due on ${readableDate(dueDate)}. You can report from ${readableDate(opens)}: ` +
          `${onlineText}in person at your immigration office until ${readableDate(inPersonCloses)}. ` +
          'Reporting later than that costs a 2,000 THB fine.',
        opens > today ? opens : today,
        { dueDate: isoDate(dueDate) },
        3
      )
    }
  }

  // 4. Confirmation
  await insertAlert(
    'travel_tip',
    'Visa Tracking Active',
    `Your ${config.label} is now tracked: it ends on ${expiryText}` +
      (visaExpiryDate ? '. ' : ' (worked out from your entry date; check it against the date on your entry stamp). ') +
      'You will get reminders before each important date.',
    today,
    { visaType },
    1
  )

  return json({
    success: true,
    alerts: toAlerts(insertedRows),
    visaInfo: {
      type: visaType,
      entryDate,
      expiryDate: isoDate(expiryDate),
      daysRemaining: Math.ceil((expiryDate.getTime() - Date.now()) / DAY_MS),
    },
  }, 201)
}
