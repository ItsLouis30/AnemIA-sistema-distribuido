// ============================================================
//  Helpers puros para conversaciones: ids, títulos automáticos y
//  (de)serialización entre ChatMessage (runtime) y StoredMessage
//  (persistencia). Sin efectos secundarios ni dependencias del DOM.
// ============================================================
import type {
  ChatMessage,
  Conversation,
  ConversationSummary,
  StoredMessage,
} from '../types'

export function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/** "Caso Juliaca · 15 jun 2026" — nombre automático legible. */
export function autoTitle(distrito: string | undefined, createdAt: number): string {
  const lugar = distrito && distrito.trim() ? capitalize(distrito) : 'Sin distrito'
  const fecha = new Date(createdAt).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  return `Caso ${lugar} · ${fecha}`
}

function capitalize(s: string): string {
  const lower = s.toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

/** Convierte mensajes de runtime a forma serializable (descarta ReactNode). */
export function serializeMessages(messages: ChatMessage[]): StoredMessage[] {
  return messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: typeof m.content === 'string' ? m.content : '',
    timestamp: m.timestamp instanceof Date ? m.timestamp.getTime() : Date.now(),
  }))
}

/** Reconstituye mensajes de runtime a partir de los persistidos. */
export function deserializeMessages(stored: StoredMessage[]): ChatMessage[] {
  return stored.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    timestamp: new Date(m.timestamp),
  }))
}

export function toSummary(c: Conversation): ConversationSummary {
  return {
    id: c.id,
    title: c.title,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    status: c.status,
    diagnosisLabel: c.report?.prediction?.diagnosis_label,
  }
}
