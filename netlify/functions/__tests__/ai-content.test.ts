import { describe, it, expect } from 'vitest'
import { stripPhoneSentences, cleanAiAttraction } from '../lib/ai-content.mts'

describe('AI-generated attraction text clean-up (T-0552)', () => {
  it('drops sentences with a phone number and keeps the rest', () => {
    const text = 'Stay in teak houses over the water. Contact Ajarn Malee at 032-425-017 to book. Best from November to February.'
    expect(stripPhoneSentences(text)).toBe('Stay in teak houses over the water. Best from November to February.')
  })

  it('catches Bangkok, provincial, mobile and +66 formats', () => {
    for (const n of ['02-249-6294', '053-292-165', '081-234-5678', '+66 89 765 4321']) {
      expect(stripPhoneSentences(`Call ${n} first.`)).toBe('')
    }
  })

  it('leaves prices, years and distances alone', () => {
    const text = 'Workshops cost 300 baht. Built in 1828. About 2 km from the pier.'
    expect(stripPhoneSentences(text)).toBe(text)
  })

  it('only changes AI-generated places', () => {
    const about = 'Book at 02-249-6294. Open daily.'
    expect(cleanAiAttraction({ data_source: 'google_places', about }).about).toBe(about)
    expect(cleanAiAttraction({ data_source: 'ai_generated', about }).about).toBe('Open daily.')
    expect(cleanAiAttraction({ data_source: 'ai_generated', about: null }).about).toBeNull()
  })
})
