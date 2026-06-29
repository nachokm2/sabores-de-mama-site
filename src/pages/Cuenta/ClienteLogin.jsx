import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import CuentaShell, { cuentaInputCls } from '../../components/cuenta/CuentaShell'
import { login, ApiError } from '../../lib/clienteApi'

export default function ClienteLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const destino = location.state?.from || '/cuenta'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email.trim(), password)
      navigate(destino, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <CuentaShell label="Portal de clientes" title="Inicia sesión" subtitle="Gestiona tus reservas de Cocinera a Domicilio.">
      <form onSubmit={onSubmit} className="bg-background-surface border border-espresso/10 rounded-2xl p-6">
        <label className="block mb-3 text-sm">
          <span className="block text-espresso font-medium mb-1.5">Email</span>
          <input type="email" className={cuentaInputCls} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="block mb-2 text-sm">
          <span className="block text-espresso font-medium mb-1.5">Contraseña</span>
          <input type="password" className={cuentaInputCls} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <div className="text-right mb-4">
          <Link to="/cuenta/recuperar" className="text-xs text-terracotta hover:underline">¿Olvidaste tu contraseña?</Link>
        </div>
        {error && <p className="mb-3 text-sm text-primary-700 bg-primary-50 border border-primary-200 rounded-lg px-4 py-2">{error}</p>}
        <button type="submit" disabled={loading} className="w-full bg-terracotta text-ivory font-semibold rounded-full px-5 py-3 text-sm hover:bg-ember transition-colors disabled:opacity-50">
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
      <p className="text-center text-sm text-warm-gray mt-5">
        ¿No tienes cuenta?{' '}
        <Link to="/cuenta/registro" className="text-terracotta font-semibold hover:underline">Regístrate</Link>
      </p>
    </CuentaShell>
  )
}
