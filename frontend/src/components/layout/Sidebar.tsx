import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  BarChart3, Info, MessageSquarePlus, MessageSquareText,
  PanelLeftClose, PanelLeftOpen, type LucideIcon,
} from 'lucide-react'
import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'

import { useConversations } from '../../hooks/useConversations'
import { easeOut, staggerContainer, staggerItem } from '../../lib/motion'
import type { ConversationStatus } from '../../types'
import BrandLogo from '../brand/BrandLogo'
import { useCaseActions } from './CaseActionsContext'

interface Props {
  /** Cierra el drawer móvil tras navegar/seleccionar. */
  onNavigate?: () => void
  /** Escritorio: el sidebar está colapsado a rail (solo iconos). */
  collapsed?: boolean
  /** Alterna colapsado/expandido (solo escritorio). */
  onToggleCollapse?: () => void
  /** Muestra el botón de colapsar en el header del sidebar (solo escritorio). */
  showCollapseButton?: boolean
}

const statusDot: Record<ConversationStatus, string> = {
  draft: 'bg-slate-300 dark:bg-slate-600',
  processing: 'bg-amber-400',
  completed: 'bg-emerald-500',
  error: 'bg-red-500',
}

function relativeDate(ts: number): string {
  return new Date(ts).toLocaleString('es-PE', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

/**
 * Barra lateral conversacional (estilo ChatGPT/Gemini/Claude): marca, botón
 * «Nueva consulta» y una lista lineal de consultas recientes. El botón para
 * colapsar/expandir vive en el header del sidebar, a la derecha de la marca.
 * Es solo UI: invoca handlers ya existentes (no toca payloads, endpoints ni la
 * lógica del backend).
 */
export default function Sidebar({
  onNavigate, collapsed = false, onToggleCollapse, showCollapseButton = false,
}: Props) {
  const reduce = useReducedMotion()
  const { invoke, selectConversation, activeConversationId, status } = useCaseActions()
  const { summaries, refresh } = useConversations()

  // Refresca la lista de recientes cuando cambia la consulta activa o termina
  // un análisis (para reflejar título/estado actualizados).
  useEffect(() => {
    const t = setTimeout(() => void refresh(), 450)
    return () => clearTimeout(t)
  }, [activeConversationId, status.hasReport, status.running, refresh])

  const onNewConsultation = () => {
    invoke('new')
    onNavigate?.()
  }

  const onSelect = (id: string) => {
    selectConversation(id)
    onNavigate?.()
  }

  return (
    <nav
      className="flex h-full min-h-0 flex-col"
      aria-label="Consultas recientes"
    >
      {/* Marca + botón de colapsar. */}
      <div
        className={`flex h-[60px] flex-shrink-0 items-center border-b border-slate-200/70 dark:border-white/10 ${
          collapsed ? 'justify-center px-2' : 'gap-2 px-4'
        }`}
      >
        {!collapsed && (
          <span className="min-w-0 flex-1">
            <BrandLogo size={32} subtitle="Asistente Clínico" wordmarkSize="md" idle={false} />
          </span>
        )}
        {showCollapseButton && (
          <CollapseButton collapsed={collapsed} onClick={onToggleCollapse} />
        )}
      </div>

      {/* Nueva consulta */}
      <div className={`flex-shrink-0 pt-3 ${collapsed ? 'px-2' : 'px-3'}`}>
        <motion.button
          type="button"
          onClick={onNewConsultation}
          whileHover={reduce ? undefined : { y: -1 }}
          whileTap={reduce ? undefined : { scale: 0.98 }}
          className={`flex w-full items-center rounded-xl bg-teal-600 text-white shadow-glow transition-colors hover:bg-teal-700 ${
            collapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-3 py-2.5 text-left'
          }`}
          aria-label="Nueva consulta"
          title={collapsed ? 'Nueva consulta' : undefined}
        >
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
            <MessageSquarePlus size={18} aria-hidden="true" />
          </span>
          {!collapsed && <span className="text-sm font-bold leading-tight">Nueva consulta</span>}
        </motion.button>
      </div>

      {/* Consultas recientes (solo en modo expandido). En rail se ocultan para
          mantener el panel limpio; se conservan en estado y reaparecen al
          expandir. */}
      <div className={`flex-1 overflow-y-auto py-3 scrollbar-thin ${collapsed ? 'px-2' : 'px-3'}`}>
        {!collapsed && (
          <>
            <p className="eyebrow mb-2 px-2">Consultas recientes</p>
            {summaries.length === 0 ? (
              <p className="px-2 py-6 text-center text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
                Aún no hay consultas. Inicia una nueva para verla aquí.
              </p>
            ) : (
              <motion.ul
                className="space-y-1"
                variants={reduce ? undefined : staggerContainer(0.035, 0.02)}
                initial={reduce ? false : 'hidden'}
                animate="visible"
                role="list"
              >
                {summaries.map((c) => {
                  const isActive = c.id === activeConversationId
                  return (
                    <motion.li key={c.id} variants={reduce ? undefined : staggerItem}>
                      <motion.button
                        type="button"
                        onClick={() => onSelect(c.id)}
                        whileHover={reduce ? undefined : { x: 3 }}
                        whileTap={reduce ? undefined : { scale: 0.985 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        aria-current={isActive ? 'true' : undefined}
                        aria-label={`Abrir consulta ${c.title}`}
                        className={`group relative flex w-full flex-col items-start rounded-xl px-3 py-2 text-left transition-colors ${
                          isActive
                            ? 'bg-teal-50 ring-1 ring-teal-100 dark:bg-teal-500/15 dark:ring-teal-400/20'
                            : 'hover:bg-slate-100/80 dark:hover:bg-white/5'
                        }`}
                      >
                        <span className="flex w-full items-center gap-2">
                          <MessageSquareText
                            size={14}
                            aria-hidden="true"
                            className={`flex-shrink-0 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'}`}
                          />
                          <span className={`min-w-0 flex-1 truncate text-[13px] font-semibold leading-tight ${
                            isActive ? 'text-teal-800 dark:text-teal-200' : 'text-slate-700 dark:text-slate-200'
                          }`}>
                            {c.title}
                          </span>
                        </span>
                        <span className="mt-1 flex items-center gap-1.5 pl-6 text-[10px] text-slate-400 dark:text-slate-500">
                          <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${statusDot[c.status]}`} aria-hidden="true" />
                          <span className="truncate">{relativeDate(c.updatedAt)}</span>
                        </span>
                      </motion.button>
                    </motion.li>
                  )
                })}
              </motion.ul>
            )}
          </>
        )}
      </div>

      {/* Información */}
      <div className={`flex-shrink-0 border-t border-slate-200/70 py-2.5 dark:border-white/10 ${collapsed ? 'px-2' : 'px-3'}`}>
        <FooterLink to="/dashboard" label="Panel" icon={BarChart3} collapsed={collapsed} onNavigate={onNavigate} />
        <FooterLink to="/about" label="Acerca" icon={Info} collapsed={collapsed} onNavigate={onNavigate} />
      </div>
    </nav>
  )
}

/**
 * Botón de colapsar/expandir, dentro del header del sidebar (escritorio). Cambia
 * de icono (PanelLeftClose ⟷ PanelLeftOpen) y de aria-label según el estado, con
 * una transición de rotación sutil.
 */
function CollapseButton({ collapsed, onClick }: { collapsed: boolean; onClick?: () => void }) {
  const reduce = useReducedMotion()
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose
  const label = collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={reduce ? undefined : { scale: 1.06 }}
      whileTap={reduce ? undefined : { scale: 0.92 }}
      title={label}
      aria-label={label}
      aria-expanded={!collapsed}
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-slate-500 ring-1 ring-transparent transition hover:bg-slate-100 hover:text-slate-700 hover:ring-slate-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/60 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={collapsed ? 'open' : 'close'}
          initial={reduce ? false : { opacity: 0, rotate: -90 }}
          animate={{ opacity: 1, rotate: 0 }}
          exit={reduce ? undefined : { opacity: 0, rotate: 90 }}
          transition={{ duration: 0.18, ease: easeOut }}
          className="flex"
        >
          <Icon size={18} aria-hidden="true" />
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}

function FooterLink({
  to, label, icon: Icon, collapsed = false, onNavigate,
}: {
  to: string; label: string; icon: LucideIcon; collapsed?: boolean; onNavigate?: () => void
}) {
  return (
    <NavLink
      to={to}
      end
      onClick={onNavigate}
      aria-label={label}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center rounded-xl py-2 text-sm font-semibold transition-colors ${
          collapsed ? 'justify-center px-0' : 'gap-3 px-3'
        } ${
          isActive
            ? 'text-teal-700 dark:text-teal-300'
            : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'
        }`
      }
    >
      <Icon size={17} aria-hidden="true" className="flex-shrink-0" />
      {!collapsed && label}
    </NavLink>
  )
}
