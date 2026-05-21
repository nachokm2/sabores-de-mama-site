import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { useWhatsApp } from '../../hooks/useWhatsApp'
import { useReducedMotion } from '../../hooks/useReducedMotion'

/* ── Smoke particle ──────────────────────────────────────────────────────── */
function SmokeParticle({ style }) {
  return (
    <span
      className="absolute rounded-full pointer-events-none"
      style={{
        width: 50,
        height: 80,
        background:
          'radial-gradient(ellipse, rgba(200,135,58,0.12) 0%, transparent 70%)',
        animation: `smoke ${8 + Math.random() * 4}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 5}s`,
        ...style,
      }}
      aria-hidden="true"
    />
  )
}

/* ── Scroll indicator ─────────────────────────────────────────────────────── */
function ScrollIndicator() {
  return (
    <motion.div
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2.5, duration: 0.8 }}
      aria-hidden="true"
    >
      <span className="text-ivory/40 text-2xs font-body tracking-[0.2em] uppercase">
        Descubrir
      </span>
      <div className="w-px h-10 bg-gradient-to-b from-amber/50 to-transparent" />
      <div
        className="w-1 h-1 rounded-full bg-amber"
        style={{ animation: 'scroll-bounce 2s ease-in-out infinite' }}
      />
    </motion.div>
  )
}

/* ── Food badge ──────────────────────────────────────────────────────────── */
function FoodBadge({ emoji, label, delay }) {
  return (
    <motion.div
      className="glass flex items-center gap-2.5 rounded-full px-4 py-2.5 text-ivory"
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 300, damping: 25 }}
    >
      <span className="text-xl leading-none">{emoji}</span>
      <span className="font-body text-xs font-medium text-ivory/90 whitespace-nowrap">{label}</span>
    </motion.div>
  )
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function Hero() {
  const { openDefault, openMenu } = useWhatsApp()
  const prefersReduced = useReducedMotion()
  const bgRef = useRef(null)
  const titleRef = useRef(null)

  useEffect(() => {
    if (prefersReduced) return

    // Subtle background parallax on scroll
    const onScroll = () => {
      if (bgRef.current) {
        const y = window.scrollY * 0.35
        bgRef.current.style.transform = `translateY(${y}px)`
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    // GSAP title stagger reveal
    const ctx = gsap.context(() => {
      if (!titleRef.current) return
      const spans = titleRef.current.querySelectorAll('.word')
      gsap.fromTo(
        spans,
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.08, duration: 1.1, ease: 'power4.out', delay: 0.4 }
      )
    })

    return () => {
      window.removeEventListener('scroll', onScroll)
      ctx.revert()
    }
  }, [prefersReduced])

  return (
    <section
      id="inicio"
      className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-espresso"
      aria-labelledby="hero-heading"
    >
      {/* ── Cinematic background ── */}
      <div ref={bgRef} className="absolute inset-0 will-change-transform">
        {/* Hero image from saboresdemama.com */}
        <img
          src="/assets/images/hero-bg.png"
          alt=""
          role="presentation"
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-25"
          loading="eager"
          decoding="sync"
          fetchPriority="high"
        />

        {/* Dark gradient base on top of image */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 30% 50%, rgba(107,45,30,0.7) 0%, transparent 60%),
              radial-gradient(ellipse at 75% 30%, rgba(200,135,58,0.2) 0%, transparent 50%),
              linear-gradient(160deg, rgba(10,6,4,0.92) 0%, rgba(26,11,6,0.85) 40%, rgba(44,24,16,0.88) 100%)
            `,
          }}
          aria-hidden="true"
        />

        {/* Grain overlay */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`,
          }}
          aria-hidden="true"
        />

        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 30%, rgba(10,6,4,0.75) 100%)',
          }}
          aria-hidden="true"
        />
      </div>

      {/* ── Smoke particles ── */}
      {!prefersReduced && (
        <div className="absolute bottom-0 left-1/4 w-32 h-48 pointer-events-none" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <SmokeParticle
              key={i}
              style={{ left: `${i * 30}%`, bottom: 0 }}
            />
          ))}
        </div>
      )}

      {/* ── Content ── */}
      <div className="relative z-10 container-site pt-28 pb-24 md:pt-36 md:pb-32">
        <div className="max-w-3xl">

          {/* Label */}
          <motion.div
            className="flex items-center gap-3 mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <span className="w-8 h-px bg-amber" aria-hidden="true" />
            <span className="text-amber text-xs font-semibold tracking-[0.2em] uppercase font-body">
              Sabores de Mamá · Comida Casera
            </span>
          </motion.div>

          {/* Main headline */}
          <h1
            id="hero-heading"
            ref={titleRef}
            className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-ivory leading-[1.0] tracking-tighter-display mb-6"
          >
            {['La comida', 'que', 'te lleva', 'al hogar.'].map((word, i) => (
              <span
                key={i}
                className={`word block ${i === 3 ? 'text-gradient-gold' : ''}`}
                style={{ opacity: prefersReduced ? 1 : 0 }}
              >
                {word}
              </span>
            ))}
          </h1>

          {/* Subline */}
          <motion.p
            className="font-body text-ivory/65 text-base md:text-lg max-w-md leading-relaxed mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
          >
            Recetas auténticas preparadas con ingredientes frescos y mucho cariño.
            Como las de siempre, solo que ahora llegan hasta tu puerta.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            className="flex flex-wrap gap-4 items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <button
              onClick={openDefault}
              className="btn-whatsapp text-sm px-7 py-3.5"
              aria-label="Hacer pedido por WhatsApp"
            >
              <WhatsAppSmall />
              Pedir ahora
            </button>
            <button
              onClick={openMenu}
              className="btn-outline-light text-sm"
              aria-label="Ver el menú completo"
            >
              Ver menú
            </button>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            className="flex flex-wrap gap-3 mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 0.8 }}
          >
            <FoodBadge emoji="🏠" label="Receta familiar"   delay={1.7} />
            <FoodBadge emoji="🌿" label="Ingredientes frescos" delay={1.85} />
            <FoodBadge emoji="⚡" label="Entrega rápida"    delay={2.0} />
          </motion.div>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <motion.div
        className="relative z-10 border-t border-ivory/10 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.0, duration: 0.8 }}
      >
        <div className="container-site py-6">
          <div className="grid grid-cols-3 gap-6 max-w-lg">
            {[
              { num: '2000+', label: 'Pedidos entregados' },
              { num: '4.9★',  label: 'Calificación promedio' },
              { num: '100%',  label: 'Hecho en casa' },
            ].map(({ num, label }) => (
              <div key={label} className="text-center sm:text-left">
                <p className="font-display text-2xl md:text-3xl text-amber font-bold">{num}</p>
                <p className="font-body text-ivory/50 text-xs mt-0.5 leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <ScrollIndicator />
    </section>
  )
}

function WhatsAppSmall() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}
