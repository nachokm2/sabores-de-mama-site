import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { openChatBot } from '../../lib/openChatBot'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { imagenUrl } from '../../lib/publicApi'
import UtensilsIcon from '../ui/UtensilsIcon'
import PlayBadge from '../ui/PlayBadge'

// Imagen del inicio (subida al bucket), enlazada al reel de Instagram.
// Configurable por variable de entorno. imagenUrl() la sirve por el proxy firmado
// del backend (funciona aunque el bucket sea privado).
const HERO_IMG = import.meta.env.VITE_HERO_IMG || 'home/12.jpg'
const HERO_INSTAGRAM = 'https://www.instagram.com/reel/DUgNnE8ES0y/?igsh=MXh5YzdnZjMyODRlZA=='

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

/* ── Food badge ──────────────────────────────────────────────────────────── */
function FoodBadge({ emoji, label, delay }) {
  return (
    <motion.div
      className="glass flex items-center gap-2.5 rounded-full px-4 py-2.5 text-espresso"
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 300, damping: 25 }}
    >
      <span className="text-xl leading-none">{emoji}</span>
      <span className="font-body text-xs font-medium text-espresso/90 whitespace-nowrap">{label}</span>
    </motion.div>
  )
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function Hero() {
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
      className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-background"
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
          className="absolute inset-0 w-full h-full object-cover object-center opacity-[0.12]"
          loading="eager"
          decoding="sync"
          fetchPriority="high"
        />

        {/* Light cream wash on top of image (mantiene texto oscuro legible) */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 30% 50%, rgba(234,217,190,0.5) 0%, transparent 60%),
              radial-gradient(ellipse at 75% 30%, rgba(194,121,47,0.12) 0%, transparent 50%),
              linear-gradient(160deg, rgba(251,246,238,0.94) 0%, rgba(247,239,226,0.9) 40%, rgba(239,227,208,0.92) 100%)
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

        {/* Soft cream vignette (aclara los bordes en vez de oscurecerlos) */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 35%, rgba(251,246,238,0.65) 100%)',
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
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* Imagen enlazada a Instagram (izquierda en desktop; debajo del texto en móvil) */}
          <div className="order-2 lg:order-1">
            <a
              href={HERO_INSTAGRAM}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ver nuestro reel en Instagram"
              className="relative block group rounded-3xl overflow-hidden shadow-xl"
            >
              <img
                src={imagenUrl(HERO_IMG)}
                alt="Sabores de Mamá en Instagram"
                className="w-full object-cover aspect-[4/5] sm:aspect-video lg:aspect-[4/5] bg-espresso/5 transition-transform duration-500 group-hover:scale-[1.03]"
                loading="eager"
              />
              <PlayBadge />
            </a>
          </div>

          {/* Texto (derecha) */}
          <div className="order-1 lg:order-2 max-w-xl">

          {/* Label */}
          <motion.div
            className="flex items-center gap-3 mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <span className="w-8 h-px bg-accent-600" aria-hidden="true" />
            <span className="text-accent-600 text-xs font-semibold tracking-[0.2em] uppercase font-body">
              Sabores de Mamá
            </span>
          </motion.div>

          {/* Main headline */}
          <h1
            id="hero-heading"
            ref={titleRef}
            className="font-display text-4xl sm:text-5xl lg:text-6xl text-espresso leading-[1.03] tracking-tighter-display mb-6"
          >
            {['Volver a comer', 'casero,', 'sin tener que', 'cocinar.'].map((word, i) => (
              <span
                key={i}
                className={`word block ${i === 1 ? 'text-gradient-gold' : ''}`}
                style={{ opacity: prefersReduced ? 1 : 0 }}
              >
                {word}
              </span>
            ))}
          </h1>

          {/* Subline */}
          <motion.p
            className="font-body text-warm-gray text-base md:text-lg max-w-xl leading-relaxed mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
          >
            Preparamos comidas caseras personalizadas para que disfrutes de platos hechos
            como en casa, elaborados con ingredientes frescos y mucho cariño, sin tener que
            pasar horas en la cocina.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            className="flex flex-wrap gap-4 items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <button
              onClick={openChatBot}
              className="btn-primary text-sm px-7 py-3.5"
              aria-label="Pedir ahora"
            >
              <UtensilsIcon className="w-4 h-4" />
              Pedir ahora
            </button>
            <button
              onClick={openChatBot}
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
      </div>

      {/* ── Stats strip ── */}
      <motion.div
        className="relative z-10 border-t border-espresso/10 backdrop-blur-sm"
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
                <p className="font-display text-2xl md:text-3xl text-terracotta font-bold">{num}</p>
                <p className="font-body text-warm-gray text-xs mt-0.5 leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
