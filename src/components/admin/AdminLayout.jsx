import { NavLink, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { getAdminUser, logout } from '../../lib/adminApi'

const NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/admin/pedidos', label: 'Pedidos', icon: '🧾' },
  { to: '/admin/platos', label: 'Platos', icon: '🍽️' },
  { to: '/admin/cupos', label: 'Cupos', icon: '📅' },
  { to: '/admin/comunas', label: 'Comunas', icon: '📍' },
]

/**
 * Layout compartido del panel admin: barra superior con navegación, usuario
 * actual y cierre de sesión. Envuelve el contenido de cada página protegida.
 */
export default function AdminLayout({ title, actions, children }) {
  const navigate = useNavigate()
  const admin = getAdminUser()

  const handleLogout = () => {
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background text-espresso">
      <Helmet>
        <title>{title ? `${title} · ` : ''}Admin · Sabores de Mamá</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Topbar */}
      <header className="sticky top-0 z-40 bg-background-warm/95 backdrop-blur border-b border-espresso/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-bold text-terracotta">
              Sabores de Mamá
            </span>
            <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wider text-accent-600 bg-amber/10 px-2 py-0.5 rounded-full">
              Admin
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline text-sm text-warm-gray">
              {admin?.nombre || admin?.email}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-espresso/80 hover:text-terracotta border border-espresso/15 hover:border-terracotta/50 rounded-full px-4 py-1.5 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto" aria-label="Navegación admin">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-terracotta text-terracotta'
                    : 'border-transparent text-warm-gray hover:text-espresso'
                }`
              }
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-espresso">{title}</h1>
          {actions}
        </div>
        {children}
      </main>
    </div>
  )
}
