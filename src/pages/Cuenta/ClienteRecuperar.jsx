import { useState } from 'react'
import { Link } from 'react-router-dom'
import CuentaShell, { cuentaInputCls } from '../../components/cuenta/CuentaShell'
import { recuperar, ApiError } from '../../lib/clienteApi'

export default function ClienteRecuperar() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [enviado, setEnviado] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await recuperar(email.trim())
      setEnviado(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo enviar el correo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <CuentaShell label="Portal de clientes" title="Recuperar contraseña" subtitle="Te enviaremos un enlace para crear una nueva.">
      {enviado ? (
        <div className="bg-background-surface border border-espresso/10 rounded-2xl p-6 text-center">
          <p className="text-3xl mb-2" aria-hidden="true">📧</p>
          <p className="font-body text-espresso text-sm">
            Si el email está registrado, te enviamos las instrucciones. Revisa tu bandeja (y spam).
          </p>
          <Link to="/cuenta/login" className="inline-block mt-5 text-terracotta font-semibold text-sm hover:underline">
            Volver a iniciar sesión
          </Link>
        </div>
      ) : (
        <>
          <form onSubmit={onSubmit} className="bg-background-surface border border-espresso/10 rounded-2xl p-6">
            <label className="block mb-4 text-sm">
              <span className="block text-espresso font-medium mb-1.5">Email</span>
              <input type="email" className={cuentaInputCls} value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            {error && <p className="mb-3 text-sm text-primary-700 bg-primary-50 border border-primary-200 rounded-lg px-4 py-2">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-terracotta text-ivory font-semibold rounded-full px-5 py-3 text-sm hover:bg-ember transition-colors disabled:opacity-50">
              {loading ? 'Enviando…' : 'Enviar enlace'}
            </button>
          </form>
          <p className="text-center text-sm text-warm-gray mt-5">
            <Link to="/cuenta/login" className="text-terracotta font-semibold hover:underline">Volver a iniciar sesión</Link>
          </p>
        </>
      )}
    </CuentaShell>
  )
}
