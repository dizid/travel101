import { vi } from 'vitest'

/**
 * Mock Anthropic API response
 */
export const mockAnthropicResponse = {
  id: 'msg_mock123',
  type: 'message',
  role: 'assistant',
  content: [{ type: 'text', text: 'Mock AI response' }],
  model: 'claude-sonnet-4-20250514',
  stop_reason: 'end_turn',
  usage: {
    input_tokens: 100,
    output_tokens: 50,
  },
}

/**
 * Mock Anthropic client
 */
export const mockAnthropic = {
  messages: {
    create: vi.fn().mockResolvedValue(mockAnthropicResponse),
  },
}

/**
 * Set custom AI response text
 */
export function setMockAIResponse(text: string): void {
  mockAnthropicResponse.content[0].text = text
  mockAnthropic.messages.create.mockResolvedValue({ ...mockAnthropicResponse })
}

/**
 * Set custom AI response as JSON (for itinerary generation)
 */
export function setMockAIJsonResponse(data: unknown): void {
  const jsonText = JSON.stringify(data, null, 2)
  setMockAIResponse(`\`\`\`json\n${jsonText}\n\`\`\``)
}

/**
 * Make AI throw an error
 */
export function setMockAIError(error: string): void {
  mockAnthropic.messages.create.mockRejectedValue(new Error(error))
}

/**
 * Mock the Anthropic module
 */
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(() => mockAnthropic),
}))

/**
 * Reset all Anthropic mocks
 */
export function resetAnthropicMocks(): void {
  mockAnthropicResponse.content[0].text = 'Mock AI response'
  mockAnthropic.messages.create.mockReset().mockResolvedValue(mockAnthropicResponse)
}

export default {
  mockAnthropic,
  mockAnthropicResponse,
  setMockAIResponse,
  setMockAIJsonResponse,
  setMockAIError,
  resetAnthropicMocks,
}
