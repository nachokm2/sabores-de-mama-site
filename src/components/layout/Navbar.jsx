import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { openChatBot } from '../../lib/openChatBot'

// R-02 · Navegación principal (orden exacto solicitado).
// El sitio es multipágina (React Router): cada ítem apunta a su propia ruta.
const NAV_LINKS = [
  { label: 'Inicio',               href: '/' },
  { label: 'Meal Prep',            href: '/meal-prep-en-casa' },
  { label: 'Cocinera a Domicilio', href: '/cocinera' },
  { label: 'Healthy',              href: '/healthy' },
  { label: 'Nosotros',             href: '/nosotros' },
  { label: 'Contacto',             href: '/contacto' },
]

const LogoIcon = () => (
  <img
    src="/assets/images/logo.jpg"
    alt="Sabores de Mamá"
    width={40}
    height={40}
    className="w-10 h-10 rounded-full object-cover ring-1 ring-terracotta/30"
    loading="eager"
    decoding="sync"
  />
)

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Cerrar el menú móvil al cambiar de ruta o de ancla.
  // El scroll (top o hacia el ancla con smooth scroll) lo gestiona ScrollManager
  // en App.jsx, por lo que aquí ya no forzamos scrollTo(top).
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname, location.hash])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const isActive = (href) => {
    const [path, hash] = href.split('#')
    if (path === '/') return location.pathname === '/' && !location.hash
    // Varias entradas comparten /menu: se distinguen por el hash de la URL.
    if (hash) return location.pathname.startsWith(path) && location.hash === `#${hash}`
    return location.pathname.startsWith(path)
  }

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-[var(--z-navbar)] transition-all duration-500 ease-[var(--ease-out-expo)] ${
          scrolled
            ? 'bg-background/90 backdrop-blur-md shadow-[0_4px_30px_rgba(42,28,18,0.10)] border-b border-espresso/5'
            : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
      >
        <nav
          className="container-site flex items-center justify-between h-16 md:h-20"
          role="navigation"
          aria-label="Navegación principal"
        >
          {/* Logo */}
          <motion.div whileHover={{ scale: 1.03 }}>
            <Link to="/" className="flex items-center gap-3 group">
              <LogoIcon />
              <div className="flex flex-col leading-none">
                <span className="font-display text-espresso text-base font-bold tracking-tight">
                  Sabores de
                </span>
                <span className="font-display text-terracotta text-lg font-bold tracking-tight -mt-0.5">
                  Mamá
                </span>
              </div>
            </Link>
          </motion.div>

          {/* Desktop nav */}
          <ul className="hidden lg:flex items-center gap-4 xl:gap-6" role="list">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className={`nav-link whitespace-nowrap ${isActive(link.href) ? 'text-terracotta' : ''}`}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop CTA */}
          {/* "Mi cuenta" se oculta a propósito: el portal es solo para clientes
              exclusivos que reciben el enlace directo (/cuenta). */}
          <div className="hidden lg:flex items-center gap-4">
            <motion.button
              onClick={openChatBot}
              className="bg-terracotta text-ivory text-sm font-medium px-5 py-2.5 rounded-full hover:bg-ember transition-colors shadow-[0_2px_12px_rgba(174,76,41,0.3)]"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              aria-label="Pedir ahora"
            >
              Pedir ahora
            </motion.button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden flex flex-col gap-1.5 p-2 rounded-lg"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="block h-0.5 w-6 bg-espresso origin-center"
                animate={
                  menuOpen
                    ? i === 0 ? { rotate: 45, y: 8 }
                    : i === 1 ? { opacity: 0 }
                    : { rotate: -45, y: -8 }
                    : { rotate: 0, y: 0, opacity: 1 }
                }
                transition={{ duration: 0.3 }}
              />
            ))}
          </button>
        </nav>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            className="fixed inset-0 z-[calc(var(--z-navbar)-1)] bg-background/98 backdrop-blur-xl flex flex-col"
            initial={{ opacity: 0, y: '-100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '-100%' }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
          >
            <div className="pt-24 px-8 pb-10 flex flex-col gap-8 overflow-y-auto h-full">
              <ul className="flex flex-col gap-5" role="list">
                {NAV_LINKS.map((link, i) => (
                  <motion.li
                    key={link.href}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.07 }}
                  >
                    <Link
                      to={link.href}
                      className={`font-display text-3xl sm:text-4xl transition-colors duration-200 ${
                        isActive(link.href) ? 'text-terracotta' : 'text-espresso hover:text-terracotta'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="pt-4 border-t border-espresso/10"
              >
                <button
                  onClick={openChatBot}
                  className="bg-terracotta text-ivory font-semibold px-7 py-4 rounded-full w-full text-center text-lg"
                >
                  Pedir ahora
                </button>
                {/* "Mi cuenta" oculto: el portal es solo para clientes exclusivos
                    que reciben el enlace directo (/cuenta). */}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
