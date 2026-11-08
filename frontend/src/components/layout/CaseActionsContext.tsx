import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Puente entre las acciones del caso clínico (que viven en la página de Chat vía
 * `useChat`) y la barra lateral global (renderizada por el AppShell, fuera de
 * Chat). La página de Chat registra sus handlers y su estado; la barra lateral
 * los invoca. Si la acción se dispara fuera de /chat, se navega a /chat y la
 * acción queda pendiente hasta que Chat vuelve a registrarse.
 *
 * Es solo cableado de UI: no toca `useChat`, ni el backend, ni los payloads.
 */
export type CaseActionKey = 'example' | 'new' | 'analyze' | 'agents' | 'pdf' | 'history'

export type CaseHandlers = Record<CaseActionKey, () => void>

export interface CaseStatus {
  loading: boolean
  hasReport: boolean
  agentsDone: number
  agentsTotal: number
  running: boolean
  pdfGenerating: boolean
}

const DEFAULT_STATUS: CaseStatus = {
  loading: false,
  hasReport: false,
  agentsDone: 0,
  agentsTotal: 6,
  running: false,
  pdfGenerating: false,
}

interface CaseActionsState {
  status: CaseStatus
  available: boolean
  /** Id de la conversación activa, publicado por la página de Chat para que la
   *  barra lateral pueda resaltar la consulta abierta en la lista de recientes. */
  activeConversationId: string
  invoke: (key: CaseActionKey) => void
  /** Abre una conversación existente del historial (lista de recientes). Si Chat
   *  no está montado, navega a /chat y la apertura queda pendiente. */
  selectConversation: (id: string) => void
  registerHandlers: (handlers: CaseHandlers | null) => void
  /** La página de Chat registra su `loadConversation` para la lista de recientes. */
  registerSelect: (fn: ((id: string) => void) | null) => void
  setActiveConversationId: (id: string) => void
  setStatus: (status: CaseStatus) => void
}

const CaseActionsContext = createContext<CaseActionsState>({
  status: DEFAULT_STATUS,
  available: false,
  activeConversationId: '',
  invoke: () => {},
  selectConversation: () => {},
  registerHandlers: () => {},
  registerSelect: () => {},
  setActiveConversationId: () => {},
  setStatus: () => {},
})

export function useCaseActions(): CaseActionsState {
  return useContext(CaseActionsContext)
}

function sameStatus(a: CaseStatus, b: CaseStatus): boolean {
  return (
    a.loading === b.loading &&
    a.hasReport === b.hasReport &&
    a.agentsDone === b.agentsDone &&
    a.agentsTotal === b.agentsTotal &&
    a.running === b.running &&
    a.pdfGenerating === b.pdfGenerating
  )
}

export function CaseActionsProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const handlersRef = useRef<CaseHandlers | null>(null)
  const pendingRef = useRef<CaseActionKey | null>(null)
  const selectRef = useRef<((id: string) => void) | null>(null)
  const pendingSelectRef = useRef<string | null>(null)
  const [available, setAvailable] = useState(false)
  const [status, setStatusState] = useState<CaseStatus>(DEFAULT_STATUS)
  const [activeConversationId, setActiveConversationIdState] = useState('')

  const registerHandlers = useCallback((handlers: CaseHandlers | null) => {
    handlersRef.current = handlers
    setAvailable(!!handlers)
    if (handlers && pendingRef.current) {
      const key = pendingRef.current
      pendingRef.current = null
      handlers[key]?.()
    }
  }, [])

  const registerSelect = useCallback((fn: ((id: string) => void) | null) => {
    selectRef.current = fn
    if (fn && pendingSelectRef.current) {
      const id = pendingSelectRef.current
      pendingSelectRef.current = null
      fn(id)
    }
  }, [])

  const setActiveConversationId = useCallback((id: string) => {
    setActiveConversationIdState((prev) => (prev === id ? prev : id))
  }, [])

  const setStatus = useCallback((next: CaseStatus) => {
    setStatusState((prev) => (sameStatus(prev, next) ? prev : next))
  }, [])

  const invoke = useCallback(
    (key: CaseActionKey) => {
      const handlers = handlersRef.current
      if (handlers) {
        handlers[key]?.()
      } else {
        pendingRef.current = key
        navigate('/chat')
      }
    },
    [navigate],
  )

  const selectConversation = useCallback(
    (id: string) => {
      const fn = selectRef.current
      if (fn) {
        fn(id)
      } else {
        pendingSelectRef.current = id
        navigate('/chat')
      }
    },
    [navigate],
  )

  return (
    <CaseActionsContext.Provider
      value={{
        status,
        available,
        activeConversationId,
        invoke,
        selectConversation,
        registerHandlers,
        registerSelect,
        setActiveConversationId,
        setStatus,
      }}
    >
      {children}
    </CaseActionsContext.Provider>
  )
}
