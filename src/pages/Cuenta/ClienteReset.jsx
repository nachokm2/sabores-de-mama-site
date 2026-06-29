import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import CuentaShell, { cuentaInputCls } from '../../components/cuenta/CuentaShell'
import { resetPassword, ApiError } from '../../lib/clienteApi'

export default function ClienteReset() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [listo, setListo] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (password !== password2) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await resetPassword(token, password)
      setListo(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cambiar la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <CuentaShell label="Portal de clientes" title="Nueva contraseña">
      {!token ? (
        <div className="bg-background-surface border border-espresso/10 rounded-2xl p-6 text-center">
          <p className="font-body text-warm-gray text-sm">Enlace inválido. Solicita uno nuevo desde "¿Olvidaste tu contraseña?".</p>
          <Link to="/cuenta/recuperar" className="inline-block mt-4 text-terracotta font-semibold text-sm hover:underline">Recuperar contraseña</Link>
        </div>
      ) : listo ? (
        <div className="bg-background-surface border border-espresso/10 rounded-2xl p-6 text-center">
          <p className="text-3xl mb-2" aria-hidden="true">✅</p>
          <p className="font-body text-espresso text-sm">Tu contraseña fue actualizada.</p>
          <Link to="/cuenta/login" className="inline-block mt-5 bg-terracotta text-ivory font-semibold rounded-full px-5 py-2.5 text-sm hover:bg-ember transition-colors">
            Iniciar sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="bg-background-surface border border-espresso/10 rounded-2xl p-6">
          <label className="block mb-3 text-sm">
            <span className="block text-espresso font-medium mb-1.5">Nueva contraseña <span className="text-warm-gray font-normal">(mín. 6)</span></span>
            <input type="password" className={cuentaInputCls} value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
          </label>
          <label className="block mb-4 text-sm">
            <span className="block text-espresso font-medium mb-1.5">Repite la contraseña</span>
            <input type="password" className={cuentaInputCls} value={password2} onChange={(e) => setPassword2(e.target.value)} minLength={6} required />
          </label>
          {error && <p className="mb-3 text-sm text-primary-700 bg-primary-50 border border-primary-200 rounded-lg px-4 py-2">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-terracotta text-ivory font-semibold rounded-full px-5 py-3 text-sm hover:bg-ember transition-colors disabled:opacity-50">
            {loading ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </form>
      )}
    </CuentaShell>
  )
}
