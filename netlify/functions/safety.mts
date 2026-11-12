import type { Context, Config } from '@netlify/functions'
import { getDb } from './lib/db.mts'
import { optionalAuth } from './lib/auth.mts'
import { checkRateLimit, getClientIp } from './lib/rate-limit.mts'

interface ScamReport {
  id: string
  scam_type: string
  title: string
  description: string
  location_name: string
  province: string
  lat?: number
  lng?: number
  severity: number
  verified: boolean
  report_count: number
  last_reported_at: string
  created_at: string
}

interface ProvinceSafety {
  province: string
  overall_score: number
  tourist_police_phone: string
  local_emergency?: string
  hospital_name?: string
  hospital_address?: string
  notes: string
}

interface NewScamReport {
  scam_type: string
  title: string
  description: string
  location_name?: string
  province: string
  lat?: number
  lng?: number
  severity?: number
}

const SCAM_TYPES = [
  { value: 'gem_shop', label: 'Gem Shop Scam', icon: '💎' },
  { value: 'tuk_tuk', label: 'Tuk-Tuk Scam', icon: '🛺' },
  { value: 'taxi', label: 'Taxi Scam', icon: '🚕' },
  { value: 'jet_ski', label: 'Jet Ski Scam', icon: '🚤' },
  { value: 'fake_monk', label: 'Fake Monk', icon: '🧘' },
  { value: 'overcharge', label: 'Overcharging', icon: '💰' },
  { value: 'tour_scam', label: 'Tour Scam', icon: '🗺️' },
  { value: 'atm_scam', label: 'ATM Scam', icon: '🏧' },
  { value: 'rental_scam', label: 'Rental Scam', icon: '🏍️' },
  { value: 'other', label: 'Other', icon: '⚠️' },
]

// Input limits for a new report (T-0565).
const REPORT_LIMITS = { title: 120, description: 2000, location_name: 120, province: 60 } as const
// At most this many unchecked reports from everyone together in 24 hours (T-0571).
const MAX_UNCHECKED_REPORTS_PER_DAY = 50

/** A message when a submitted report is malformed or too long; null when fine. */
export function reportProblem(body: unknown): string | null {
  if (!body || typeof body !== 'object') return 'Invalid report'
  const report = body as Record<string, unknown>
  if (typeof report.scam_type !== 'string' || !SCAM_TYPES.some(t => t.value === report.scam_type)) {
    return 'Unknown scam type'
  }
  for (const [field, max] of Object.entries(REPORT_LIMITS)) {
    const value = report[field]
    if (value === undefined || value === null || value === '') continue
    if (typeof value !== 'string') return `${field} must be text`
    if (value.length > max) return `${field} is too long (max ${max} characters)`
  }
  for (const [field, min, max] of [['lat', 5, 21], ['lng', 97, 106]] as const) {
    const value = report[field]
    if (value === undefined || value === null || value === '') continue
    if (typeof value !== 'number' || value < min || value > max) return `${field} must be a location in Thailand`
  }
  return null
}

