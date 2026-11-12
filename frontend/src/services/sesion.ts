// Token storage. sessionStorage (not localStorage): the session ends when the tab closes and the
// token is not shared across tabs. Tradeoff: any XSS can still read it; an httpOnly cookie would
// avoid that but requires backend changes (cookies + CSRF protection).
const CLAVE_TOKEN = 'flota.token'

export function obtenerToken(): string | null {
  try {
    return sessionStorage.getItem(CLAVE_TOKEN)
  } catch {
    return null
  }
}

export function guardarToken(token: string): void {
  try {
    sessionStorage.setItem(CLAVE_TOKEN, token)
  } catch {
    // Storage unavailable: the session will simply not survive a reload
  }
}

export function borrarToken(): void {
  try {
    sessionStorage.removeItem(CLAVE_TOKEN)
  } catch {
    // Nothing to clear
  }
}
