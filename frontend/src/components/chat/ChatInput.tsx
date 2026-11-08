import { motion } from 'framer-motion'
import { ArrowUp } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface Props {
  value: string
  onChange: (val: string) => void
  onSubmit: () => void
  disabled?: boolean
}

// Las acciones rápidas (cargar caso, nuevo caso, analizar, ver agentes,
// dashboard) viven en la barra lateral (ChatActionsSidebar), no aquí.
export default function ChatInput({ value, onChange, onSubmit, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!disabled) inputRef.current?.focus()
  }, [disabled])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  const canSend = !!value.trim() && !disabled

  return (
    <div className="sticky bottom-0 z-30" role="complementary" aria-label="Entrada de chat">
      {/* Fundido que conecta la conversación con la barra de entrada. */}
      <div className="pointer-events-none h-6 bg-gradient-to-t from-[#eef2f7] to-transparent dark:from-[#081012]" aria-hidden="true" />

      <div className="border-t border-white/60 bg-white/85 backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-slate-900/85">
        <div className="mx-auto max-w-3xl px-3 pb-3 pt-2.5 sm:px-4">
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 rounded-2xl bg-white p-1.5 pl-4 shadow-card ring-1 ring-slate-200 transition-all duration-200 focus-within:ring-2 focus-within:ring-teal-500 focus-within:shadow-glow dark:bg-slate-800 dark:ring-white/10"
            role="form"
            aria-label="Formulario de mensaje"
          >
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Escribe un mensaje o un comando…"
              disabled={disabled}
              aria-label="Escribe un mensaje o comando"
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none disabled:opacity-50 dark:text-slate-100 dark:placeholder-slate-500"
            />
            <motion.button
              type="submit"
              disabled={!canSend}
              whileHover={canSend ? { scale: 1.06 } : undefined}
              whileTap={canSend ? { scale: 0.9 } : undefined}
              aria-label="Enviar mensaje"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm shadow-teal-900/20 transition-colors hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-500"
            >
              <ArrowUp size={17} aria-hidden="true" />
            </motion.button>
          </form>
          <p className="mt-1.5 px-1.5 text-[10px] text-slate-400 dark:text-slate-500">
            Escribe un comando como{' '}
            <code className="font-data rounded bg-slate-100 px-1 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">/ayuda</code>{' '}
            o describe el caso. Las recomendaciones requieren validación médica.
          </p>
        </div>
      </div>
    </div>
  )
}
