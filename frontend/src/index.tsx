import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'

import App from './App'
import { PreferencesProvider } from './components/layout/PreferencesContext'
// El CSS de Tailwind se compila aparte (CLI) a public/styles.css y se enlaza
// desde index.html; no se importa aquí para evitar el bug de "!" en la ruta.

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <PreferencesProvider>
          <App />
        </PreferencesProvider>
      </MotionConfig>
    </BrowserRouter>
  </React.StrictMode>,
)
