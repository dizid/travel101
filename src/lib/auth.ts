import { createAuthClient } from '@neondatabase/neon-js/auth'

// Create auth client lazily — only when in browser context
// During SSG, this module is imported but auth methods are never called
const authUrl = typeof window !== 'undefined'
  ? import.meta.env.VITE_NEON_AUTH_URL
  : ''

export const authClient = createAuthClient(authUrl)

export const { signIn, signUp, signOut, getSession } = authClient
