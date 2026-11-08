import { motion, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

import { useIsDesktop } from '../../hooks/useMediaQuery'
import { usePersistentState } from '../../hooks/usePersistentState'
import { easeOut } from '../../lib/motion'
import Drawer from '../ui/Drawer'
import Sidebar from './Sidebar'
import { SidebarContext } from './SidebarContext'

/** Ancho del sidebar expandido y del rail colapsado (px). */
const FULL = 280
const RAIL = 72

/**
 * Carcasa de la aplicación: barra lateral conversacional + área principal.
 * - Escritorio (≥ lg): el sidebar está ABIERTO por defecto, pero puede
 *   colapsarse a un rail (72px) con el botón situado en SU PROPIO header (a la
 *   derecha de la marca «AnemIA»). El ancho del layout depende del estado
 *   `collapsed`; el contenido principal se expande para ocupar el espacio
 *   liberado (animación con Framer Motion). La preferencia se recuerda en
 *   localStorage (por defecto: abierto).
 * - Móvil/tablet (< lg): el sidebar es un drawer que se abre con el botón de
 *   menú de la cabecera.
 *
 * Es estado de UI puramente presentacional: no toca datos, payloads ni backend.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  const isDesktop = useIsDesktop()
  const reduce = useReducedMotion()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  // Preferencia de escritorio persistida. Por defecto `false` = sidebar abierto.
  const [collapsed, setCollapsed] = usePersistentState<boolean>('anemia.sidebarCollapsed', false)

  // Al navegar, cierra el drawer móvil.
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // El toggle se adapta al viewport: en escritorio colapsa/expande el sidebar;
  // en móvil abre/cierra el drawer.
  const toggle = useCallback(() => {
    if (isDesktop) setCollapsed((c) => !c)
    else setMobileOpen((o) => !o)
  }, [isDesktop, setCollapsed])

  return (
    <SidebarContext.Provider
      value={{ collapsed, setCollapsed, mobileOpen, setMobileOpen, toggle, isDesktop }}
    >
      <div className="flex h-full overflow-hidden">
        {/* Sidebar colapsable en escritorio: el ancho anima entre 280 (abierto)
            y 72 (rail). Nunca llega a 0, de modo que el botón de expandir
            siempre queda visible y no queda una columna blanca vacía. */}
        <motion.aside
          className="relative z-20 hidden flex-shrink-0 overflow-hidden border-r border-slate-200/70 bg-gradient-to-b from-white to-slate-50/70 shadow-[1px_0_0_0_rgb(255_255_255/0.6)] backdrop-blur-xl dark:border-white/10 dark:from-slate-900 dark:to-slate-900/80 dark:shadow-[1px_0_0_0_rgb(255_255_255/0.04)] lg:block"
          initial={false}
          animate={{ width: collapsed ? RAIL : FULL }}
          transition={{ duration: reduce ? 0 : 0.25, ease: easeOut }}
        >
          <Sidebar collapsed={collapsed} onToggleCollapse={toggle} showCollapseButton />
        </motion.aside>

        {/* Sidebar como drawer en móvil/tablet (siempre expandido, sin botón de
            colapso: el cierre se hace con el propio drawer). */}
        {!isDesktop && (
          <Drawer
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            side="left"
            widthClass="w-[84%] max-w-[280px]"
            ariaLabel="Navegación principal"
          >
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </Drawer>
        )}

        {/* Área principal: ocupa el resto. Al cambiar el ancho del sidebar, el
            layout flex se reajusta cuadro a cuadro → expansión suave sin huecos. */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </SidebarContext.Provider>
  )
}
