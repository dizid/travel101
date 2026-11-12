/**
 * Clean-up for AI-generated attraction text (attractions.data_source = 'ai_generated').
 *
 * A Nov 12 2026 check of 40 random AI-generated attraction pages found invented phone
 * numbers and contact people ("Contact Ajarn Malee at 032-...") that no source confirms;
 * readers could end up calling strangers. Until the pages are fact-checked, every
 * sentence that contains a phone number is left out of the AI-generated `about` text.
 * Places from Google Places or added by hand are never changed. (T-0552)
 */

// Thai numbers as the generator wrote them: +66 ..., 02-123-4567, 053-292-165, 081-234-5678
const PHONE_PATTERN = /(\+66[\s-]?\d[\d\s-]{6,12}\d|\b0\d{1,2}[\s-]\d{3}[\s-]?\d{3,4}\b|\b0[689]\d[\s-]?\d{3}[\s-]?\d{4}\b)/

/** Removes every sentence that contains a phone number. */
export function stripPhoneSentences(text: string): string {
  return text
    .split('\n')
    .map(line =>
      line
        .split(/(?<=[.!?])\s+/)
        .filter(sentence => !PHONE_PATTERN.test(sentence))
        .join(' ')
    )
    .join('\n')
    .trim()
}

/** Returns the row with phone-number sentences removed from `about` when it is AI-generated. */
export function cleanAiAttraction<T extends { data_source?: string | null; about?: string | null }>(row: T): T {
  if (row.data_source !== 'ai_generated' || !row.about) return row
  return { ...row, about: stripPhoneSentences(row.about) }
}
