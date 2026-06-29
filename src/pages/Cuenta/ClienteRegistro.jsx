import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CuentaShell, { cuentaInputCls } from '../../components/cuenta/CuentaShell'
import { registro, ApiError } from '../../lib/clienteApi'

export default function ClienteRegistro() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await registro({
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        telefono: form.telefono.trim() || null,
        password: form.password,
      })
      navigate('/cuenta', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear la cuenta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <CuentaShell label="Portal de clientes" title="Crea tu cuenta" subtitle="Para agendar y seguir tus servicios de Cocinera a Domicilio.">
      <form onSubmit={onSubmit} className="bg-background-surface border border-espresso/10 rounded-2xl p-6">
        <label className="block mb-3 text-sm">
          <span className="block text-espresso font-medium mb-1.5">Nombre</span>
          <input className={cuentaInputCls} value={form.nombre} onChange={(e) => set('nombre', e.target.value)} required />
        </label>
        <label className="block mb-3 text-sm">
          <span className="block text-espresso font-medium mb-1.5">Email</span>
          <input type="email" className={cuentaInputCls} value={form.email} onChange={(e) => set('email', e.target.value)} required />
        </label>
        <label className="block mb-3 text-sm">
          <span className="block text-espresso font-medium mb-1.5">Teléfono <span className="text-warm-gray font-normal">(opcional)</span></span>
          <input className={cuentaInputCls} value={form.telefono} onChange={(e) => set('telefono', e.target.value)} placeholder="+56 9 ..." />
        </label>
        <label className="block mb-4 text-sm">
          <span className="block text-espresso font-medium mb-1.5">Contraseña <span className="text-warm-gray font-normal">(mín. 6)</span></span>
          <input type="password" className={cuentaInputCls} value={form.password} onChange={(e) => set('password', e.target.value)} minLength={6} required />
        </label>
        {error && <p className="mb-3 text-sm text-primary-700 bg-primary-50 border border-primary-200 rounded-lg px-4 py-2">{error}</p>}
        <button type="submit" disabled={loading} className="w-full bg-terracotta text-ivory font-semibold rounded-full px-5 py-3 text-sm hover:bg-ember transition-colors disabled:opacity-50">
          {loading ? 'Creando…' : 'Crear cuenta'}
        </button>
      </form>
      <p className="text-center text-sm text-warm-gray mt-5">
        ¿Ya tienes cuenta?{' '}
        <Link to="/cuenta/login" className="text-terracotta font-semibold hover:underline">Inicia sesión</Link>
      </p>
    </CuentaShell>
  )
}
