/**
 * Admin session handling.
 *
 * The backend issues a JWT on login (`POST /admin/login`) that expires after
 * one hour. We keep the token in `sessionStorage` so a closed tab ends the
 * session, and decode the `exp` claim locally so the UI can bounce the admin
 * back to the login screen instead of firing doomed requests.
 */

const TOKEN_KEY = 'token'
const AUTH_KEY = 'adminAuth'

export function getToken(): string | null {
  try {
    return window.sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setSession(token: string): void {
  try {
    window.sessionStorage.setItem(TOKEN_KEY, token)
    window.sessionStorage.setItem(AUTH_KEY, 'true')
  } catch {
    /* storage unavailable (private mode) — the in-memory flag still works */
  }
}

export function clearSession(): void {
  try {
    window.sessionStorage.removeItem(TOKEN_KEY)
    window.sessionStorage.removeItem(AUTH_KEY)
  } catch {
    /* noop */
  }
}

/** Decodes the JWT payload without verifying the signature (client-side only). */
function decodePayload(
  token: string,
): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const normalised = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalised.padEnd(
      normalised.length + ((4 - (normalised.length % 4)) % 4),
      '=',
    )
    const json = atob(padded)
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

/** Expiry timestamp in ms, or null when the token has no `exp` claim. */
export function getTokenExpiry(token: string | null = getToken()): number | null {
  if (!token) return null
  const payload = decodePayload(token)
  const exp = payload?.exp
  if (typeof exp !== 'number') return null
  return exp * 1000
}

/**
 * True when a token exists and has not expired. A token without an `exp`
 * claim is treated as valid — the backend remains the source of truth.
 */
export function isSessionValid(): boolean {
  const token = getToken()
  if (!token) return false
  const expiry = getTokenExpiry(token)
  if (expiry === null) return true
  return expiry > Date.now()
}

/** Authorization header for protected requests, or an empty object. */
export function getAuthHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
