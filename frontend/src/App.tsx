import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import AppShell from './components/layout/AppShell'
import { CaseActionsProvider } from './components/layout/CaseActionsContext'
import MobileLayout from './components/MobileLayout'
import About from './pages/About'
import Chat from './pages/Chat'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import NotFound from './pages/NotFound'

export default function App() {
  const location = useLocation()
  const reduce = useReducedMotion()
  const isChat = location.pathname === '/chat'
  return (
    <CaseActionsProvider>
      <AppShell>
        <MobileLayout hideLayout={isChat}>
        <AnimatePresence mode="wait" initial={false}>
          {/* Cross-fade entre páginas: solo opacity (sin reflow). h-full
              preserva el layout flex de pantalla completa del chat. */}
          <motion.div
            key={location.pathname}
            className="h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
          >
            <Routes location={location}>
              <Route path="/" element={<Navigate to="/chat" replace />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/history" element={<History />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
        </MobileLayout>
      </AppShell>
    </CaseActionsProvider>
  )
}
