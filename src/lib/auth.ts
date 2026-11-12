import { createAuthClient } from '@neondatabase/neon-js/auth'

// Create auth client lazily — only when in browser context
// During SSG, this module is imported but auth methods are never called.
// The browser reaches Neon Auth through our own domain (/neon-auth/*, a proxy
// rewrite in netlify.toml that the Vite dev server serves too; T-0493): called
// directly at VITE_NEON_AUTH_URL, the session cookie was cross-site and Safari
// before 26.2 dropped it, so sign-up and sign-in silently failed there.
const authUrl = typeof window !== 'undefined'
  ? `${window.location.origin}/neon-auth`
  : ''

export const authClient = createAuthClient(authUrl)

export const { signIn, signUp, signOut, getSession } = authClient
