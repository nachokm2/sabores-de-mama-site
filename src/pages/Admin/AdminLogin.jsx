import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { login, isTokenValid, ApiError } from '../../lib/adminApi'

/**
 * AdminLogin · formulario email + password.
 * Al autenticar, guarda el JWT en localStorage y redirige al dashboard
 * (o a la ruta protegida desde la que se llegó).
 */
export default function AdminLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const destino = location.state?.from || '/admin/hub'

  // Si ya hay sesión válida, saltar el login.
  if (isTokenValid()) {
    return <Navigate to={destino} replace />
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email.trim(), password)
      navigate(destino, { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) {
        setError('No se pudo conectar con el servidor. ¿Está el backend en línea?')
      } else {
        setError(err.message || 'No se pudo iniciar sesión.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <Helmet>
        <title>Acceso Admin · Sabores de Mamá</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="font-display text-2xl font-bold text-terracotta">Sabores de Mamá</p>
          <p className="font-body text-sm text-warm-gray mt-1">Panel de administración</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-background-surface border border-espresso/10 rounded-2xl p-7 shadow-[0_10px_40px_rgba(42,28,18,0.08)]"
        >
          <h1 className="font-display text-xl font-bold text-espresso mb-5">Iniciar sesión</h1>

          {error && (
            <div
              role="alert"
              className="mb-4 text-sm text-primary-700 bg-primary-50 border border-primary-200 rounded-lg px-3 py-2"
            >
              {error}
            </div>
          )}

          <label className="block mb-4">
            <span className="block text-sm font-medium text-espresso mb-1.5">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              className="w-full rounded-xl border border-espresso/15 bg-background px-3.5 py-2.5 text-sm text-espresso placeholder:text-warm-gray/60 focus:outline-none focus:border-terracotta/60"
              placeholder="admin@saboresdemama.com"
            />
          </label>

          <label className="block mb-6">
            <span className="block text-sm font-medium text-espresso mb-1.5">Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-espresso/15 bg-background px-3.5 py-2.5 text-sm text-espresso placeholder:text-warm-gray/60 focus:outline-none focus:border-terracotta/60"
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-terracotta text-ivory font-semibold rounded-full py-3 hover:bg-ember transition-colors disabled:opacity-50"
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
