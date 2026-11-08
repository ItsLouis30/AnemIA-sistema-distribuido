import { useEffect, useRef, useState } from 'react'

export function useTypewriter(text: string, speed = 25) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(true)
  const idxRef = useRef(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    idxRef.current = 0
    setDisplayed('')
    setDone(false)

    if (!text) {
      setDone(true)
      return
    }

    const interval = setInterval(() => {
      if (!mountedRef.current) {
        clearInterval(interval)
        return
      }
      idxRef.current++
      if (idxRef.current <= text.length) {
        setDisplayed(text.slice(0, idxRef.current))
      } else {
        clearInterval(interval)
        setDone(true)
      }
    }, speed)

    return () => {
      mountedRef.current = false
      clearInterval(interval)
    }
  }, [text, speed])

  return { displayed, done }
}
