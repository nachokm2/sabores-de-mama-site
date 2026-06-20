import { motion } from 'framer-motion'
import { openChatBot } from '../lib/openChatBot'

export default function NotFound() {
  

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div
        className="text-center max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <p className="text-7xl mb-6" aria-hidden="true">🍽️</p>
        <h1 className="font-display text-espresso text-5xl font-bold mb-4">
          <span className="text-terracotta">404</span>
        </h1>
        <p className="font-display text-espresso text-2xl mb-4">
          Este plato no está en el menú.
        </p>
        <p className="font-body text-warm-gray text-base mb-8 leading-relaxed">
          La página que buscas no existe. Pero tenemos algo mejor:
          comida casera deliciosa esperándote.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/" className="btn-primary">
            Volver al inicio
          </a>
          <button onClick={openChatBot} className="btn-outline">
            Ver el menú
          </button>
        </div>
      </motion.div>
    </div>
  )
}
