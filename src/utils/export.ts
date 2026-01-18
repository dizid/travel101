import type { Itinerary } from '@/composables/useItinerary'

// Format date for .ics file (YYYYMMDD or YYYYMMDDTHHMMSS)
function formatIcsDate(date: Date, includeTime = false): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  const d = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`
  if (!includeTime) return d
  return `${d}T${pad(date.getHours())}${pad(date.getMinutes())}00`
}

// Parse time slot like "09:00" to hours and minutes
function parseTimeSlot(timeSlot: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeSlot.split(':').map(Number)
  return { hours: hours || 9, minutes: minutes || 0 }
}

// Generate .ics calendar file content
export function generateIcsCalendar(itinerary: Itinerary): string {
  const events: string[] = []
  const now = new Date()

  if (!itinerary.days) return ''

  for (const day of itinerary.days) {
    const dayDate = day.date ? new Date(day.date) : new Date(now.getTime() + (day.dayNumber - 1) * 24 * 60 * 60 * 1000)

    for (const activity of day.activities) {
      const { hours, minutes } = parseTimeSlot(activity.timeSlot || '09:00')
      const startTime = new Date(dayDate)
      startTime.setHours(hours, minutes, 0)

      const endTime = new Date(startTime)
      endTime.setMinutes(endTime.getMinutes() + (activity.durationMinutes || 60))

      const event = [
        'BEGIN:VEVENT',
        `DTSTART:${formatIcsDate(startTime, true)}`,
        `DTEND:${formatIcsDate(endTime, true)}`,
        `SUMMARY:${activity.title}`,
        `LOCATION:${day.location}`,
        `DESCRIPTION:${(activity.description || '').replace(/\n/g, '\\n')}${activity.estimatedCostThb ? ` (฿${activity.estimatedCostThb})` : ''}`,
        `UID:${activity.id}@happyroam.travel`,
        'END:VEVENT',
      ].join('\r\n')

      events.push(event)
    }
  }

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HappyRoam Travel//Thailand Trip//EN',
    `X-WR-CALNAME:${itinerary.name}`,
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')
}

// Download the .ics file
export function downloadIcsCalendar(itinerary: Itinerary): void {
  const icsContent = generateIcsCalendar(itinerary)
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${itinerary.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Generate formatted text for copying
export function generateTextItinerary(itinerary: Itinerary): string {
  const lines: string[] = []
  const divider = '─'.repeat(40)

  lines.push(`🌴 ${itinerary.name}`)
  lines.push(divider)

  if (itinerary.startDate && itinerary.endDate) {
    lines.push(`📅 ${itinerary.startDate} → ${itinerary.endDate}`)
  }

  if (itinerary.days) {
    let totalCost = 0

    for (const day of itinerary.days) {
      lines.push('')
      lines.push(`📍 DAY ${day.dayNumber}: ${day.location}`)
      if (day.date) {
        lines.push(`   ${new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`)
      }
      lines.push('')

      for (const activity of day.activities) {
        const time = activity.timeSlot || '  '
        const cost = activity.estimatedCostThb ? ` [฿${activity.estimatedCostThb}]` : ''
        lines.push(`   ${time}  ${activity.title}${cost}`)
        if (activity.description) {
          lines.push(`         ${activity.description}`)
        }
        if (activity.estimatedCostThb) {
          totalCost += activity.estimatedCostThb
        }
      }
    }

    if (totalCost > 0) {
      lines.push('')
      lines.push(divider)
      lines.push(`💰 Estimated Total: ฿${totalCost.toLocaleString()} (~$${Math.round(totalCost / 35)})`)
    }
  }

  lines.push('')
  lines.push('Created with HappyRoam.travel 🌏')

  return lines.join('\n')
}

// Copy to clipboard
export async function copyItineraryToClipboard(itinerary: Itinerary): Promise<boolean> {
  try {
    const text = generateTextItinerary(itinerary)
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

// Print/PDF export (opens print dialog)
export function printItinerary(): void {
  window.print()
}
