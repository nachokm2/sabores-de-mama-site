import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { openChatBot } from '../../lib/openChatBot'

const UtensilsIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6" aria-hidden="true">
    <path d="M8.1 13.34l2.83-2.83L3.91 3.5a4 4 0 000 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z"/>
  </svg>
)

export default function FloatingWhatsApp() {
  
  const [visible, setVisible] = useState(false)
  const [pulse, setPulse] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 2000)
    const pulseTimer = setTimeout(() => setPulse(false), 6000)
    return () => { clearTimeout(timer); clearTimeout(pulseTimer) }
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-floating flex flex-col items-end gap-3"
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          {/* Tooltip */}
          <motion.div
            className="glass-dark text-espresso text-xs font-body px-3 py-2 rounded-xl whitespace-nowrap pointer-events-none"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            ¡Haz tu pedido ahora!
          </motion.div>

          {/* Button */}
          <div className="relative">
            {/* Pulse ring */}
            {pulse && (
              <span className="absolute inset-0 rounded-full bg-terracotta animate-ping opacity-60" />
            )}
            <motion.button
              onClick={openChatBot}
              aria-label="Hacer mi pedido"
              className="relative flex items-center justify-center w-14 h-14 rounded-full bg-terracotta text-ivory shadow-[0_4px_24px_rgba(174,76,41,0.45)] hover:bg-ember active:scale-95 transition-colors duration-200"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
            >
              <UtensilsIcon />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
