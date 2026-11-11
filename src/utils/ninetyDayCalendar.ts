// Calendar file (.ics) for the next Thailand 90-day report.
// Two all-day events: the day the reporting window opens and the due date itself.
// Dates are plain YYYY-MM-DD strings (no time zone), as stored by useVisaCountdown.

const IMMIGRATION_90_DAY_PAGE = 'https://www.immigration.go.th/?page_id=1666'
const ONLINE_REPORT_SITE = 'https://tm47.immigration.go.th'

// 'YYYY-MM-DD' -> 'YYYYMMDD'
function toIcsDate(isoDate: string): string {
  return isoDate.replace(/-/g, '')
}

// 'YYYY-MM-DD' + 1 day, computed in UTC so the local time zone can't shift the date
function nextDay(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10)
}

function allDayEvent(uid: string, isoDate: string, summary: string, description: string, stamp: string): string {
  return [
    'BEGIN:VEVENT',
    `UID:${uid}@happyroam.travel`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${toIcsDate(isoDate)}`,
    `DTEND;VALUE=DATE:${toIcsDate(nextDay(isoDate))}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
  ].join('\r\n')
}

export function buildNinetyDayIcs(window: { opens: string; due: string; closes: string }, now = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const details =
    `Report window: ${window.opens} to ${window.closes}. ` +
    `Online: ${ONLINE_REPORT_SITE} (not after a passport change). ` +
    `Rules: ${IMMIGRATION_90_DAY_PAGE}. The date on your last receipt is the official one.`

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HappyRoam Travel//90-day report//EN',
    'CALSCALE:GREGORIAN',
    allDayEvent(`90day-open-${window.due}`, window.opens, 'Thailand 90-day report: window opens', details, stamp),
    allDayEvent(`90day-due-${window.due}`, window.due, 'Thailand 90-day report due', details, stamp),
    'END:VCALENDAR',
  ].join('\r\n')
}

// Starts a download of the .ics file in the browser
export function downloadNinetyDayIcs(window: { opens: string; due: string; closes: string }): void {
  const blob = new Blob([buildNinetyDayIcs(window)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `thailand-90-day-report-${window.due}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
