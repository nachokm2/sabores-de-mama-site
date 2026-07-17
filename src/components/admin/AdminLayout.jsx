import { NavLink, Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { getAdminUser, logout } from '../../lib/adminApi'

const SERVICIO_LABEL = { meal_prep: 'Meal Prep', cocinera: 'Cocinera a Domicilio' }

// Construye la navegación según el servicio. "Healthy" sólo aplica a Meal Prep.
function buildNav(servicio) {
  const base = `/admin/${servicio}`
  return [
    { to: `${base}/dashboard`, label: 'Dashboard', icon: '📊' },
    { to: `${base}/pedidos`, label: 'Reservas', icon: '🧾' },
    { to: `${base}/platos`, label: 'Platos', icon: '🍽️' },
    ...(servicio === 'meal_prep' ? [{ to: `${base}/productos`, label: 'Healthy', icon: '🧁' }] : []),
    { to: `${base}/cupos`, label: 'Cupos', icon: '📅' },
    { to: `${base}/comunas`, label: 'Comunas', icon: '📍' },
    { to: `${base}/ajustes`, label: 'Ajustes', icon: '⚙️' },
  ]
}

/**
 * Layout compartido del panel admin, ahora con CONTEXTO DE SERVICIO: la barra de
 * navegación se arma según `/admin/:servicio/...` (Cocinera no tiene "Hornear").
 */
export default function AdminLayout({ title, actions, children }) {
  const navigate = useNavigate()
  const { servicio } = useParams()
  const admin = getAdminUser()

  // Servicio inválido → volver al hub a elegir.
  if (servicio && !SERVICIO_LABEL[servicio]) {
    return <Navigate to="/admin/hub" replace />
  }

  const nav = buildNav(servicio)

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
            <span className="font-display text-lg font-bold text-terracotta">Sabores de Mamá</span>
            <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wider text-accent-600 bg-amber/10 px-2 py-0.5 rounded-full">
              {SERVICIO_LABEL[servicio] || 'Admin'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/admin/hub" className="text-sm text-warm-gray hover:text-terracotta transition-colors">
              ⇄ Cambiar servicio
            </Link>
            <span className="hidden md:inline text-sm text-warm-gray">{admin?.nombre || admin?.email}</span>
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
          {nav.map((item) => (
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
