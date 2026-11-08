import type { ReactNode } from 'react'

export type MessageRole = 'assistant' | 'user' | 'system' | 'agent'

export type AgentStatus = 'pending' | 'running' | 'completed' | 'error'

export type ChatPhase =
  | 'idle'
  | 'greeting'
  | 'awaiting_data'
  | 'processing'
  | 'result'
  | 'explainability'
  | 'recommendation'
  | 'complete'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string | ReactNode
  timestamp: Date
  metadata?: Record<string, unknown>
}

export interface AgentDescriptor {
  id: string
  name: string
  description: string
  icon: string
  status: AgentStatus
  detail?: string
}

export interface QuickAction {
  label: string
  action: string
  icon?: string
}
