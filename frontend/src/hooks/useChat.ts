import { useCallback, useEffect, useRef, useState } from 'react'

import { getConversation, putConversation } from '../lib/db'
import {
  autoTitle,
  deserializeMessages,
  generateConversationId,
  serializeMessages,
} from '../lib/conversation'
import { loadLocal, saveLocal, STORAGE_KEYS } from '../lib/storage'
import type {
  AgentDescriptor,
  AgentRunReport,
  ChatMessage,
  ChatPhase,
  ClinicalFormData,
  Conversation,
  ConversationStatus,
  ModelName,
} from '../types'
import { defaultClinicalForm, ejemploJuliaca } from '../types'
import { runAgents, sendChatMessage } from '../services/api'

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    '👋 ¡Hola! Soy AnemIA.\n\nSoy tu asistente clínico conversacional para el diagnóstico de anemia infantil en la región de Puno, Perú.\n\nUtilizo un sistema de 6 agentes especializados que procesan tus datos clínicos para:\n• Calcular hemoglobina corregida por altitud\n• Estimar diagnóstico con modelo ML\n• Explicar factores influyentes con XAI\n• Proponer recomendaciones referenciales MINSA',
  timestamp: new Date(),
}

const DATA_REQUEST_MESSAGE: ChatMessage = {
  id: 'data_request',
  role: 'assistant',
  content:
    'Por favor, registra los datos del paciente en el formulario clínico. También puedes cargar el caso de ejemplo de Juliaca para una demostración completa.',
  timestamp: new Date(),
}

const DEFAULT_AGENTS: AgentDescriptor[] = [
  { id: 'data_agent', name: 'Registro', description: 'Clínico', icon: 'ClipboardList', status: 'pending', detail: 'Esperando datos...' },
  { id: 'preprocessing_agent', name: 'Contextual', description: 'Altitud / Hbc', icon: 'Mountain', status: 'pending', detail: 'Esperando datos...' },
  { id: 'prediction_agent', name: 'Predictivo', description: 'ML · Diagnóstico', icon: 'Brain', status: 'pending', detail: 'Esperando datos...' },
  { id: 'explainability_agent', name: 'Explicabilidad', description: 'XAI · SHAP', icon: 'Lightbulb', status: 'pending', detail: 'Esperando datos...' },
  { id: 'recommendation_agent', name: 'Terapéutico', description: 'Recomendación', icon: 'Pill', status: 'pending', detail: 'Esperando datos...' },
  { id: 'monitoring_agent', name: 'Coordinador', description: 'Reporte PDF', icon: 'Cpu', status: 'pending', detail: 'Esperando datos...' },
]

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

const AGENT_ORDER = DEFAULT_AGENTS.map(a => a.id)

const AGENT_FRIENDLY: Record<string, { number: number; pastMessage: string }> = {
  data_agent: { number: 1, pastMessage: '✅ Datos del paciente validados correctamente.' },
  preprocessing_agent: { number: 2, pastMessage: '✅ Hemoglobina corregida por altitud calculada.' },
  prediction_agent: { number: 3, pastMessage: '✅ Modelo ML ejecutado. Diagnóstico estimado.' },
  explainability_agent: { number: 4, pastMessage: '✅ Explicación SHAP/LIME generada.' },
  recommendation_agent: { number: 5, pastMessage: '✅ Recomendación referencial preparada.' },
  monitoring_agent: { number: 6, pastMessage: '✅ Reporte multiagente consolidado.' },
}

const SCROLL_DELAY_MS = 600
const SAVE_DEBOUNCE_MS = 400

function freshAgents(): AgentDescriptor[] {
  return DEFAULT_AGENTS.map(a => ({ ...a, status: 'pending', detail: a.detail }))
}

