// ============================================================
//  Persistencia ligera en localStorage (preferencias de UI y
//  conversación activa). Versionada y a prueba de fallos: si el
//  esquema cambia o el JSON está corrupto, se descarta sin romper
//  la app. NO toca el backend ni sus contratos.
// ============================================================

/** Sube esta versión para invalidar datos persistidos incompatibles. */
export const STORAGE_VERSION = 1

const PREFIX = 'anemia'

export const STORAGE_KEYS = {
  activeConversationId: `${PREFIX}:activeConversationId`,
  uiPrefs: `${PREFIX}:uiPrefs`,
} as const

interface Envelope<T> {
  v: number
  data: T
}

function isBrowserStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage
  } catch {
    return false
  }
}

/** Lee un valor versionado; devuelve `fallback` si falta, corrupto o de otra versión. */
export function loadLocal<T>(key: string, fallback: T): T {
  if (!isBrowserStorageAvailable()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Envelope<T>
    if (!parsed || parsed.v !== STORAGE_VERSION) return fallback
    return parsed.data
  } catch {
    return fallback
  }
}

/** Guarda un valor con sobre versionado. Silencioso ante cuota/errores. */
export function saveLocal<T>(key: string, data: T): void {
  if (!isBrowserStorageAvailable()) return
  try {
    const envelope: Envelope<T> = { v: STORAGE_VERSION, data }
    window.localStorage.setItem(key, JSON.stringify(envelope))
  } catch {
    /* cuota llena o modo privado: se ignora sin romper la UI */
  }
}

export function removeLocal(key: string): void {
  if (!isBrowserStorageAvailable()) return
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* no-op */
  }
}
