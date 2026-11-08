import { motion, useReducedMotion } from 'framer-motion'
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'

import { useSidebar } from './SidebarContext'

/**
 * Botón de mostrar/ocultar la barra lateral. Es SOLO para el sidebar (no es el
 * historial): en escritorio colapsa/expande el rail; en móvil abre el drawer
 * de navegación. Icono + tooltip + aria-label explícitos.
 */
export default function SidebarToggle({ className = '' }: { className?: string }) {
  const { toggle, isDesktop, collapsed, mobileOpen } = useSidebar()
  const reduce = useReducedMotion()

  const Icon = !isDesktop ? Menu : collapsed ? PanelLeftOpen : PanelLeftClose
  const label = !isDesktop
    ? mobileOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'
    : collapsed ? 'Mostrar sidebar' : 'Ocultar sidebar'

  return (
    <motion.button
      type="button"
      onClick={toggle}
      whileHover={reduce ? undefined : { scale: 1.06 }}
      whileTap={reduce ? undefined : { scale: 0.92 }}
      title={isDesktop ? 'Mostrar/ocultar sidebar' : 'Menú de navegación'}
      aria-label={label}
      aria-expanded={isDesktop ? !collapsed : mobileOpen}
      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-slate-500 ring-1 ring-transparent transition hover:bg-slate-100 hover:text-slate-700 hover:ring-slate-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/60 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200 ${className}`}
    >
      <Icon size={18} aria-hidden="true" />
    </motion.button>
  )
}
