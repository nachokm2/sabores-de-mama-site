import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { fmtCLP } from '../../components/admin/adminHelpers'
import {
  getProductosHornear,
  guardarProductoHornear,
  eliminarProductoHornear,
  subirImagen,
  ApiError,
} from '../../lib/adminApi'
import { imagenUrl } from '../../lib/publicApi'

const VACIO = {
  id: null,
  nombre: '',
  precio: '',
  formato: '',
  porciones: '',
  descripcion: '',
  imagen: '',
  activo: true,
}

/**
 * AdminProductos · CRUD de los productos "para hornear en casa" (add-on del
 * flujo de pedido): foto, precio, nombre, formato/cantidad, porciones, etc.
 */
export default function AdminProductos() {
  const navigate = useNavigate()
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [form, setForm] = useState(VACIO)
  const editando = form.id != null

  const handle401 = (err) => {
    if (err instanceof ApiError && err.status === 401) {
      navigate('/admin/login', { replace: true })
      return true
    }
    return false
  }

  const cargar = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getProductosHornear({ todos: true })
      setProductos(data.productos || [])
    } catch (err) {
      if (!handle401(err)) setError(err.message || 'No se pudieron cargar los productos.')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate])

  useEffect(() => {
    cargar()
  }, [cargar])

  const setCampo = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const resetForm = () => setForm(VACIO)

  const onSubirFoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // permite re-subir el mismo archivo
    if (!file) return
    setSubiendo(true)
    setError('')
    try {
      const url = await subirImagen(file, 'productos-hornear')
      setCampo('imagen', url)
      setMsg('Foto subida.')
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        setError('La subida de imágenes no está configurada en el servidor. Pega una URL a mano por ahora.')
      } else if (!handle401(err)) {
        setError(err.message || 'No se pudo subir la imagen.')
      }
    } finally {
      setSubiendo(false)
    }
  }

  const onGuardar = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMsg('')
    try {
      await guardarProductoHornear({
        id: form.id || undefined,
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        precio: Number(form.precio) || 0,
        imagen: form.imagen.trim() || null,
        formato: form.formato.trim() || null,
        porciones: form.porciones.trim() || null,
        activo: form.activo,
      })
      setMsg(`Producto "${form.nombre.trim()}" ${editando ? 'actualizado' : 'creado'}.`)
      resetForm()
      await cargar()
    } catch (err) {
      if (!handle401(err)) setError(err.message || 'No se pudo guardar el producto.')
    } finally {
      setSaving(false)
    }
  }

  const onEditar = (p) => {
    setForm({
      id: p.id,
      nombre: p.nombre || '',
      precio: p.precio ?? '',
      formato: p.formato || '',
      porciones: p.porciones || '',
      descripcion: p.descripcion || '',
      imagen: p.imagen || '',
      activo: p.activo,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onEliminar = async (p) => {
    if (!window.confirm(`¿Eliminar el producto "${p.nombre}"?`)) return
    setError('')
    setMsg('')
    try {
      await eliminarProductoHornear(p.id)
      setProductos((prev) => prev.filter((x) => x.id !== p.id))
      if (form.id === p.id) resetForm()
      setMsg(`Producto "${p.nombre}" eliminado.`)
    } catch (err) {
      if (!handle401(err)) setError(err.message || 'No se pudo eliminar el producto.')
    }
  }

  const inputCls =
    'w-full rounded-xl border border-espresso/15 bg-background px-3 py-2 text-sm text-espresso focus:outline-none focus:border-terracotta/60'

  return (
    <AdminLayout title="Productos para hornear">
      {msg && (
        <div className="mb-4 text-sm text-[#15803D] bg-[#15803D]/10 border border-[#15803D]/30 rounded-lg px-4 py-2">
          {msg}
        </div>
      )}
      {error && (
        <div className="mb-4 text-sm text-primary-700 bg-primary-50 border border-primary-200 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Formulario */}
        <form
          onSubmit={onGuardar}
          className="lg:col-span-2 bg-background-surface border border-espresso/10 rounded-2xl p-5 h-fit"
        >
          <h2 className="font-display text-lg font-bold text-espresso mb-4">
            {editando ? `Editar producto #${form.id}` : 'Nuevo producto'}
          </h2>

          <label className="block mb-3 text-sm">
            <span className="block text-espresso font-medium mb-1">Nombre *</span>
            <input className={inputCls} value={form.nombre} onChange={(e) => setCampo('nombre', e.target.value)} required />
          </label>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <label className="block text-sm">
              <span className="block text-espresso font-medium mb-1">Precio ($)</span>
              <input type="number" min={0} className={inputCls} value={form.precio} onChange={(e) => setCampo('precio', e.target.value)} />
            </label>
            <label className="block text-sm">
              <span className="block text-espresso font-medium mb-1">Cantidad / formato</span>
              <input className={inputCls} value={form.formato} onChange={(e) => setCampo('formato', e.target.value)} placeholder="Molde 20 cm" />
            </label>
          </div>

          <label className="block mb-3 text-sm">
            <span className="block text-espresso font-medium mb-1">Porciones</span>
            <input className={inputCls} value={form.porciones} onChange={(e) => setCampo('porciones', e.target.value)} placeholder="8 a 10 porciones" />
          </label>

          <label className="block mb-3 text-sm">
            <span className="block text-espresso font-medium mb-1">Descripción</span>
            <textarea className={inputCls} rows={2} value={form.descripcion} onChange={(e) => setCampo('descripcion', e.target.value)} />
          </label>

          <div className="block mb-3 text-sm">
            <span className="block text-espresso font-medium mb-1">Foto</span>
            <div className="flex items-center gap-2 mb-2">
              <label className={`cursor-pointer text-xs font-semibold rounded-full px-3 py-2 border transition-colors ${subiendo ? 'opacity-50 cursor-wait' : ''} border-terracotta/40 text-terracotta hover:bg-amber/10`}>
                {subiendo ? 'Subiendo…' : '⬆ Subir foto'}
                <input type="file" accept="image/*" className="hidden" disabled={subiendo} onChange={onSubirFoto} />
              </label>
              <span className="text-xs text-warm-gray">o pega una URL:</span>
            </div>
            <input className={inputCls} value={form.imagen} onChange={(e) => setCampo('imagen', e.target.value)} placeholder="https://… o /assets/images/…" />
          </div>
          {form.imagen.trim() && (
            <img
              src={imagenUrl(form.imagen)}
              alt="Vista previa"
              className="w-full h-32 object-cover rounded-xl border border-espresso/10 mb-3"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          )}

          <label className="flex items-center gap-2 mb-4 text-sm text-espresso">
            <input type="checkbox" checked={form.activo} onChange={(e) => setCampo('activo', e.target.checked)} />
            Activo (visible en el flujo de pedido)
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-terracotta text-ivory font-semibold rounded-full px-5 py-2.5 text-sm hover:bg-ember transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear producto'}
            </button>
            {editando && (
              <button type="button" onClick={resetForm} className="text-sm text-warm-gray hover:text-espresso px-3">
                Cancelar
              </button>
            )}
          </div>
        </form>

        {/* Lista */}
        <div className="lg:col-span-3">
          {loading ? (
            <p className="px-5 py-8 text-center text-warm-gray text-sm">Cargando…</p>
          ) : productos.length === 0 ? (
            <p className="px-5 py-8 text-center text-warm-gray text-sm bg-background-surface border border-espresso/10 rounded-2xl">
              Aún no hay productos. Crea el primero con el formulario.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {productos.map((p) => (
                <div key={p.id} className="bg-background-surface border border-espresso/10 rounded-2xl overflow-hidden flex flex-col">
                  <div className="h-28 bg-espresso/[0.04] flex items-center justify-center overflow-hidden">
                    {p.imagen ? (
                      <img src={imagenUrl(p.imagen)} alt={p.nombre} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    ) : (
                      <span className="text-3xl" aria-hidden="true">🧁</span>
                    )}
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-espresso text-sm font-bold leading-tight">{p.nombre}</h3>
                      <span className="text-sm font-bold text-terracotta whitespace-nowrap">{fmtCLP(p.precio)}</span>
                    </div>
                    {(p.formato || p.porciones) && (
                      <p className="text-2xs text-warm-gray mt-0.5">
                        {[p.formato, p.porciones].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {p.descripcion && <p className="text-xs text-warm-gray mt-1 line-clamp-2">{p.descripcion}</p>}
                    <div className="flex items-center gap-3 mt-3 pt-2 border-t border-espresso/5">
                      {!p.activo && <span className="text-2xs text-warm-gray bg-espresso/[0.06] px-2 py-0.5 rounded-full">Inactivo</span>}
                      <button onClick={() => onEditar(p)} className="text-xs font-medium text-terracotta hover:underline ml-auto">Editar</button>
                      <button onClick={() => onEliminar(p)} className="text-xs text-warm-gray hover:text-primary-600">Eliminar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
