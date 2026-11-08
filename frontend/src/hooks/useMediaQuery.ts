import { useEffect, useState } from 'react'

/**
 * Suscribe a una media query CSS y devuelve si coincide. SSR-safe.
 * Usado para alternar entre layouts móvil/escritorio según breakpoint.
 */
export function useMediaQuery(query: string): boolean {
  const getMatch = () =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false

  const [matches, setMatches] = useState<boolean>(getMatch)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    setMatches(mql.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}

/** Breakpoints alineados con Tailwind (lg = 1024px). */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}

export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px)')
}

/** Pantallas anchas (xl = 1280px). Usado para mostrar a la vez el sidebar
 *  izquierdo de navegación y el panel derecho de acciones del chat. */
export function useIsWide(): boolean {
  return useMediaQuery('(min-width: 1280px)')
}
