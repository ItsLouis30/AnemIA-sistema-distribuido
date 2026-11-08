import { motion } from 'framer-motion'
import { Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { pageTransition } from '../pageTransition'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <motion.div {...pageTransition} className="flex flex-col items-center gap-4 py-20 text-center">
      <p className="text-5xl font-bold text-brand-600">404</p>
      <p className="text-sm text-slate-500">La página que buscas no existe.</p>
      <button onClick={() => navigate('/')} className="btn-primary">
        <Home size={16} /> Volver al inicio
      </button>
    </motion.div>
  )
}
