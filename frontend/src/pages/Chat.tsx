import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Cpu } from 'lucide-react'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'

import ChatInput from '../components/chat/ChatInput'
import ChatLayout from '../components/chat/ChatLayout'
import ChatMessage from '../components/chat/ChatMessage'
import ConversationDrawer from '../components/chat/ConversationDrawer'
import TypingIndicator from '../components/chat/TypingIndicator'
import ClinicalFormCard from '../components/clinical/ClinicalFormCard'
import ClinicalResultPanel from '../components/clinical/ClinicalResultPanel'
import ExplainabilityBubble from '../components/clinical/ExplainabilityBubble'
import PredictionResultBubble from '../components/clinical/PredictionResultBubble'
import RecommendationBubble from '../components/clinical/RecommendationBubble'
import ReportCard from '../components/clinical/ReportCard'
import { useCaseActions } from '../components/layout/CaseActionsContext'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { useChat } from '../hooks/useChat'
import { useClinicalPdf } from '../hooks/useClinicalPdf'

export default function Chat() {
  const {
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
    title,
    resultAnchorId,
    submitForm,
    loadExampleCase,
    startNewConversation,
    loadConversation,
    conversationId,
    handleSendMessage,
  } = useChat()

  const { registerHandlers, setStatus, registerSelect, setActiveConversationId } = useCaseActions()
  const { generating, downloadPdf } = useClinicalPdf()
  const reduce = useReducedMotion()
  const scrollRef = useRef<HTMLDivElement>(null)

  const [historyOpen, setHistoryOpen] = useState(false)
  const [resultsOpen, setResultsOpen] = useState(false)
  const [confirmNewOpen, setConfirmNewOpen] = useState(false)

  const agentsDone = agents.filter((a) => a.status === 'completed').length
  const running = agents.some((a) => a.status === 'running')
  const hasData = !!report || phase !== 'awaiting_data'

  // Refs para que los handlers registrados lean siempre el estado más reciente
  // sin recrearse en cada render (evita re-registrar el contexto continuamente).
  const formDataRef = useRef(formData)
  formDataRef.current = formData
  const reportRef = useRef(report)
  reportRef.current = report

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, showTyping, showForm, report, scrollToBottom])

  useEffect(() => {
    const handler = () => scrollToBottom()
    window.addEventListener('chat:scroll', handler)
    return () => window.removeEventListener('chat:scroll', handler)
  }, [scrollToBottom])

  // El comando «ver agentes» (chip o /agentes) abre los resultados a pantalla completa.
  useEffect(() => {
    const open = () => setResultsOpen(true)
    window.addEventListener('agents:open', open)
    return () => window.removeEventListener('agents:open', open)
  }, [])

  const requestNewConsultation = useCallback(() => {
    if (hasData) setConfirmNewOpen(true)
    else startNewConversation()
  }, [hasData, startNewConversation])

  // Registra las acciones del caso para que la barra lateral global pueda
  // dispararlas (cargar ejemplo, nuevo caso, analizar, ver agentes, PDF, historial).
  useEffect(() => {
    registerHandlers({
      example: loadExampleCase,
      new: requestNewConsultation,
      analyze: () => submitForm(formDataRef.current),
      agents: () => setResultsOpen(true),
      pdf: () => {
        const r = reportRef.current
        if (r?.ok) void downloadPdf(r)
      },
      history: () => setHistoryOpen(true),
    })
    return () => registerHandlers(null)
  }, [registerHandlers, loadExampleCase, requestNewConsultation, submitForm, downloadPdf])

  // Registra la apertura de conversaciones para la lista de recientes del sidebar.
  useEffect(() => {
    registerSelect((id) => void loadConversation(id))
    return () => registerSelect(null)
  }, [registerSelect, loadConversation])

  // Publica la conversación activa para resaltarla en la lista de recientes.
  useEffect(() => {
    setActiveConversationId(conversationId)
  }, [setActiveConversationId, conversationId])

  // Mantiene el estado del caso sincronizado con la barra lateral.
  useEffect(() => {
    setStatus({
      loading,
      hasReport: !!report?.ok,
      agentsDone,
      agentsTotal: agents.length,
      running,
      pdfGenerating: generating,
    })
  }, [setStatus, loading, report?.ok, agentsDone, agents.length, running, generating])

  return (
    <>
      <ChatLayout title={title}>
        <div className="flex min-h-0 flex-1 flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth">
            <div className="mx-auto w-full max-w-3xl space-y-2 px-2 pb-2 pt-3 sm:px-4">
              {messages.map((msg, i) => (
                <Fragment key={msg.id}>
                  <ChatMessage role={msg.role} content={msg.content} isLast={i === messages.length - 1} />

                  {/* Resultados del análisis, anclados al turno que los generó:
                      se renderizan justo debajo del mensaje que cierra ese turno
                      (no como bloque global al fondo del chat). */}
                  {report?.ok && resultAnchorId === msg.id && (
                    <div className="space-y-2">
                      {report.prediction && (
                        <div className="px-2 pb-1 pt-2 sm:px-4">
                          <PredictionResultBubble report={report} />
                        </div>
                      )}

                      {report.explainability && (
                        <div className="px-2 pb-1 pt-2 sm:px-4">
                          <ExplainabilityBubble shap={report.explainability.shap} lime={report.explainability.lime} />
                        </div>
                      )}

                      {report.recommendation && (
                        <div className="px-2 pb-1 pt-2 sm:px-4">
                          <RecommendationBubble recommendation={report.recommendation} diagnosisLabel={report.prediction?.diagnosis_label} />
                        </div>
                      )}

                      <div className="px-2 pb-1 pt-2 sm:px-4">
                        <ReportCard report={report} />
                      </div>

                      {/* Acción contextual del turno: abre el detalle de agentes y XAI. */}
                      <div className="px-2 pb-1 pt-1 sm:px-4">
                        <button
                          type="button"
                          onClick={() => setResultsOpen(true)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-teal-200 hover:bg-teal-50/50 hover:text-teal-700 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-white/5"
                        >
                          <Cpu size={15} aria-hidden="true" /> Ver agentes y XAI
                        </button>
                      </div>
                    </div>
                  )}
                </Fragment>
              ))}

              <AnimatePresence>{showTyping && <TypingIndicator />}</AnimatePresence>

              {showForm && (phase === 'awaiting_data' || phase === 'idle') && (
                <div className="px-2 pb-1 pt-2 sm:px-4">
                  <ClinicalFormCard
                    value={formData}
                    onChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
                    onSubmit={() => submitForm(formData)}
                    onLoadExample={loadExampleCase}
                    loading={loading}
                  />
                </div>
              )}

              {error && (
                <div className="px-2 pt-2 sm:px-4">
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{error}</div>
                </div>
              )}

              <div className="h-4" />
            </div>
          </div>

          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSendMessage}
            disabled={loading}
          />
        </div>
      </ChatLayout>

      {/* Resultados clínicos a PANTALLA COMPLETA (al pulsar «Ver agentes»). */}
      {resultsOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex flex-col bg-white dark:bg-slate-900"
          initial={{ opacity: 0, y: reduce ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.2, ease: 'easeOut' }}
          role="dialog"
          aria-modal="true"
          aria-label="Resultados clínicos"
        >
          <ClinicalResultPanel report={report} agents={agents} onBack={() => setResultsOpen(false)} />
        </motion.div>
      )}

      <ConversationDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        activeId={conversationId}
        onSelect={(id) => void loadConversation(id)}
        onNew={requestNewConsultation}
      />

      <ConfirmDialog
        open={confirmNewOpen}
        title="Iniciar nueva consulta"
        message="La consulta actual quedará guardada en el historial. ¿Deseas comenzar una nueva?"
        confirmLabel="Nueva consulta"
        onConfirm={() => {
          setConfirmNewOpen(false)
          startNewConversation()
        }}
        onCancel={() => setConfirmNewOpen(false)}
      />
    </>
  )
}
