// ============================================================
//  Wrapper Promise sobre IndexedDB para el historial conversacional.
//  Almacena snapshots completos de conversaciones (mensajes, caso,
//  reporte, agentes). Es 100% del lado del cliente: NO interactúa con
//  el backend FastAPI ni con su base de datos PostgreSQL.
//
//  Degradación: si IndexedDB no está disponible (modo privado, navegador
//  antiguo), cada operación resuelve a un valor neutro y la app sigue
//  funcionando sin historial persistente.
// ============================================================
import type { Conversation } from '../types'

const DB_NAME = 'anemia-conversations'
const DB_VERSION = 1
const STORE = 'conversations'

let dbPromise: Promise<IDBDatabase | null> | null = null

function openDB(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null)
      return
    }
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id' })
          store.createIndex('updatedAt', 'updatedAt', { unique: false })
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })

  return dbPromise
}

function tx(
  db: IDBDatabase,
  mode: IDBTransactionMode,
): IDBObjectStore {
  return db.transaction(STORE, mode).objectStore(STORE)
}

function promisifyRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** Devuelve todas las conversaciones ordenadas por `updatedAt` desc. */
export async function getAllConversations(): Promise<Conversation[]> {
  const db = await openDB()
  if (!db) return []
  try {
    const all = await promisifyRequest(tx(db, 'readonly').getAll())
    return (all as Conversation[]).sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

/** Recupera una conversación por id, o `null` si no existe. */
export async function getConversation(id: string): Promise<Conversation | null> {
  const db = await openDB()
  if (!db) return null
  try {
    const result = await promisifyRequest(tx(db, 'readonly').get(id))
    return (result as Conversation) ?? null
  } catch {
    return null
  }
}

/** Inserta o actualiza una conversación (upsert por id). */
export async function putConversation(conversation: Conversation): Promise<void> {
  const db = await openDB()
  if (!db) return
  try {
    await promisifyRequest(tx(db, 'readwrite').put(conversation))
  } catch {
    /* no-op: el historial es best-effort */
  }
}

/** Elimina una conversación por id. */
export async function deleteConversation(id: string): Promise<void> {
  const db = await openDB()
  if (!db) return
  try {
    await promisifyRequest(tx(db, 'readwrite').delete(id))
  } catch {
    /* no-op */
  }
}

/** Borra todo el historial (usado por «vaciar historial»). */
export async function clearConversations(): Promise<void> {
  const db = await openDB()
  if (!db) return
  try {
    await promisifyRequest(tx(db, 'readwrite').clear())
  } catch {
    /* no-op */
  }
}
