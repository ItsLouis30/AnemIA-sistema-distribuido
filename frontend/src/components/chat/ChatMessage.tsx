import { motion, useReducedMotion } from 'framer-motion'
import { Cpu, User } from 'lucide-react'

import { useTypewriter } from '../../hooks/useTypewriter'
import type { MessageRole } from '../../types'
import { BrandMark } from '../brand/BrandLogo'

interface Props {
  role: MessageRole
  content: string | React.ReactNode
  isLast: boolean
}

function renderMarkdown(text: string) {
  const html = text
    .replace(/^### (.*)$/gm, '<h3 class="text-lg font-bold mb-2 mt-3">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.*)$/gm, '<li>$1</li>')
    .replace(/\n/g, '<br/>')

  return {
    __html: html
      .replace(/(<li>.*?<\/li>)/gs, '<ul class="list-disc pl-5 my-2">$1</ul>')
      .replace(/<\/ul><br\/><ul class="list-disc pl-5 my-2">/g, '')
  }
}

export default function ChatMessage({
  role,
  content,
  isLast,
}: Props) {

  const reduce = useReducedMotion()

  const isUser = role === 'user'
  const isAssistant = role === 'assistant'
  const isSystem = role === 'system'
  const isBot = isAssistant || role === 'agent'
  const isString = typeof content === 'string'

  const typeSpeed = reduce ? 0 : 20

  const { displayed, done } = useTypewriter(
    isBot && isLast && isString
      ? content as string
      : '',
    isBot && isLast && isString
      ? typeSpeed
      : 0
  )

  const displayText = isString
    ? (isBot && isLast ? displayed || content : content)
    : content

  const bubble = isUser
    ? 'bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-2xl rounded-br-md shadow-sm shadow-teal-900/20'
    : isSystem
      ? 'bg-amber-50 text-amber-800 rounded-2xl ring-1 ring-amber-200/80 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/25'
      : role === 'agent'
        ? 'bg-slate-50 text-slate-600 rounded-2xl rounded-bl-md ring-1 ring-slate-900/[0.06] dark:bg-slate-800/60 dark:text-slate-300 dark:ring-white/10'
        : 'bg-white text-slate-700 rounded-2xl rounded-bl-md ring-1 ring-slate-900/[0.06] shadow-card dark:bg-slate-800 dark:text-slate-200 dark:ring-white/10'

  const align = isUser
    ? 'justify-end'
    : isSystem
      ? 'justify-center'
      : 'justify-start'

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: reduce ? 0 : 12,
        x: reduce ? 0 : isUser ? 10 : -10
      }}
      animate={{
        opacity: 1,
        y: 0,
        x: 0
      }}
      transition={{
        duration: reduce ? 0 : 0.28,
        ease: [0.22, 1, 0.36, 1]
      }}
      className={`flex ${align} gap-2.5 px-4 ${isLast ? '' : 'mb-3'}`}
      role="listitem"
      aria-label={`Mensaje de ${
        isAssistant
          ? 'AnemIA'
          : isUser
            ? 'usuario'
            : isSystem
              ? 'sistema'
              : 'agente'
      }`}
    >

      {!isUser && !isSystem && (
        <div className="mt-5 flex-shrink-0">
          {isAssistant ? (
            <BrandMark
              size={30}
              animated={false}
              idle={false}
            />
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-500 text-white shadow-sm">
              <Cpu size={14} />
            </span>
          )}
        </div>
      )}

      <div className={`min-w-0 ${isUser ? 'flex flex-col items-end' : ''} max-w-[82%]`}>

        {isAssistant && (
          <span className="mb-1 ml-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            AnemIA
          </span>
        )}

        <div className={`px-4 py-3 text-sm leading-relaxed ${bubble}`}>

          {typeof displayText === 'string' ? (
            <div
              className="break-words"
              dangerouslySetInnerHTML={renderMarkdown(displayText)}
            />
          ) : (
            displayText
          )}

          {!done && isBot && isLast && (
            <span
              className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-teal-500 align-text-bottom"
              aria-hidden="true"
            />
          )}

        </div>

      </div>

      {isUser && (
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-700 text-white shadow-sm">
          <User size={14} />
        </div>
      )}

    </motion.div>
  )
}