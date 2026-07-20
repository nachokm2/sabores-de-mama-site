import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import SectionLabel from './SectionLabel'
import PlayBadge from './PlayBadge'
import { imagenUrl } from '../../lib/publicApi'

/**
 * Cinematic page hero for inner pages.
 * Mantiene el look espresso/amber. Si se pasa `video` o `image` (key/URL del
 * bucket), usa un layout de 2 columnas: el medio a la izquierda y el texto a la
 * derecha (en móvil se apilan con el texto primero).
 */
export default function PageHero({
  label,
  title,
  titleHighlight,
  subtitle,
  breadcrumb,        // [{ label, href }]
  align = 'center',  // 'center' | 'left'
  video,             // key/URL de video del bucket (opcional)
  image,             // key/URL de imagen del bucket (opcional; alternativa al video)
  mediaHref,         // si se pasa, el medio (imagen/video) enlaza a esta URL (nueva pestaña)
  children,
}) {
  const hasVideo = Boolean(video)
  const hasImage = !hasVideo && Boolean(image)
  const hasMedia = hasVideo || hasImage
  const isCenter = align === 'center' && !hasMedia
  const videoRef = useRef(null)

  // Fuerza `muted` (React no siempre aplica el atributo) para permitir autoplay.
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.muted = true
    try {
      const p = v.play()
      if (p && typeof p.catch === 'function') p.catch(() => {})
    } catch {
      /* jsdom / autoplay bloqueado */
    }
  }, [])

  const contenido = (
    <>
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
                <span className="text-accent-600" aria-current="page">{crumb.label}</span>
              ) : (
                <Link to={crumb.href} className="hover:text-espresso transition-colors duration-200">
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
        className={`font-display ${
          hasMedia ? 'text-4xl sm:text-5xl lg:text-6xl' : 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl'
        } text-espresso leading-[1.05] tracking-tighter-display mb-5 ${isCenter ? 'mx-auto max-w-3xl' : 'max-w-2xl'}`}
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
          className={`font-body text-warm-gray text-base md:text-lg leading-relaxed ${isCenter ? 'max-w-xl mx-auto' : 'max-w-md'}`}
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
    </>
  )

  return (
    <section
      className={`relative flex flex-col overflow-hidden bg-background ${
        hasMedia ? 'min-h-[60vh] justify-center pt-28 pb-14' : 'min-h-[52vh] justify-end pt-20'
      }`}
      aria-label={`Página: ${label || title}`}
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 60%, rgba(181,81,46,0.14) 0%, transparent 55%),
            radial-gradient(ellipse at 80% 20%, rgba(194,121,47,0.14) 0%, transparent 50%),
            linear-gradient(160deg, #FFFCF7 0%, #FBF6EE 50%, #F4EADB 100%)
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
        style={{ background: 'linear-gradient(to top, rgba(251,246,238,0.7), transparent)' }}
        aria-hidden="true"
      />

      <div className="container-site relative z-10 pb-14 md:pb-18">
        {hasMedia ? (
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            {/* Medio (izquierda en desktop; debajo del texto en móvil) */}
            <div className="order-2 lg:order-1">
              {(() => {
                const medio = hasVideo ? (
                  <video
                    ref={videoRef}
                    src={imagenUrl(video)}
                    className="w-full rounded-3xl shadow-xl object-cover aspect-[4/5] sm:aspect-video lg:aspect-[4/5] bg-espresso/5"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={imagenUrl(image)}
                    alt=""
                    className="w-full rounded-3xl shadow-xl object-cover aspect-[4/5] sm:aspect-video lg:aspect-[4/5] bg-espresso/5 transition-transform duration-500 group-hover:scale-[1.03]"
                    loading="eager"
                  />
                )
                return mediaHref ? (
                  <a
                    href={mediaHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Ver nuestro reel en Instagram"
                    className="relative block group rounded-3xl overflow-hidden shadow-xl"
                  >
                    {medio}
                    <PlayBadge />
                  </a>
                ) : (
                  medio
                )
              })()}
            </div>
            {/* Texto (derecha) */}
            <div className="order-1 lg:order-2">{contenido}</div>
          </div>
        ) : (
          <div className={isCenter ? 'text-center' : ''}>{contenido}</div>
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
