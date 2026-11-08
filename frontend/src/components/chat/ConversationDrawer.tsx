import { motion } from 'framer-motion'
import { Check, MessageSquarePlus, Pencil, Search, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useConversations, filterConversations } from '../../hooks/useConversations'
import { getConversation } from '../../lib/db'
import type { ConversationStatus } from '../../types'
import ConfirmDialog from '../ui/ConfirmDialog'
import Drawer from '../ui/Drawer'

interface Props {
  open: boolean
  onClose: () => void
  activeId: string
  onSelect: (id: string) => void
  onNew: () => void
}

const statusStyle: Record<ConversationStatus, { dot: string; label: string }> = {
  draft: { dot: 'bg-slate-300', label: 'Borrador' },
  processing: { dot: 'bg-amber-400', label: 'Procesando' },
  completed: { dot: 'bg-emerald-500', label: 'Completado' },
  error: { dot: 'bg-red-500', label: 'Con errores' },
}

function relativeDate(ts: number): string {
  return new Date(ts).toLocaleString('es-PE', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default function ConversationDrawer({ open, onClose, activeId, onSelect, onNew }: Props) {
  const { summaries, refresh, remove, rename } = useConversations()
  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  // Refrescar la lista cada vez que se abre el drawer.
  useEffect(() => {
    if (open) void refresh()
  }, [open, refresh])

  const filtered = useMemo(() => filterConversations(summaries, query), [summaries, query])

  const startEdit = (id: string, current: string) => {
    setEditingId(id)
    setEditValue(current)
  }

  const commitEdit = async (id: string) => {
    const conv = await getConversation(id)
    if (conv) await rename(conv, editValue.trim() || conv.title)
    setEditingId(null)
  }

  const confirmDelete = async () => {
    if (pendingDelete) await remove(pendingDelete)
    setPendingDelete(null)
  }

  return (
    <Drawer open={open} onClose={onClose} side="left" title="Historial de consultas" widthClass="w-[88%] max-w-sm">
      <div className="flex h-full flex-col">
        <div className="space-y-2 border-b border-slate-100 p-3">
          <button
            onClick={() => { onNew(); onClose() }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            <MessageSquarePlus size={15} /> Nueva consulta
          </button>
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o diagnóstico…"
              aria-label="Buscar conversaciones"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-700 placeholder-slate-400 focus:border-teal-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-xs text-slate-400">
              {query ? 'Sin resultados para tu búsqueda.' : 'Aún no hay consultas guardadas.'}
            </p>
          ) : (
            <ul className="space-y-1" role="list">
              {filtered.map((c) => {
                const st = statusStyle[c.status]
                const isActive = c.id === activeId
                const isEditing = c.id === editingId
                return (
                  <motion.li
                    key={c.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`group rounded-xl border px-3 py-2.5 transition ${
                      isActive ? 'border-teal-300 bg-teal-50' : 'border-transparent hover:bg-slate-50'
                    }`}
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') void commitEdit(c.id) }}
                          aria-label="Nuevo nombre de la conversación"
                          className="flex-1 rounded-lg border border-teal-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-teal-100"
                        />
                        <button onClick={() => void commitEdit(c.id)} aria-label="Guardar nombre" className="text-emerald-600 hover:text-emerald-700">
                          <Check size={15} />
                        </button>
                        <button onClick={() => setEditingId(null)} aria-label="Cancelar" className="text-slate-400 hover:text-slate-600">
                          <X size={15} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <button
                          onClick={() => { onSelect(c.id); onClose() }}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="truncate text-xs font-semibold text-slate-700">{c.title}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="flex items-center gap-1 text-[10px] text-slate-400">
                              <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} /> {st.label}
                            </span>
                            <span className="text-[10px] text-slate-400">· {relativeDate(c.updatedAt)}</span>
                          </div>
                          {c.diagnosisLabel && (
                            <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                              {c.diagnosisLabel}
                            </span>
                          )}
                        </button>
                        <div className="flex flex-shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                          <button onClick={() => startEdit(c.id, c.title)} aria-label="Renombrar" className="text-slate-400 hover:text-teal-600">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => setPendingDelete(c.id)} aria-label="Eliminar" className="text-slate-400 hover:text-red-600">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Eliminar conversación"
        message="Esta acción no se puede deshacer. Se eliminará el historial de esta consulta de este navegador."
        confirmLabel="Eliminar"
        tone="danger"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </Drawer>
  )
}
