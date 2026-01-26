// Standardized API response helpers
// Use these across all Netlify functions for consistent response format

const JSON_HEADERS = { 'Content-Type': 'application/json' }

/**
 * Standard success response
 * Returns: { data: <payload>, success: true }
 */
export function jsonResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify({ data, success: true }), {
    status,
    headers: JSON_HEADERS,
  })
}

/**
 * Standard error response
 * Returns: { error: 'message', code?: 'ERROR_CODE' }
 */
export function errorResponse(message: string, status = 400, code?: string): Response {
  const body: { error: string; code?: string } = { error: message }
  if (code) body.code = code
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  })
}

/**
 * List response with pagination metadata
 * Returns: { data: { items: [], total, hasMore }, success: true }
 */
export function listResponse<T>(items: T[], total: number, hasMore: boolean): Response {
  return jsonResponse({ items, total, hasMore })
}

/**
 * Raw JSON response (for backwards compatibility)
 * Returns the object directly without wrapper
 */
export function rawJsonResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: JSON_HEADERS,
  })
}

// Common error responses
export const methodNotAllowed = () => errorResponse('Method not allowed', 405, 'METHOD_NOT_ALLOWED')
export const unauthorized = () => errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
export const forbidden = () => errorResponse('Forbidden', 403, 'FORBIDDEN')
export const notFound = (resource = 'Resource') => errorResponse(`${resource} not found`, 404, 'NOT_FOUND')
export const badRequest = (message: string) => errorResponse(message, 400, 'BAD_REQUEST')
export const serverError = (message = 'Internal server error') => errorResponse(message, 500, 'SERVER_ERROR')
export const rateLimited = () => errorResponse('Rate limit exceeded', 429, 'RATE_LIMITED')
