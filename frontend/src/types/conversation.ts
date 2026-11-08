import type { AgentRunReport } from './agent'
import type { AgentDescriptor, ChatPhase, MessageRole } from './chat'
import type { ClinicalFormData } from './clinical'
import type { ModelName } from './prediction'

export type ConversationStatus = 'draft' | 'processing' | 'completed' | 'error'

/**
 * Mensaje en forma serializable para persistencia: `content` siempre es
 * string (nunca ReactNode) y `timestamp` se guarda como epoch en ms.
 */
export interface StoredMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: number
}

/** Snapshot completo de una conversación, persistido en IndexedDB. */
export interface Conversation {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  status: ConversationStatus
  messages: StoredMessage[]
  formData: ClinicalFormData
  report: AgentRunReport | null
  agents: AgentDescriptor[]
  phase: ChatPhase
  model: ModelName
}

/** Resumen ligero para listar conversaciones sin cargar todo el snapshot. */
export interface ConversationSummary {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  status: ConversationStatus
  diagnosisLabel?: string
}
