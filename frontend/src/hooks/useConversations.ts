import { useCallback, useEffect, useState } from 'react'

import {
  deleteConversation as dbDelete,
  getAllConversations,
  putConversation,
} from '../lib/db'
import { toSummary } from '../lib/conversation'
import type { Conversation, ConversationSummary } from '../types'

/**
 * Gestiona el historial conversacional persistido en IndexedDB:
 * listar, guardar (upsert), eliminar, renombrar y buscar. Mantiene en
 * memoria solo los resúmenes ligeros; el snapshot completo se pide bajo
 * demanda al reabrir una conversación (vía getConversation en lib/db).
 */
export function useConversations() {
  const [summaries, setSummaries] = useState<ConversationSummary[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const all = await getAllConversations()
    setSummaries(all.map(toSummary))
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  /** Inserta o actualiza el snapshot y refresca la lista. */
  const save = useCallback(
    async (conversation: Conversation) => {
      await putConversation(conversation)
      await refresh()
    },
    [refresh],
  )

  const remove = useCallback(
    async (id: string) => {
      await dbDelete(id)
      await refresh()
    },
    [refresh],
  )

  /** Cambia el título de una conversación existente. */
  const rename = useCallback(
    async (conversation: Conversation, title: string) => {
      const next: Conversation = { ...conversation, title, updatedAt: Date.now() }
      await putConversation(next)
      await refresh()
    },
    [refresh],
  )

  return { summaries, loading, refresh, save, remove, rename }
}

/** Filtro de búsqueda por título o diagnóstico (case-insensitive). */
export function filterConversations(
  list: ConversationSummary[],
  query: string,
): ConversationSummary[] {
  const q = query.trim().toLowerCase()
  if (!q) return list
  return list.filter(
    (c) =>
      c.title.toLowerCase().includes(q) ||
      (c.diagnosisLabel?.toLowerCase().includes(q) ?? false),
  )
}
