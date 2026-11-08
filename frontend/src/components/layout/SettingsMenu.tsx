import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  Moon, RotateCcw, Settings, Sun, type LucideIcon,
} from 'lucide-react'
import { useEffect, useId, useState } from 'react'

import { usePreferences, type FontScale, type Theme } from './PreferencesContext'

const fontLabels: Record<FontScale, string> = {
  normal: 'Normal',
  large: 'Grande',
  xlarge: 'Muy grande',
}

/**
 * Botón de Configuración (engranaje) con un popover de preferencias visuales:
 * tema claro/oscuro, tamaño de texto y restablecer preferencias. Solo afecta al
 * frontend (localStorage); no incluye descarga de PDF.
 *
 * El popover se abre/cierra siempre: el overlay de cierre por clic-fuera se
 * renderiza FUERA de <AnimatePresence> (se desmonta de inmediato, sin quedar
 * capturando clicks durante la animación de salida) y la animación de salida
 * solo afecta al panel.
 */
export default function SettingsMenu() {
  const { theme, setTheme, fontScale, setFontScale, reset } = usePreferences()
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="relative flex-shrink-0">
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileTap={reduce ? undefined : { scale: 0.92 }}
        title="Configuración"
        aria-label="Configuración"
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative z-50 flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 ring-1 ring-transparent transition hover:bg-slate-100 hover:text-slate-700 hover:ring-slate-200/70 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100"
      >
        <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: reduce ? 0 : 0.25 }}>
          <Settings size={18} aria-hidden="true" />
        </motion.span>
      </motion.button>

      {/* Overlay de clic-fuera: fuera de AnimatePresence para que se desmonte de
          inmediato al cerrar y nunca bloquee clicks. */}
      {open && (
        <button
          type="button"
          aria-hidden="true"
          tabIndex={-1}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 cursor-default"
        />
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            key="settings-menu"
            role="menu"
            aria-label="Configuración"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: reduce ? 0 : 0.16, ease: 'easeOut' }}
            className="absolute right-0 top-11 z-50 w-64 origin-top-right rounded-2xl border border-slate-200 bg-white p-3 shadow-xl ring-1 ring-slate-900/5 dark:border-white/10 dark:bg-slate-800 dark:ring-black/40"
          >
            <p className="eyebrow mb-1.5 px-0.5">Apariencia</p>
            <Segmented
              value={theme}
              onChange={(v) => setTheme(v as Theme)}
              options={[
                { value: 'light', label: 'Claro', icon: Sun, ariaLabel: 'Tema claro' },
                { value: 'dark', label: 'Oscuro', icon: Moon, ariaLabel: 'Tema oscuro' },
              ]}
            />

            <div className="mb-1.5 mt-3 flex items-center justify-between px-0.5">
              <span className="eyebrow">Tamaño de texto</span>
              <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400">{fontLabels[fontScale]}</span>
            </div>
            <Segmented
              value={fontScale}
              onChange={(v) => setFontScale(v as FontScale)}
              options={[
                { value: 'normal', label: 'A', ariaLabel: 'Texto normal', labelClass: 'text-[12px]' },
                { value: 'large', label: 'A', ariaLabel: 'Texto grande', labelClass: 'text-[15px]' },
                { value: 'xlarge', label: 'A', ariaLabel: 'Texto muy grande', labelClass: 'text-[17px]' },
              ]}
            />

            <div className="mt-3 space-y-0.5 border-t border-slate-100 pt-2 dark:border-white/10">
              <MenuButton
                icon={RotateCcw}
                label="Restablecer preferencias"
                hint="Tema y tamaño por defecto"
                onClick={reset}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface SegOption<T extends string> {
  value: T
  label: string
  icon?: LucideIcon
  ariaLabel?: string
  labelClass?: string
}

function Segmented<T extends string>({
  value, onChange, options,
}: { value: T; onChange: (v: T) => void; options: SegOption<T>[] }) {
  const lid = useId()
  return (
    <div
      className="grid gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900/50"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      role="group"
    >
      {options.map((o) => {
        const active = o.value === value
        const Icon = o.icon
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            aria-label={o.ariaLabel || o.label}
            className={`relative flex items-center justify-center rounded-lg px-2 py-1.5 font-semibold transition-colors ${
              active ? 'text-teal-700 dark:text-teal-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {active && (
              <motion.span
                layoutId={lid}
                className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-slate-700"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className={`relative z-10 inline-flex items-center gap-1.5 ${o.labelClass || 'text-xs'}`}>
              {Icon && <Icon size={14} aria-hidden="true" />}
              {o.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function MenuButton({
  icon: Icon, label, hint, onClick, disabled,
}: { icon: LucideIcon; label: string; hint?: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/10"
    >
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300">
        <Icon size={15} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{label}</span>
        {hint && <span className="block truncate text-[10px] text-slate-400 dark:text-slate-500">{hint}</span>}
      </span>
    </button>
  )
}
