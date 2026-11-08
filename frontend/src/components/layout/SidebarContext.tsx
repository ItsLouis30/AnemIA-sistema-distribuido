import { createContext, useContext } from 'react'

/**
 * Estado de la barra lateral de navegación, compartido entre el AppShell
 * (que la renderiza) y las cabeceras (que disponen del botón de toggle).
 * Es estado de UI puramente presentacional — no toca datos ni backend.
 */
export interface SidebarState {
  /** En escritorio: sidebar oculto (ancho 0) vs. expandido. */
  collapsed: boolean
  setCollapsed: (next: boolean | ((prev: boolean) => boolean)) => void
  /** En móvil/tablet: drawer de navegación abierto. */
  mobileOpen: boolean
  setMobileOpen: (next: boolean) => void
  /** Alterna según el viewport: colapsa en escritorio, abre/cierra en móvil. */
  toggle: () => void
  /** ≥ lg (1024px). */
  isDesktop: boolean
}

const noop = () => {}

export const SidebarContext = createContext<SidebarState>({
  collapsed: false,
  setCollapsed: noop,
  mobileOpen: false,
  setMobileOpen: noop,
  toggle: noop,
  isDesktop: true,
})

export function useSidebar(): SidebarState {
  return useContext(SidebarContext)
}
