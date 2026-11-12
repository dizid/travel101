/**
 * Server-side limits on what the browser sends along with an AI request (T-0560/T-0569).
 * Everything here reaches a paid Anthropic prompt, so its size must not depend on the caller.
 */

export const MAX_HISTORY_MESSAGES = 10
export const MAX_HISTORY_MESSAGE_CHARS = 4000
const MAX_PROFILE_TEXT = 60
const MAX_PROFILE_LIST = 8

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

/** Last MAX_HISTORY_MESSAGES user/assistant turns, each cut to MAX_HISTORY_MESSAGE_CHARS. */
export function sanitizeHistory(history: unknown): ChatTurn[] {
  if (!Array.isArray(history)) return []
  return history
    .filter((msg): msg is ChatTurn =>
      !!msg && (msg.role === 'user' || msg.role === 'assistant') && typeof msg.content === 'string')
    .slice(-MAX_HISTORY_MESSAGES)
    .map(msg => ({ role: msg.role, content: msg.content.slice(0, MAX_HISTORY_MESSAGE_CHARS) }))
}

/** A string cut to a short length; anything else becomes ''. */
export function shortText(value: unknown, max = MAX_PROFILE_TEXT): string {
  return typeof value === 'string' ? value.slice(0, max) : ''
}

/** Up to MAX_PROFILE_LIST short strings joined with ', '; anything else becomes ''. */
export function shortList(value: unknown): string {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
        .slice(0, MAX_PROFILE_LIST).map(item => item.slice(0, MAX_PROFILE_TEXT)).join(', ')
    : ''
}
