import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import SectionLabel from './SectionLabel'

/**
 * Cinematic page hero for inner pages.
 * Keeps the espresso/amber brand look but is lighter than the full home Hero.
 */
export default function PageHero({
  label,
  title,
  titleHighlight,
  subtitle,
  breadcrumb,        // [{ label, href }]
  align = 'center',  // 'center' | 'left'
  children,
}) {
  const isCenter = align === 'center'

  return (
    <section
      className="relative min-h-[52vh] flex flex-col justify-end overflow-hidden bg-espresso pt-20"
      aria-label={`Página: ${label || title}`}
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 60%, rgba(107,45,30,0.45) 0%, transparent 55%),
            radial-gradient(ellipse at 80% 20%, rgba(200,135,58,0.18) 0%, transparent 50%),
            linear-gradient(160deg, #0A0604 0%, #1A0B06 50%, #2C1810 100%)
          `,
        }}
        aria-hidden="true"
      />

      {/* Grain */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E")`,
        }}
        aria-hidden="true"
      />

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(10,6,4,0.4), transparent)' }}
        aria-hidden="true"
      />

      <div className={`container-site relative z-10 pb-14 md:pb-18 ${isCenter ? 'text-center' : ''}`}>

        {/* Breadcrumb */}
        {breadcrumb && (
          <motion.nav
            aria-label="Breadcrumb"
            className={`flex items-center gap-2 text-xs font-body text-warm-gray mb-6 ${isCenter ? 'justify-center' : ''}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {breadcrumb.map((crumb, i) => (
              <span key={crumb.href} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden="true" className="text-warm-gray/40">›</span>}
                {i === breadcrumb.length - 1 ? (
                  <span className="text-amber" aria-current="page">{crumb.label}</span>
                ) : (
                  <Link to={crumb.href} className="hover:text-ivory transition-colors duration-200">
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </motion.nav>
        )}

        {/* Label */}
        {label && (
          <div className={isCenter ? 'flex justify-center mb-4' : 'mb-4'}>
            <SectionLabel light>{label}</SectionLabel>
          </div>
        )}

        {/* Title */}
        <motion.h1
          className={`font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-ivory leading-[1.05] tracking-tighter-display mb-5 ${isCenter ? 'mx-auto max-w-3xl' : 'max-w-2xl'}`}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.19, 1, 0.22, 1] }}
        >
          {title}
          {titleHighlight && (
            <>
              <br />
              <span className="text-gradient-gold">{titleHighlight}</span>
            </>
          )}
        </motion.h1>

        {/* Subtitle */}
        {subtitle && (
          <motion.p
            className={`font-body text-ivory/55 text-base md:text-lg leading-relaxed ${isCenter ? 'max-w-xl mx-auto' : 'max-w-md'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
          >
            {subtitle}
          </motion.p>
        )}

        {/* Extra content (buttons, etc.) */}
        {children && (
          <motion.div
            className={`mt-8 ${isCenter ? 'flex justify-center' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            {children}
          </motion.div>
        )}
      </div>

      {/* Bottom amber line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(200,135,58,0.4), transparent)' }}
        aria-hidden="true"
      />
    </section>
  )
}
