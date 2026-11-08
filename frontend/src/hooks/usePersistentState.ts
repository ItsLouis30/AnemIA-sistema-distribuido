import { useEffect, useRef, useState } from 'react'

import { loadLocal, saveLocal } from '../lib/storage'

/**
 * useState con sincronización a localStorage (versionada y con debounce).
 * Sirve para preferencias de UI que deben sobrevivir refresh: panel
 * abierto/cerrado, pestaña activa, modelo seleccionado, etc.
 *
 * No persiste objetos pesados (eso va a IndexedDB vía useConversations).
 */
export function usePersistentState<T>(
  key: string,
  initialValue: T,
  debounceMs = 250,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => loadLocal<T>(key, initialValue))
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => saveLocal(key, state), debounceMs)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [key, state, debounceMs])

  return [state, setState]
}
