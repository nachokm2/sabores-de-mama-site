import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TESTIMONIALS } from '../../data/testimonials'
import SectionLabel from '../ui/SectionLabel'
import StarRating from '../ui/StarRating'
import { useScrollReveal } from '../../hooks/useScrollAnimation'

function Avatar({ initials, gradient }) {
  return (
    <div
      className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}
      aria-hidden="true"
    >
      <span className="font-display text-ivory text-sm font-bold">{initials}</span>
    </div>
  )
}

function TestimonialCard({ testimonial, index }) {
  return (
    <motion.article
      className="card-testimonial"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.19, 1, 0.22, 1] }}
      aria-label={`Testimonio de ${testimonial.name}`}
    >
      {/* Stars */}
      <StarRating rating={testimonial.rating} className="mb-4" />

      {/* Quote */}
      <blockquote className="mb-5">
        <p className="font-body text-espresso text-sm leading-relaxed">
          "{testimonial.text}"
        </p>
      </blockquote>

      {/* Author */}
      <div className="flex items-center gap-3">
        <Avatar initials={testimonial.avatar} gradient={testimonial.avatarGradient} />
        <div>
          <p className="font-body text-espresso text-sm font-semibold">{testimonial.name}</p>
          <p className="font-body text-warm-gray text-xs">{testimonial.role}</p>
        </div>
        <span className="ml-auto text-warm-gray text-xs font-body">
          📍 {testimonial.location}
        </span>
      </div>
    </motion.article>
  )
}

/* ── Featured big card ───────────────────────────────────────────────────── */
function FeaturedCard({ testimonial }) {
  return (
    <motion.div
      className="relative rounded-3xl bg-espresso p-8 md:p-10 overflow-hidden"
      initial={{ opacity: 0, scale: 0.96 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
    >
      {/* Background glow */}
      <div
        className="absolute -top-20 -right-20 w-60 h-60 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(200,135,58,0.15) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      {/* Quote mark */}
      <span
        className="absolute top-6 right-8 font-display text-[120px] text-amber/10 leading-none select-none"
        aria-hidden="true"
      >
        "
      </span>

      <StarRating rating={testimonial.rating} className="mb-6" />

      <blockquote className="mb-8">
        <p className="font-display text-ivory text-xl md:text-2xl leading-relaxed italic">
          "{testimonial.text}"
        </p>
      </blockquote>

      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.avatarGradient} flex items-center justify-center`}
        >
          <span className="font-display text-ivory font-bold">{testimonial.avatar}</span>
        </div>
        <div>
          <p className="font-body text-ivory font-semibold">{testimonial.name}</p>
          <p className="font-body text-warm-gray text-sm">{testimonial.role} · {testimonial.location}</p>
        </div>
      </div>
    </motion.div>
  )
}

export default function Testimonials() {
  const [page, setPage] = useState(0)
  const headerRef = useScrollReveal({ selector: '.testi-head', stagger: 0.1, y: 30 })
  const featured = TESTIMONIALS.filter((t) => t.featured)
  const regular  = TESTIMONIALS.filter((t) => !t.featured)

  const PER_PAGE = 3
  const pages    = Math.ceil(regular.length / PER_PAGE)
  const visible  = regular.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE)

  return (
    <section
      className="section-padding bg-cream overflow-hidden"
      aria-labelledby="testimonials-heading"
    >
      <div className="container-site">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-14">
          <SectionLabel>Lo que dicen</SectionLabel>
          <h2
            id="testimonials-heading"
            className="section-title text-espresso mt-4 testi-head"
          >
            Familias que ya
            <br />
            <em className="not-italic text-amber">saben el secreto.</em>
          </h2>
        </div>

        {/* Featured testimonials */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {featured.slice(0, 2).map((t) => (
            <FeaturedCard key={t.id} testimonial={t} />
          ))}
        </div>

        {/* Regular grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {visible.map((t, i) => (
              <TestimonialCard key={t.id} testimonial={t} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: pages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                aria-label={`Página ${i + 1}`}
                aria-current={i === page ? 'page' : undefined}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === page ? 'bg-amber w-6' : 'bg-warm-gray/40 hover:bg-amber/50'
                }`}
              />
            ))}
          </div>
        )}

        {/* Trust bar */}
        <motion.div
          className="mt-14 flex flex-wrap justify-center items-center gap-6 md:gap-10 text-warm-gray text-xs font-body"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          {[
            { icon: '⭐', text: '4.9 / 5 estrellas promedio' },
            { icon: '🛡️', text: 'Pago 100% seguro' },
            { icon: '🔄', text: 'Satisfacción garantizada' },
            { icon: '📦', text: 'Empaque premium' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <span aria-hidden="true">{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
