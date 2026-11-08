import { createContext, useCallback, useContext, useEffect, type ReactNode } from 'react'

import { usePersistentState } from '../../hooks/usePersistentState'

export type Theme = 'light' | 'dark'
export type FontScale = 'normal' | 'large' | 'xlarge'

interface PreferencesState {
  theme: Theme
  setTheme: (t: Theme) => void
  toggleTheme: () => void
  fontScale: FontScale
  setFontScale: (s: FontScale) => void
  reset: () => void
}

const noop = () => {}

const PreferencesContext = createContext<PreferencesState>({
  theme: 'light',
  setTheme: noop,
  toggleTheme: noop,
  fontScale: 'normal',
  setFontScale: noop,
  reset: noop,
})

export function usePreferences(): PreferencesState {
  return useContext(PreferencesContext)
}

/**
 * Preferencias visuales 100% frontend (tema claro/oscuro y tamaño de fuente),
 * persistidas en localStorage. No consulta ni modifica el backend.
 * - Tema: alterna la clase `.dark` en <html> (Tailwind darkMode: 'class').
 * - Tamaño: fija `data-font` en <html> y un font-size base proporcional.
 */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = usePersistentState<Theme>('anemia.theme', 'light')
  const [fontScale, setFontScale] = usePersistentState<FontScale>('anemia.fontScale', 'normal')

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme
  }, [theme])

  useEffect(() => {
    document.documentElement.dataset.font = fontScale
  }, [fontScale])

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [setTheme])
  const reset = useCallback(() => {
    setTheme('light')
    setFontScale('normal')
  }, [setTheme, setFontScale])

  return (
    <PreferencesContext.Provider value={{ theme, setTheme, toggleTheme, fontScale, setFontScale, reset }}>
      {children}
    </PreferencesContext.Provider>
  )
}
