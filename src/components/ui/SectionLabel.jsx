import { motion } from 'framer-motion'
import clsx from 'clsx'

export default function SectionLabel({ children, light = false, className }) {
  return (
    <motion.span
      className={clsx('section-label', className)}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Tema claro: el prop `light` se conserva por compatibilidad; ambas
          variantes usan el acento AA (terracota tostado) sobre fondo claro. */}
      <span
        className={clsx(
          'block w-6 h-px',
          light ? 'bg-accent-600' : 'bg-amber'
        )}
        aria-hidden="true"
      />
      {children}
    </motion.span>
  )
}
