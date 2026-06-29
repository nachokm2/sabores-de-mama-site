import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { getAdminUser, logout } from '../../lib/adminApi'

const SERVICIOS = [
  {
    to: '/admin/meal_prep/dashboard',
    label: 'Meal Prep',
    icon: '📦',
    desc: 'Preparaciones selladas al vacío. Gestiona reservas, cupos, platos y horneados.',
    gradient: 'from-espresso via-bark to-terracotta',
  },
  {
    to: '/admin/cocinera/dashboard',
    label: 'Cocinera a Domicilio',
    icon: '🏠',
    desc: 'Servicio en el hogar del cliente. Gestiona reservas, cupos, platos y comunas.',
    gradient: 'from-bark via-ember to-amber',
  },
]

export default function AdminHub() {
  const navigate = useNavigate()
  const admin = getAdminUser()

  const salir = () => {
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background text-espresso">
      <Helmet>
        <title>Panel · Sabores de Mamá</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <header className="border-b border-espresso/10 bg-background-warm/95">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <span className="font-display text-lg font-bold text-terracotta">Sabores de Mamá · Admin</span>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-warm-gray">{admin?.nombre || admin?.email}</span>
            <button
              onClick={salir}
              className="text-sm font-medium text-espresso/80 hover:text-terracotta border border-espresso/15 hover:border-terracotta/50 rounded-full px-4 py-1.5 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-espresso">¿Qué servicio quieres administrar?</h1>
          <p className="font-body text-warm-gray text-sm mt-3">Elige uno para entrar a su panel.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {SERVICIOS.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="group rounded-3xl overflow-hidden ring-1 ring-espresso/10 hover:ring-terracotta/40 hover:shadow-xl transition-all duration-300 bg-background-surface"
            >
              <div className={`h-32 bg-gradient-to-br ${s.gradient} flex items-center justify-center`}>
                <span className="text-5xl" aria-hidden="true">{s.icon}</span>
              </div>
              <div className="p-6">
                <h2 className="font-display text-xl font-bold text-espresso group-hover:text-terracotta transition-colors">{s.label}</h2>
                <p className="font-body text-warm-gray text-sm mt-2 leading-relaxed">{s.desc}</p>
                <span className="inline-block mt-4 text-sm font-semibold text-terracotta">Administrar →</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
