import type { Context, Config } from '@netlify/functions'
import { getDb } from './lib/db.mts'
import { optionalAuth } from './lib/auth.mts'

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

      // Build query based on filters
      let scamReports: ScamReport[]
      if (province && scamType) {
        scamReports = await db`
          SELECT * FROM scam_reports
          WHERE province = ${province} AND scam_type = ${scamType}
          ORDER BY severity DESC, verified DESC, last_reported_at DESC
          LIMIT ${limit}
        `
      } else if (province) {
        scamReports = await db`
          SELECT * FROM scam_reports
          WHERE province = ${province}
          ORDER BY severity DESC, verified DESC, last_reported_at DESC
          LIMIT ${limit}
        `
      } else if (scamType) {
        scamReports = await db`
          SELECT * FROM scam_reports
          WHERE scam_type = ${scamType}
          ORDER BY severity DESC, verified DESC, last_reported_at DESC
          LIMIT ${limit}
        `
      } else {
        scamReports = await db`
          SELECT * FROM scam_reports
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
      const stats = await db`
        SELECT
          COUNT(*) as total_reports,
          COUNT(*) FILTER (WHERE verified = true) as verified_reports,
          COUNT(DISTINCT province) as provinces_covered
        FROM scam_reports
      `

      return new Response(JSON.stringify({
        scamReports,
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
      const body: NewScamReport = await req.json()
      const { scam_type, title, description, location_name, province, lat, lng, severity } = body

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
        // Increment report count for existing report
        const updated = await db`
          UPDATE scam_reports
          SET report_count = report_count + 1,
              last_reported_at = NOW(),
              updated_at = NOW()
          WHERE id = ${existing[0].id}
          RETURNING *
        `
        return new Response(JSON.stringify({
          message: 'Report added to existing entry',
          report: updated[0],
          merged: true,
        }), {
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
        RETURNING *
      `

      return new Response(JSON.stringify({
        message: 'Report submitted successfully',
        report: result[0],
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