export default async (req: Request, context: Context) => {
  const db = await getDb()
  const url = new URL(req.url)
  const userId = await optionalAuth(req)

  try {
    // GET /api/safety - Get scam reports and safety info
    if (req.method === 'GET') {
      const province = url.searchParams.get('province')
      const scamType = url.searchParams.get('type')
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)

      // Build query based on filters. Only checked (verified) reports are public (T-0565):
      // anyone can submit one, and before this a made-up report naming a real business went
      // live at once, sorted to the top by a severity the sender picked.
      let scamReports: ScamReport[]
      if (province && scamType) {
        scamReports = await db`
          SELECT * FROM scam_reports
          WHERE province = ${province} AND scam_type = ${scamType} AND verified = true
          ORDER BY severity DESC, verified DESC, last_reported_at DESC
          LIMIT ${limit}
        `
      } else if (province) {
        scamReports = await db`
          SELECT * FROM scam_reports
          WHERE province = ${province} AND verified = true
          ORDER BY severity DESC, verified DESC, last_reported_at DESC
          LIMIT ${limit}
        `
      } else if (scamType) {
        scamReports = await db`
          SELECT * FROM scam_reports
          WHERE scam_type = ${scamType} AND verified = true
          ORDER BY severity DESC, verified DESC, last_reported_at DESC
          LIMIT ${limit}
        `
      } else {
        scamReports = await db`
          SELECT * FROM scam_reports
          WHERE verified = true
          ORDER BY severity DESC, verified DESC, last_reported_at DESC
          LIMIT ${limit}
        `
      }

      // Get province safety data
      let provinceSafety: ProvinceSafety[]
      if (province) {
        provinceSafety = await db`
          SELECT * FROM province_safety WHERE province = ${province}
        `
      } else {
        provinceSafety = await db`
          SELECT * FROM province_safety ORDER BY province
        `
      }

      // Get statistics
      // Public numbers count checked reports only (T-0571): unchecked ones are hidden, so
      // counting them let spam raise the page's 'N reports' figure.
      const stats = await db`
        SELECT
          COUNT(*) FILTER (WHERE verified = true) as total_reports,
          COUNT(*) FILTER (WHERE verified = true) as verified_reports,
          COUNT(DISTINCT province) FILTER (WHERE verified = true) as provinces_covered
        FROM scam_reports
      `

      // Public endpoint: never send the reporter's user_id (the API identifies users by
      // that id, so publishing it would let anyone act as the reporter).
      const publicReports = scamReports.map(({ user_id: _reporter, ...report }) => report)

      return new Response(JSON.stringify({
        scamReports: publicReports,
        provinceSafety,
        scamTypes: SCAM_TYPES,
        stats: stats[0],
        emergencyNumbers: {
          touristPolice: '1155',
          police: '191',
          ambulance: '1669',
          fire: '199',
        },
      }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // POST /api/safety - Submit a new scam report
    if (req.method === 'POST') {
      // At most 5 reports per hour from one address (per instance; see lib/rate-limit.mts).
      const rate = checkRateLimit(`${getClientIp(req, context)}:safety-report`, 5, 3_600_000)
      if (!rate.allowed) {
        return new Response(JSON.stringify({ error: 'Too many reports, please try again later' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const body: NewScamReport = await req.json()
      if (!body?.scam_type || !body?.title || !body?.description || !body?.province) {
        return new Response(JSON.stringify({
          error: 'Missing required fields: scam_type, title, description, province'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      const problem = reportProblem(body)
      if (problem) {
        return new Response(JSON.stringify({ error: problem }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      const { scam_type, title, description, location_name, province, lat, lng } = body
      // The form offers 1-3; anything else (e.g. 999 to top the list) becomes the default.
      const severity = [1, 2, 3].includes(Number(body.severity)) ? Number(body.severity) : 2

      if (!scam_type || !title || !description || !province) {
        return new Response(JSON.stringify({
          error: 'Missing required fields: scam_type, title, description, province'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // Check for similar existing reports (to increment count instead of duplicate)
      const existing = await db`
        SELECT id, report_count FROM scam_reports
        WHERE scam_type = ${scam_type}
        AND province = ${province}
        AND LOWER(title) = LOWER(${title})
        LIMIT 1
      `

      if (existing.length > 0) {
        // Increment report count for existing report. The reply carries no report data
        // (T-0571): it returned the whole row, so guessing a type + province + title showed
        // an unchecked report and its reporter's user_id, which the public list never shows.
        await db`
          UPDATE scam_reports
          SET report_count = report_count + 1,
              last_reported_at = NOW(),
              updated_at = NOW()
          WHERE id = ${existing[0].id}
        `
        return new Response(JSON.stringify({
          message: 'Report added to existing entry',
          merged: true,
        }), {
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // A ceiling on unchecked reports across all senders (T-0571): the per-address limit
      // is per function instance and IPv6 hands out many addresses, so the database
      // itself must not fill up with unchecked reports.
      const pending = await db`
        SELECT COUNT(*)::int AS count FROM scam_reports
        WHERE verified = false AND created_at > NOW() - INTERVAL '24 hours'
      `
      if ((pending[0]?.count ?? 0) >= MAX_UNCHECKED_REPORTS_PER_DAY) {
        return new Response(JSON.stringify({
          error: 'We have received many reports today. Please try again tomorrow, or call the Tourist Police on 1155.'
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // Create new report
      const result = await db`
        INSERT INTO scam_reports (
          user_id, scam_type, title, description,
          location_name, province, lat, lng, severity
        ) VALUES (
          ${userId || null}, ${scam_type}, ${title}, ${description},
          ${location_name || null}, ${province}, ${lat || null}, ${lng || null},
          ${severity || 2}
        )
        RETURNING id
      `

      return new Response(JSON.stringify({
        message: 'Report submitted successfully',
        id: result[0]?.id,
        merged: false,
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Safety function error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

