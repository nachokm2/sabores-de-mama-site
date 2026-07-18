import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import SectionLabel from '../ui/SectionLabel'
import { openChatBot } from '../../lib/openChatBot'

export default function VideoSection() {
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted]     = useState(true)
  const videoRef              = useRef(null)

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      v.play().then(() => setPlaying(true)).catch(() => {})
    } else {
      v.pause()
      setPlaying(false)
    }
  }

  const toggleMute = (e) => {
    e.stopPropagation()
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }

  const handlePause = () => setPlaying(false)

  return (
    <section
      className="relative section-padding overflow-hidden"
      aria-labelledby="video-heading"
    >
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(160deg, #F7EFE2 0%, #FBF6EE 50%, #EFE3D0 100%)' }}
        aria-hidden="true"
      />
      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[800px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(194,121,47,0.14) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="container-site relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <SectionLabel light>Detrás del sabor</SectionLabel>
          <h2 id="video-heading" className="section-title-light mt-4">
            La cocina donde
            <br />
            <span className="text-gradient-gold">todo sucede.</span>
          </h2>
        </div>

        {/* Layout: video + features side by side on desktop */}
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 max-w-5xl mx-auto">

          {/* ── Phone-style vertical video player ── */}
          <motion.div
            className="flex-shrink-0 w-full max-w-[300px] mx-auto lg:mx-0"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.9, ease: [0.19, 1, 0.22, 1] }}
          >
            {/* Decorative glow behind phone */}
            <div
              className="absolute -inset-8 rounded-[40px] pointer-events-none"
              style={{ background: 'radial-gradient(ellipse, rgba(200,135,58,0.12) 0%, transparent 70%)' }}
              aria-hidden="true"
            />

            {/* Phone frame */}
            <div
              className="relative rounded-[28px] overflow-hidden shadow-2xl ring-1 ring-espresso/10 cursor-pointer"
              style={{ aspectRatio: '9/16' }}
              onClick={togglePlay}
            >
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                preload="metadata"
                playsInline
                loop
                muted
                onPause={handlePause}
                aria-label="Video de nuestra cocina"
              >
                <source src="/assets/videos/cocina.mp4" type="video/mp4" />
              </video>

              {/* Play overlay — only shown when paused */}
              {!playing && (
                <motion.div
                  className="absolute inset-0 flex flex-col items-center justify-center bg-espresso/50 backdrop-blur-[2px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  aria-hidden="true"
                >
                  <span className="absolute w-20 h-20 rounded-full border-2 border-ivory/25 animate-ping" />
                  <span className="w-16 h-16 rounded-full bg-ivory/15 backdrop-blur-sm border border-ivory/30 flex items-center justify-center">
                    <svg className="w-6 h-6 text-ivory ml-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </span>
                  <p className="mt-4 font-body text-ivory/70 text-xs tracking-widest uppercase">Ver video</p>
                </motion.div>
              )}

              {/* Bottom bar: label + mute button */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-espresso/80 to-transparent flex items-end justify-between">
                <div>
                  <p className="font-display text-ivory text-sm font-semibold">Sabores de Mamá</p>
                  <p className="font-body text-ivory/50 text-xs">Cocina casera chilena</p>
                </div>
                <button
                  onClick={toggleMute}
                  className="w-8 h-8 rounded-full bg-ivory/15 backdrop-blur-sm border border-ivory/20 flex items-center justify-center text-ivory hover:bg-ivory/25 transition-colors flex-shrink-0"
                  aria-label={muted ? 'Activar sonido' : 'Silenciar'}
                >
                  {muted ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          {/* ── Right: features + CTA ── */}
          <div className="flex-1 text-center lg:text-left">
            <div className="space-y-6 mb-8">
              {[
                { icon: '🌿', title: 'Ingredientes frescos', text: 'Ingredientes que tú nos envías, frescos. Nada de congelados ni conservantes.' },
                { icon: '🔥', title: 'Cocción lenta', text: 'Tiempo y fuego bajo. El secreto del sabor de casa.' },
                { icon: '❤️', title: 'Hecho con cariño', text: 'Cada plato preparado con dedicación y recetas de familia.' },
              ].map((feat, i) => (
                <motion.div
                  key={feat.title}
                  className="flex items-start gap-4 text-left"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.12 }}
                >
                  <span className="text-2xl flex-shrink-0 mt-0.5" aria-hidden="true">{feat.icon}</span>
                  <div>
                    <h3 className="font-display text-espresso text-base font-semibold mb-0.5">{feat.title}</h3>
                    <p className="font-body text-warm-gray text-sm leading-relaxed">{feat.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.button
              onClick={openChatBot}
              className="btn-primary-dark text-sm"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Quiero probarlo ahora
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  )
}
