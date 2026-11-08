import { motion, useReducedMotion } from 'framer-motion'
import { useLocation } from 'react-router-dom'

import { useIsDesktop } from '../hooks/useMediaQuery'
import SettingsMenu from './layout/SettingsMenu'
import SidebarToggle from './layout/SidebarToggle'

const titles: Record<string, string> = {
  '/dashboard': 'Panel de control',
  '/history': 'Actividad del sistema',
  '/about': 'Acerca de AnemIA',
}

/**
 * Cabecera minimalista para las páginas que no son el chat: título de la sección
 * actual + configuración (y, solo en móvil/tablet, el botón de menú del drawer).
 * En escritorio el colapso del sidebar se controla desde su propio header. La
 * marca y la navegación viven en la barra lateral.
 */
export default function Header() {
  const reduce = useReducedMotion()
  const isDesktop = useIsDesktop()
  const { pathname } = useLocation()
  const title = titles[pathname] ?? 'AnemIA'

  return (
    <header className="glass sticky top-0 z-30" role="banner">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 lg:px-6"
      >
        {!isDesktop && <SidebarToggle />}
        <h1 className="min-w-0 flex-1 truncate text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100">
          {title}
        </h1>
        <SettingsMenu />
      </motion.div>
    </header>
  )
}
