import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { fmtFecha } from '../../components/admin/adminHelpers'
import {
  getUsuarios,
  crearUsuario,
  editarUsuario,
  eliminarUsuario,
  cambiarMiPassword,
  getAdminUser,
  ApiError,
} from '../../lib/adminApi'

/**
 * AdminUsuarios · cuentas del sistema.
 *
 * Existe para poder ROTAR la cuenta de administración sin entrar a la base de
 * datos: crear el administrador nuevo, iniciar sesión con él y eliminar el
 * anterior. Antes la única forma de crear un admin era la variable ADMIN_EMAIL
 * del arranque, que además no cambia la contraseña de una cuenta existente.
 */
const inputCls =
  'w-full rounded-lg border border-espresso/15 bg-background px-3 py-2 text-sm text-espresso focus:outline-none focus:border-terracotta/60'

const PASSWORD_MIN = 12
const FORM_VACIO = { email: '', nombre: '', telefono: '', password: '', rol: 'cliente' }

export default function AdminUsuarios() {
  const navigate = useNavigate()
  const yo = getAdminUser()

  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState(FORM_VACIO)
  const [creando, setCreando] = useState(false)
  const [savingId, setSavingId] = useState(null)
  // Cambio de mi propia contraseña.
  const [mia, setMia] = useState({ actual: '', nueva: '' })
  const [savingMia, setSavingMia] = useState(false)

  const handle401 = useCallback(
    (err) => {
      if (err instanceof ApiError && err.status === 401) {
        navigate('/admin/login', { replace: true })
        return true
      }
      return false
    },
    [navigate]
  )

  const cargar = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getUsuarios()
      setUsuarios(data.usuarios || [])
    } catch (err) {
      if (!handle401(err)) setError(err.message || 'No se pudieron cargar las cuentas.')
    } finally {
      setLoading(false)
    }
  }, [handle401])

  useEffect(() => {
    cargar()
  }, [cargar])

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const admins = usuarios.filter((u) => u.rol === 'admin')

  const onCrear = async (e) => {
    e.preventDefault()
    setError('')
    setMsg('')
    if (form.password.length < PASSWORD_MIN) {
      setError(`La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`)
      return
    }
    setCreando(true)
    try {
      const { usuario } = await crearUsuario({
        email: form.email.trim(),
        password: form.password,
        nombre: form.nombre.trim() || null,
        telefono: form.telefono.trim() || null,
        rol: form.rol,
      })
      setForm(FORM_VACIO)
      setMsg(
        usuario.rol === 'admin'
          ? `Administrador ${usuario.email} creado. Cierra sesión y entra con él para poder eliminar el anterior.`
          : `Cuenta ${usuario.email} creada.`
      )
      await cargar()
    } catch (err) {
      if (!handle401(err)) setError(err.message || 'No se pudo crear la cuenta.')
    } finally {
      setCreando(false)
    }
  }

  const onCambiarRol = async (u) => {
    const nuevo = u.rol === 'admin' ? 'cliente' : 'admin'
    setError('')
    setMsg('')
    setSavingId(u.id)
    try {
      await editarUsuario(u.id, { rol: nuevo })
      setMsg(`${u.email} ahora es ${nuevo}.`)
      await cargar()
    } catch (err) {
      // El backend rechaza degradar al último administrador; el mensaje explica.
      if (!handle401(err)) setError(err.message || 'No se pudo cambiar el rol.')
    } finally {
      setSavingId(null)
    }
  }

  const onResetPassword = async (u) => {
    const nueva = window.prompt(
      `Nueva contraseña para ${u.email} (mínimo ${PASSWORD_MIN} caracteres).\n\n` +
        'Al cambiarla se cierran las sesiones abiertas de esa cuenta.'
    )
    if (nueva == null) return
    if (nueva.length < PASSWORD_MIN) {
      setError(`La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`)
      return
    }
    setError('')
    setMsg('')
    setSavingId(u.id)
    try {
      await editarUsuario(u.id, { password: nueva })
      setMsg(`Contraseña de ${u.email} actualizada. Sus sesiones abiertas se cerraron.`)
    } catch (err) {
      if (!handle401(err)) setError(err.message || 'No se pudo cambiar la contraseña.')
    } finally {
      setSavingId(null)
    }
  }

  const onEliminar = async (u) => {
    const aviso =
      u.pedidos > 0
        ? `\n\nTiene ${u.pedidos} pedido(s): NO se borran, solo dejan de estar asociados a la cuenta.`
        : ''
    if (!window.confirm(`¿Eliminar la cuenta ${u.email}?${aviso}`)) return
    setError('')
    setMsg('')
    setSavingId(u.id)
    try {
      await eliminarUsuario(u.id)
      setMsg(`Cuenta ${u.email} eliminada.`)
      await cargar()
    } catch (err) {
      if (!handle401(err)) setError(err.message || 'No se pudo eliminar la cuenta.')
    } finally {
      setSavingId(null)
    }
  }

  const onCambiarMia = async (e) => {
    e.preventDefault()
    setError('')
    setMsg('')
    if (mia.nueva.length < PASSWORD_MIN) {
      setError(`La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`)
      return
    }
    setSavingMia(true)
    try {
      await cambiarMiPassword({ password_actual: mia.actual, password: mia.nueva })
      setMia({ actual: '', nueva: '' })
      setMsg('Tu contraseña se cambió. Tus otras sesiones se cerraron; esta sigue abierta.')
    } catch (err) {
      if (!handle401(err)) setError(err.message || 'No se pudo cambiar tu contraseña.')
    } finally {
      setSavingMia(false)
    }
  }

  return (
    <AdminLayout title="Usuarios">
      {error && (
        <div className="mb-4 text-sm text-primary-700 bg-primary-50 border border-primary-200 rounded-lg px-4 py-2">
          {error}
        </div>
      )}
      {msg && (
        <div className="mb-4 text-sm text-espresso bg-amber/15 border border-amber/40 rounded-lg px-4 py-2">{msg}</div>
      )}

      <div className="grid lg:grid-cols-[380px_1fr] gap-6 items-start">
        <div className="space-y-6">
          {/* Crear cuenta */}
          <form onSubmit={onCrear} className="bg-background-surface border border-espresso/10 rounded-2xl p-5">
            <h2 className="font-display text-lg font-bold text-espresso mb-3">Crear cuenta</h2>

            <label className="block mb-3 text-sm">
              <span className="block text-espresso font-medium mb-1">Email *</span>
              <input
                type="email"
                className={inputCls}
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                required
              />
            </label>
            <label className="block mb-3 text-sm">
              <span className="block text-espresso font-medium mb-1">Nombre</span>
              <input className={inputCls} value={form.nombre} onChange={(e) => setField('nombre', e.target.value)} />
            </label>
            <label className="block mb-3 text-sm">
              <span className="block text-espresso font-medium mb-1">Teléfono</span>
              <input className={inputCls} value={form.telefono} onChange={(e) => setField('telefono', e.target.value)} />
            </label>
            <label className="block mb-3 text-sm">
              <span className="block text-espresso font-medium mb-1">
                Contraseña * <span className="text-warm-gray font-normal">(mín. {PASSWORD_MIN})</span>
              </span>
              <input
                type="password"
                className={inputCls}
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                minLength={PASSWORD_MIN}
                required
              />
            </label>
            <label className="block mb-4 text-sm">
              <span className="block text-espresso font-medium mb-1">Rol</span>
              <select className={inputCls} value={form.rol} onChange={(e) => setField('rol', e.target.value)}>
                <option value="cliente">Cliente (portal de clientes)</option>
                <option value="admin">Administrador (acceso al panel)</option>
              </select>
            </label>

            <button
              type="submit"
              disabled={creando}
              className="w-full bg-terracotta text-ivory font-semibold rounded-full px-5 py-2.5 text-sm hover:bg-ember transition-colors disabled:opacity-50"
            >
              {creando ? 'Creando…' : 'Crear cuenta'}
            </button>
          </form>

          {/* Mi contraseña */}
          <form onSubmit={onCambiarMia} className="bg-background-surface border border-espresso/10 rounded-2xl p-5">
            <h2 className="font-display text-lg font-bold text-espresso mb-1">Mi contraseña</h2>
            <p className="text-xs text-warm-gray mb-3">
              {yo?.email}. Al cambiarla se cierran tus otras sesiones; esta sigue abierta.
            </p>
            <label className="block mb-3 text-sm">
              <span className="block text-espresso font-medium mb-1">Contraseña actual *</span>
              <input
                type="password"
                className={inputCls}
                value={mia.actual}
                onChange={(e) => setMia((m) => ({ ...m, actual: e.target.value }))}
                autoComplete="current-password"
                required
              />
            </label>
            <label className="block mb-4 text-sm">
              <span className="block text-espresso font-medium mb-1">
                Contraseña nueva * <span className="text-warm-gray font-normal">(mín. {PASSWORD_MIN})</span>
              </span>
              <input
                type="password"
                className={inputCls}
                value={mia.nueva}
                onChange={(e) => setMia((m) => ({ ...m, nueva: e.target.value }))}
                minLength={PASSWORD_MIN}
                autoComplete="new-password"
                required
              />
            </label>
            <button
              type="submit"
              disabled={savingMia}
              className="w-full bg-espresso/[0.06] text-espresso border border-espresso/15 font-semibold rounded-full px-5 py-2.5 text-sm hover:bg-amber hover:border-amber transition-colors disabled:opacity-50"
            >
              {savingMia ? 'Guardando…' : 'Cambiar mi contraseña'}
            </button>
          </form>
        </div>

        {/* Listado */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-sm text-warm-gray">
              {loading ? 'Cargando…' : `${usuarios.length} cuentas · ${admins.length} administrador(es)`}
            </p>
          </div>

          {/* Cómo rotar: es el motivo por el que existe esta pantalla, así que va
              escrito acá y no en un documento que nadie abre. */}
          <div className="mb-4 text-xs text-warm-gray bg-espresso/[0.03] border border-espresso/10 rounded-xl px-4 py-3 leading-relaxed">
            <strong className="text-espresso">Para rotar el administrador:</strong> crea el nuevo con rol
            Administrador, cierra sesión, entra con él y recién entonces elimina el anterior. El sistema no
            permite quedarse sin administradores, así que el orden importa.
          </div>

          <div className="space-y-2">
            {usuarios.map((u) => {
              const esYo = yo?.id === u.id
              return (
                <div
                  key={u.id}
                  className="bg-background-surface border border-espresso/10 rounded-xl px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2"
                >
                  <div className="min-w-[220px] flex-1">
                    <p className="text-sm text-espresso font-medium break-all">
                      {u.email} {esYo && <span className="text-[11px] text-terracotta">(tu cuenta)</span>}
                    </p>
                    <p className="text-xs text-warm-gray">
                      {u.nombre || 'sin nombre'}
                      {u.telefono ? ` · ${u.telefono}` : ''} · desde {fmtFecha(u.created_at)}
                      {u.pedidos > 0 ? ` · ${u.pedidos} pedido(s)` : ''}
                    </p>
                  </div>

                  <span
                    className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      u.rol === 'admin'
                        ? 'bg-amber text-espresso'
                        : 'bg-espresso/[0.06] text-warm-gray border border-espresso/10'
                    }`}
                  >
                    {u.rol}
                  </span>

                  <div className="flex items-center gap-3 text-xs">
                    <button
                      onClick={() => onCambiarRol(u)}
                      disabled={savingId === u.id}
                      aria-label={`${u.rol === 'admin' ? 'Quitar admin a' : 'Hacer admin a'} ${u.email}`}
                      className="text-terracotta hover:underline disabled:opacity-50"
                    >
                      {u.rol === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                    </button>
                    <button
                      onClick={() => onResetPassword(u)}
                      disabled={savingId === u.id}
                      aria-label={`Cambiar contraseña de ${u.email}`}
                      className="text-terracotta hover:underline disabled:opacity-50"
                    >
                      Cambiar contraseña
                    </button>
                    <button
                      onClick={() => onEliminar(u)}
                      disabled={savingId === u.id}
                      aria-label={`Eliminar la cuenta ${u.email}`}
                      className="text-primary-700 hover:underline disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )
            })}
            {!loading && !usuarios.length && <p className="text-warm-gray text-sm">No hay cuentas.</p>}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
