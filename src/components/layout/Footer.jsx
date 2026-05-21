import { motion } from 'framer-motion'
import { SITE, getWhatsAppLink } from '../../data/siteConfig'

const FOOTER_LINKS = [
  { label: 'Inicio',    href: '#inicio' },
  { label: 'Menú',      href: '#menu' },
  { label: 'Nosotros',  href: '#nosotros' },
  { label: 'Galería',   href: '#galeria' },
  { label: 'Contacto',  href: '#contacto' },
]

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
)

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.54V6.78a4.85 4.85 0 01-1.02-.09z"/>
  </svg>
)

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer
      className="bg-espresso text-ivory relative overflow-hidden"
      role="contentinfo"
      id="contacto"
    >
      {/* Amber glow top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(200,135,58,0.6), transparent)',
        }}
        aria-hidden="true"
      />

      <div className="container-site py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <span className="font-display text-2xl font-bold text-ivory">
                Sabores de <span className="text-amber">Mamá</span>
              </span>
            </div>
            <p className="text-warm-gray text-sm leading-relaxed max-w-xs">
              Comida casera hecha con amor, ingredientes frescos y recetas de familia.
              Te devolvemos el sabor del hogar, donde quieras que estés.
            </p>
            <div className="flex items-center gap-4 mt-6">
              {[
                { href: SITE.social.instagram, icon: <InstagramIcon />, label: 'Instagram' },
                { href: SITE.social.facebook,  icon: <FacebookIcon />,  label: 'Facebook' },
                { href: SITE.social.tiktok,    icon: <TikTokIcon />,    label: 'TikTok' },
              ].map(({ href, icon, label }) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-full border border-ivory/15 flex items-center justify-center text-warm-gray hover:text-amber hover:border-amber/60 transition-colors duration-200"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Nav */}
          <nav aria-label="Links del footer">
            <h3 className="text-xs font-semibold tracking-[0.18em] uppercase text-amber mb-5">
              Navegación
            </h3>
            <ul className="flex flex-col gap-3" role="list">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-warm-gray text-sm hover:text-ivory transition-colors duration-200 link-underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-semibold tracking-[0.18em] uppercase text-amber mb-5">
              Contacto
            </h3>
            <ul className="flex flex-col gap-3 text-warm-gray text-sm" role="list">
              <li>
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#25D366] transition-colors duration-200 flex items-center gap-2"
                >
                  <span aria-hidden="true">💬</span> WhatsApp
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${SITE.email}`}
                  className="hover:text-ivory transition-colors duration-200"
                >
                  {SITE.email}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden="true">📍</span>
                <span>{SITE.address}</span>
              </li>
              <li className="pt-2 border-t border-ivory/10">
                <p className="text-xs leading-relaxed">
                  {SITE.hours.weekdays}
                </p>
                <p className="text-xs mt-1 leading-relaxed">
                  {SITE.hours.weekend}
                </p>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 border-t border-ivory/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-warm-gray text-xs">
          <p>© {year} {SITE.name}. Todos los derechos reservados.</p>
          <p className="text-center sm:text-right">
            Hecho con <span className="text-amber">❤️</span> en Santiago, Chile
          </p>
        </div>
      </div>
    </footer>
  )
}
