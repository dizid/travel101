declare module '@neondatabase/neon-js/auth' {
  export interface AuthClient {
    signIn: (options?: Record<string, unknown>) => Promise<unknown>
    signUp: (options?: Record<string, unknown>) => Promise<unknown>
    signOut: () => Promise<void>
    getSession: () => Promise<{ data: { user: unknown } | null }>
  }

  export function createAuthClient(authUrl: string): AuthClient
}
