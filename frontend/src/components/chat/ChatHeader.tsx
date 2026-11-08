import { motion, useReducedMotion } from 'framer-motion'
import { useMemo } from 'react'

import { useIsDesktop } from '../../hooks/useMediaQuery'
import { BrandMark } from '../brand/BrandLogo'
import SettingsMenu from '../layout/SettingsMenu'
import SidebarToggle from '../layout/SidebarToggle'

interface Props {
  /** Nombre de la conversación/caso activo. */
  title?: string
}

function formatToday(): string {
  return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date())
    .replace('.', '')
}

/**
 * Cabecera minimalista del chat. En escritorio: logo del sistema + nombre de la
 * conversación y fecha + botón de configuración (el botón de colapsar el sidebar
 * vive DENTRO del propio sidebar, no aquí). En móvil/tablet se antepone el botón
 * de menú para abrir/cerrar el sidebar (drawer).
 */
export default function ChatHeader({ title }: Props) {
  const reduce = useReducedMotion()
  const isDesktop = useIsDesktop()
  const date = useMemo(formatToday, [])
  const name = title && title !== 'Nueva consulta' ? title : 'Nueva consulta'

  return (
    <header className="glass sticky top-0 z-40" role="banner">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-2.5 sm:px-5 sm:py-3"
      >
        {/* Botón de menú: solo en móvil/tablet (abre el drawer). En escritorio
            el colapso del sidebar se controla desde el header del propio sidebar. */}
        {!isDesktop && <SidebarToggle />}

        {/* Logo del sistema, junto al nombre de la conversación. */}
        <BrandMark size={30} animated={false} idle={false} title="AnemIA" className="flex-shrink-0" />

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-bold leading-tight tracking-tight text-slate-800 dark:text-slate-100">
            {name}
          </h1>
          <p className="truncate text-[11px] leading-tight text-slate-400 dark:text-slate-500">
            Caso clínico · <span className="font-data">{date}</span>
          </p>
        </div>

        <SettingsMenu />
      </motion.div>
    </header>
  )
}