function deriveStatus(phase: ChatPhase, report: AgentRunReport | null, error: string | null): ConversationStatus {
  if (error) return 'error'
  if (report?.ok) return 'completed'
  if (phase === 'processing') return 'processing'
  return 'draft'
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE, DATA_REQUEST_MESSAGE])
  const [phase, setPhase] = useState<ChatPhase>('awaiting_data')
  const [formData, setFormData] = useState<ClinicalFormData>(defaultClinicalForm)
  const [agents, setAgents] = useState<AgentDescriptor[]>(DEFAULT_AGENTS)
  const [report, setReport] = useState<AgentRunReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [showForm, setShowForm] = useState(true)
  const [showTyping, setShowTyping] = useState(false)
  const [agentStep, setAgentStep] = useState(-1)
  // Ancla del turno al que pertenecen los resultados/cards del análisis: el id
  // del mensaje tras el cual deben renderizarse las tarjetas de resultado. Así
  // los resultados quedan asociados a su turno y no «pegados» al fondo del chat.
  const [resultAnchorId, setResultAnchorId] = useState<string | null>(null)

  // Identidad de la conversación activa (persistida en localStorage).
  const [conversationId, setConversationId] = useState<string>(() =>
    loadLocal<string>(STORAGE_KEYS.activeConversationId, '') || generateConversationId(),
  )
  const [title, setTitle] = useState<string>('Nueva consulta')

  const createdAtRef = useRef<number>(Date.now())
  const hydratedRef = useRef(false)
  const skipNextSaveRef = useRef(false)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ---- Hidratación al montar: restaura la conversación activa ----
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const conv = conversationId ? await getConversation(conversationId) : null
      if (!cancelled && conv) {
        skipNextSaveRef.current = true
        const restored = deserializeMessages(conv.messages)
        setMessages(restored)
        setFormData(conv.formData)
        setReport(conv.report)
        setAgents(conv.agents?.length ? conv.agents : freshAgents())
        setPhase(conv.phase)
        setTitle(conv.title)
        // Reancla los resultados al último mensaje de la conversación cargada.
        setResultAnchorId(conv.report?.ok && restored.length ? restored[restored.length - 1].id : null)
        createdAtRef.current = conv.createdAt
      }
      saveLocal(STORAGE_KEYS.activeConversationId, conversationId)
      hydratedRef.current = true
    })()
    return () => { cancelled = true }
    // Solo al montar; loadConversation gestiona cambios posteriores.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- Persistencia (debounce) de la conversación activa en IndexedDB ----
  useEffect(() => {
    if (!hydratedRef.current) return
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false
      return
    }
    const computedTitle =
      title && title !== 'Nueva consulta'
        ? title
        : autoTitle(formData.DistritoREN, createdAtRef.current)

    const snapshot: Conversation = {
      id: conversationId,
      title: computedTitle,
      createdAt: createdAtRef.current,
      updatedAt: Date.now(),
      status: deriveStatus(phase, report, error),
      messages: serializeMessages(messages),
      formData,
      report,
      agents,
      phase,
      model: formData.Modelo === 'xgboost' ? 'xgboost' : 'random_forest',
    }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      void putConversation(snapshot)
    }, SAVE_DEBOUNCE_MS)

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [messages, formData, report, agents, phase, error, conversationId, title])

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const message: ChatMessage = {
      ...msg,
      id: generateId(),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, message])
    return message
  }, [])

  const scrollToBottom = useCallback(() => {
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
    scrollTimerRef.current = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('chat:scroll'))
    }, SCROLL_DELAY_MS)
  }, [])

  const runAgentAnimation = useCallback(async (agentId: string, elapsedMs: number, statusMessage: string) => {
    setAgents(prev => prev.map(a =>
      a.id === agentId ? { ...a, status: 'running', detail: 'Procesando...' } : a
    ))

    const delay = Math.max(400, Math.min(elapsedMs, 1500))
    await new Promise(resolve => setTimeout(resolve, delay))

    const info = AGENT_FRIENDLY[agentId]
    const isError = statusMessage.toLowerCase().includes('error')
    setAgents(prev => prev.map(a =>
      a.id === agentId
        ? { ...a, status: isError ? 'error' : 'completed', detail: statusMessage }
        : a
    ))

    if (info && !isError) {
      addMessage({ role: 'agent', content: `Agente ${info.number} · ${info.pastMessage}` })
      scrollToBottom()
    }
  }, [addMessage, scrollToBottom])

  const submitForm = useCallback(async (data: ClinicalFormData) => {
    setLoading(true)
    setShowForm(false)
    setError(null)
    setPhase('processing')
    setAgents(freshAgents())
    // Un análisis nuevo limpia los resultados/cards del análisis anterior del
    // mismo hilo para que no queden renderizados fuera de contexto.
    setReport(null)
    setResultAnchorId(null)

    const model: ModelName = data.Modelo === 'xgboost' ? 'xgboost' : 'random_forest'
    const clinicalCase = {
      Prov_EESS: data.Prov_EESS,
      Dist_EESS: data.Dist_EESS,
      Sexo: data.Sexo,
      EdadMeses: data.EdadMeses,
      Juntos: data.Juntos,
      SIS: data.SIS,
      Qaliwarma: data.Qaliwarma,
      Cred: data.Cred,
      Suplementacion: data.Suplementacion,
      Consejeria: data.Consejeria,
      Sesion: data.Sesion,
      Hemoglobina: data.Hemoglobina,
      ProvinciaREN: data.ProvinciaREN,
      DistritoREN: data.DistritoREN,
      AlturaREN: data.AlturaREN,
    }

    const sexoStr = data.Sexo === 'F' ? 'Niña' : 'Niño'
    addMessage({
      role: 'user',
      content: `Registrando paciente:\n${sexoStr}, ${data.EdadMeses} meses\nHb: ${data.Hemoglobina} g/dL · Altitud: ${data.AlturaREN} m.s.n.m.\nModelo: ${model === 'xgboost' ? 'XGBoost' : 'Random Forest'}`,
    })
    scrollToBottom()

    const processingMsg = addMessage({ role: 'assistant', content: 'Estoy procesando el caso clínico con el sistema multiagente...' })

    try {
      const result: AgentRunReport = await runAgents(clinicalCase, model)

      setMessages(prev => prev.filter(m => m.id !== processingMsg.id))

      for (const agentId of AGENT_ORDER) {
        const logEntry = result.agent_logs?.find(l => l.agent === agentId)
        const elapsed = logEntry?.elapsed_ms ?? 500
        const message = logEntry?.message ?? 'Procesado'
        await runAgentAnimation(agentId, elapsed, message)
      }

      if (result.ok) {
        setReport(result)
        setPhase('result')
        // Título definitivo basado en el distrito del caso.
        setTitle(autoTitle(data.DistritoREN, createdAtRef.current))

        addMessage({ role: 'system', content: '✅ El sistema multiagente ha completado el análisis del caso clínico.' })

        if (result.prediction) {
          addMessage({
            role: 'assistant',
            content: `📊 **Resultado del análisis**\n\n**Diagnóstico probable:** ${result.prediction.diagnosis_label}\n**Modelo utilizado:** ${result.prediction.model}\n**Confianza estimada:** ${result.prediction.probability}%\n**Hemoglobina corregida:** ${result.preprocessing?.hbc ?? '—'} g/dL`,
          })
        }

        if (result.explainability) {
          setPhase('explainability')
          const topFactor = result.explainability.top_factor || 'Hemoglobina corregida por altitud'
          addMessage({
            role: 'assistant',
            content: `🔍 **Factores que más influyeron en la predicción**\n\nFactor principal: ${topFactor}.\nRevisa el panel de resultados para el desglose SHAP/LIME completo.`,
          })
        }

        if (result.recommendation) {
          setPhase('recommendation')
          addMessage({
            role: 'assistant',
            content: `💊 **Recomendación referencial**\n\n${result.recommendation.title}. Sigue los lineamientos MINSA según severidad y confirma con evaluación médica.`,
          })
        }

        setPhase('complete')
        const closingMsg = addMessage({
          role: 'assistant',
          content: '✅ El caso fue procesado correctamente por el sistema multiagente.\n\nPuedes:\n• Hacer una **nueva consulta**\n• Revisar el **panel** de resultados\n• Consultar el **historial** de casos',
        })
        // Las tarjetas de resultado de este turno se renderizan tras este mensaje.
        setResultAnchorId(closingMsg.id)
      } else {
        setError(result.error || 'El pipeline finalizó con errores.')
        addMessage({
          role: 'system',
          content: '⚠ El sistema encontró errores al procesar el caso. Verifica los datos e intenta nuevamente.',
        })
        setShowForm(true)
      }
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.message || 'Error de conexión con el backend.'
      addMessage({
        role: 'system',
        content: `⚠ Error: ${detail}`,
      })
      setError(`Error de conexión con el backend: ${detail}`)
      setShowForm(true)
    } finally {
      setLoading(false)
    }
  }, [addMessage, runAgentAnimation, scrollToBottom])

  const loadExampleCase = useCallback(() => {
    setFormData({ ...ejemploJuliaca })
    setShowForm(true)
    addMessage({
      role: 'system',
      content: '✅ Caso de ejemplo (Juliaca) cargado. Puedes revisar los datos en el formulario y enviarlos al sistema multiagente.',
    })
    setPhase('awaiting_data')
    scrollToBottom()
  }, [addMessage, scrollToBottom])

  /** Reinicia el estado y abre una conversación nueva (sin confirmación). */
  const startNewConversation = useCallback(() => {
    const id = generateConversationId()
    createdAtRef.current = Date.now()
    skipNextSaveRef.current = false
    setConversationId(id)
    saveLocal(STORAGE_KEYS.activeConversationId, id)
    setMessages([WELCOME_MESSAGE, DATA_REQUEST_MESSAGE])
    setFormData(defaultClinicalForm)
    setReport(null)
    setResultAnchorId(null)
    setError(null)
    setPhase('awaiting_data')
    setShowForm(true)
    setAgents(freshAgents())
    setAgentStep(-1)
    setInputValue('')
    setTitle('Nueva consulta')
  }, [])

  // Alias retrocompatible (la confirmación se gestiona en la página de chat).
  const newConsultation = startNewConversation

  /** Carga una conversación existente del historial y la hace activa. */
  const loadConversation = useCallback(async (id: string) => {
    const conv = await getConversation(id)
    if (!conv) return
    skipNextSaveRef.current = true
    setConversationId(id)
    saveLocal(STORAGE_KEYS.activeConversationId, id)
    createdAtRef.current = conv.createdAt
    const restored = deserializeMessages(conv.messages)
    setMessages(restored)
    setFormData(conv.formData)
    setReport(conv.report)
    // Reancla los resultados de la consulta cargada a su último mensaje.
    setResultAnchorId(conv.report?.ok && restored.length ? restored[restored.length - 1].id : null)
    setAgents(conv.agents?.length ? conv.agents : freshAgents())
    setPhase(conv.phase)
    setTitle(conv.title)
    setError(null)
    setShowForm(conv.phase === 'awaiting_data' || conv.phase === 'idle')
    setInputValue('')
  }, [])

  /** Renombra la conversación activa. */
  const renameActive = useCallback((newTitle: string) => {
    const t = newTitle.trim()
    if (t) setTitle(t)
  }, [])

  const handleSendMessage = useCallback(async () => {
    const text = inputValue.trim()

    if (!text || loading) return

    addMessage({
      role: 'user',
      content: text,
    })

    setInputValue('')
    setShowTyping(true)

    try {

      const lower = text.toLowerCase()

      if (
        lower.includes('ejemplo') ||
        lower.includes('juliaca')
      ) {

        setShowTyping(false)
        loadExampleCase()
        scrollToBottom()
        return
      }

      if (
        lower.includes('nuevo') ||
        lower.includes('nueva consulta')
      ) {

        setShowTyping(false)
        startNewConversation()
        scrollToBottom()
        return
      }

      const response = await sendChatMessage(text)

      setShowTyping(false)

      addMessage({
        role: 'assistant',
        content:
          response.response ||
          'No pude generar una respuesta.',
      })

      scrollToBottom()

    } catch (err: any) {

      setShowTyping(false)

      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        'Error al comunicarse con Gemini.'

      addMessage({
        role: 'system',
        content: `⚠ ${detail}`,
      })

      scrollToBottom()
    }

  }, [
    inputValue,
    loading,
    addMessage,
    loadExampleCase,
    startNewConversation,
    scrollToBottom,
  ])

  return {
    messages,
    phase,
    formData,
    setFormData,
    agents,
    report,
    loading,
    error,
    inputValue,
    setInputValue,
    showForm,
    showTyping,
    agentStep,
    resultAnchorId,
    conversationId,
    title,
    submitForm,
    loadExampleCase,
    newConsultation,
    startNewConversation,
    loadConversation,
    renameActive,
    handleSendMessage,
  }
}
