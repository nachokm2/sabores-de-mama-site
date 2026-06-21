import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import {
  getPlatos,
  crearPlato,
  editarPlato,
  eliminarPlato,
  ApiError,
} from '../../lib/adminApi'

const FORM_VACIO = {
  id: null,
  nombre: '',
  descripcion: '',
  categoria: '',
  activo: true,
  ingredientes: [{ nombre: '', cantidad: '', unidad: '' }],
}

const SIN_CATEGORIA = 'Sin categoría'

// Orden preferido de categorías (coincide con el menú público); el resto va
// alfabético y "Sin categoría" al final.
const ORDEN_CATEGORIAS = [
  'Carnes y Pollo',
  'Legumbres y Caldos',
  'Quiches y Tortillas',
  'Otros Platos',
  'Acompañamientos',
]

function agruparPorCategoria(platos) {
  const map = new Map()
  for (const p of platos) {
    const key = p.categoria || SIN_CATEGORIA
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(p)
  }
  const keys = Array.from(map.keys()).sort((a, b) => {
    if (a === SIN_CATEGORIA) return 1
    if (b === SIN_CATEGORIA) return -1
    const ia = ORDEN_CATEGORIAS.indexOf(a)
    const ib = ORDEN_CATEGORIAS.indexOf(b)
    if (ia !== -1 && ib !== -1) return ia - ib
    if (ia !== -1) return -1
    if (ib !== -1) return 1
    return a.localeCompare(b, 'es')
  })
  return keys.map((k) => [k, map.get(k)])
}

/**
 * AdminPlatos · CRUD de platos con formulario de ingredientes.
 */
export default function AdminPlatos() {
  const navigate = useNavigate()
  const [platos, setPlatos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(FORM_VACIO)
  // Categorías colapsadas (un set; por defecto todas abiertas).
  const [colapsadas, setColapsadas] = useState(() => new Set())

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
      const data = await getPlatos({ incluirInactivos: true })
      setPlatos(data.platos || [])
    } catch (err) {
      if (!handle401(err)) setError(err.message || 'No se pudieron cargar los platos.')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate])

  useEffect(() => {
    cargar()
  }, [cargar])

  const editando = form.id !== null

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const setIngrediente = (i, k, v) =>
    setForm((f) => ({
      ...f,
      ingredientes: f.ingredientes.map((ing, idx) => (idx === i ? { ...ing, [k]: v } : ing)),
    }))

  const addIngrediente = () =>
    setForm((f) => ({ ...f, ingredientes: [...f.ingredientes, { nombre: '', cantidad: '', unidad: '' }] }))

  const removeIngrediente = (i) =>
    setForm((f) => ({ ...f, ingredientes: f.ingredientes.filter((_, idx) => idx !== i) }))

  const resetForm = () => setForm(FORM_VACIO)

  const onEditar = (p) => {
    setForm({
      id: p.id,
      nombre: p.nombre || '',
      descripcion: p.descripcion || '',
      categoria: p.categoria || '',
      activo: p.activo,
      ingredientes:
        p.ingredientes && p.ingredientes.length
          ? p.ingredientes.map((i) => ({ nombre: i.nombre || '', cantidad: i.cantidad || '', unidad: i.unidad || '' }))
          : [{ nombre: '', cantidad: '', unidad: '' }],
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onGuardar = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMsg('')
    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      categoria: form.categoria.trim() || null,
      activo: form.activo,
      ingredientes: form.ingredientes
        .filter((i) => i.nombre.trim())
        .map((i) => ({ nombre: i.nombre.trim(), cantidad: i.cantidad.trim() || null, unidad: i.unidad.trim() || null })),
    }
    try {
      if (editando) {
        await editarPlato(form.id, payload)
        setMsg(`Plato "${payload.nombre}" actualizado.`)
      } else {
        await crearPlato(payload)
        setMsg(`Plato "${payload.nombre}" creado.`)
      }
      resetForm()
      await cargar()
    } catch (err) {
      if (!handle401(err)) setError(err.message || 'No se pudo guardar el plato.')
    } finally {
      setSaving(false)
    }
  }

  const onEliminar = async (p) => {
    if (!window.confirm(`¿Desactivar el plato "${p.nombre}"?`)) return
    setError('')
    setMsg('')
    try {
      await eliminarPlato(p.id)
      setMsg(`Plato "${p.nombre}" desactivado.`)
      await cargar()
    } catch (err) {
      if (!handle401(err)) setError(err.message || 'No se pudo eliminar el plato.')
    }
  }

  const grupos = useMemo(() => agruparPorCategoria(platos), [platos])
  const categoriasExistentes = useMemo(
    () => Array.from(new Set(platos.map((p) => p.categoria).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es')),
    [platos]
  )

  const toggleCat = (cat) =>
    setColapsadas((prev) => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  const expandirTodo = () => setColapsadas(new Set())
  const contraerTodo = () => setColapsadas(new Set(grupos.map(([cat]) => cat)))

  const inputCls =
    'w-full rounded-xl border border-espresso/15 bg-background px-3 py-2 text-sm text-espresso focus:outline-none focus:border-terracotta/60'
  // Variante SIN `w-full` para las filas de ingredientes: el ancho lo controla
  // flex (evita el conflicto w-full vs w-20/flex-1 que colapsaba el campo nombre).
  const ingInputCls =
    'rounded-xl border border-espresso/15 bg-background px-3 py-2 text-sm text-espresso focus:outline-none focus:border-terracotta/60'

  return (
    <AdminLayout title="Platos">
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
            {editando ? `Editar plato #${form.id}` : 'Nuevo plato'}
          </h2>

          <label className="block mb-3 text-sm">
            <span className="block text-espresso font-medium mb-1">Nombre *</span>
            <input className={inputCls} value={form.nombre} onChange={(e) => setField('nombre', e.target.value)} required />
          </label>

          <label className="block mb-3 text-sm">
            <span className="block text-espresso font-medium mb-1">Categoría</span>
            <input
              className={inputCls}
              value={form.categoria}
              onChange={(e) => setField('categoria', e.target.value)}
              placeholder="Carnes y Pollo, Quiches…"
              list="categorias-existentes"
            />
            <datalist id="categorias-existentes">
              {categoriasExistentes.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>

          <label className="block mb-3 text-sm">
            <span className="block text-espresso font-medium mb-1">Descripción</span>
            <textarea className={inputCls} rows={2} value={form.descripcion} onChange={(e) => setField('descripcion', e.target.value)} />
          </label>

          <label className="flex items-center gap-2 mb-4 text-sm text-espresso">
            <input type="checkbox" checked={form.activo} onChange={(e) => setField('activo', e.target.checked)} />
            Activo (visible en el menú público)
          </label>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-espresso font-medium text-sm">Ingredientes</span>
              <button type="button" onClick={addIngrediente} className="text-xs text-terracotta hover:underline">
                + Añadir
              </button>
            </div>
            <div className="space-y-2">
              {form.ingredientes.map((ing, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className={ingInputCls + ' flex-1 min-w-0'}
                    placeholder="Ingrediente"
                    value={ing.nombre}
                    onChange={(e) => setIngrediente(i, 'nombre', e.target.value)}
                  />
                  <input
                    className={ingInputCls + ' w-20 shrink-0'}
                    placeholder="Cant."
                    value={ing.cantidad}
                    onChange={(e) => setIngrediente(i, 'cantidad', e.target.value)}
                  />
                  <input
                    className={ingInputCls + ' w-24 shrink-0'}
                    placeholder="Unidad"
                    value={ing.unidad}
                    onChange={(e) => setIngrediente(i, 'unidad', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeIngrediente(i)}
                    className="text-warm-gray hover:text-primary-600 px-1"
                    aria-label="Quitar ingrediente"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-terracotta text-ivory font-semibold rounded-full px-5 py-2.5 text-sm hover:bg-ember transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear plato'}
            </button>
            {editando && (
              <button type="button" onClick={resetForm} className="text-sm text-warm-gray hover:text-espresso px-3">
                Cancelar
              </button>
            )}
          </div>
        </form>

        {/* Lista agrupada por categoría (desplegables) */}
        <div className="lg:col-span-3">
          {loading ? (
            <p className="text-warm-gray text-sm">Cargando…</p>
          ) : platos.length === 0 ? (
            <p className="text-warm-gray text-sm">Aún no hay platos.</p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-warm-gray">
                  {platos.length} plato{platos.length !== 1 ? 's' : ''} en {grupos.length} categoría
                  {grupos.length !== 1 ? 's' : ''}
                </p>
                <div className="flex gap-3 text-xs">
                  <button onClick={expandirTodo} className="text-terracotta hover:underline">
                    Expandir todo
                  </button>
                  <button onClick={contraerTodo} className="text-warm-gray hover:text-espresso">
                    Contraer todo
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {grupos.map(([cat, items]) => {
                  const isOpen = !colapsadas.has(cat)
                  const inactivos = items.filter((p) => !p.activo).length
                  return (
                    <div key={cat} className="bg-background-surface border border-espresso/10 rounded-2xl overflow-hidden">
                      {/* Cabecera desplegable */}
                      <button
                        onClick={() => toggleCat(cat)}
                        aria-expanded={isOpen}
                        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-espresso/[0.03] transition-colors"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span
                            className={`text-accent-600 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                            aria-hidden="true"
                          >
                            ▸
                          </span>
                          <span className="font-display font-semibold text-espresso truncate">{cat}</span>
                          <span className="text-xs text-warm-gray bg-espresso/[0.06] px-2 py-0.5 rounded-full">
                            {items.length}
                          </span>
                          {inactivos > 0 && (
                            <span className="text-2xs text-warm-gray">
                              · {inactivos} inactivo{inactivos !== 1 ? 's' : ''}
                            </span>
                          )}
                        </span>
                      </button>

                      {/* Platos de la categoría */}
                      {isOpen && (
                        <div className="px-3 pb-3 pt-1 space-y-2 border-t border-espresso/10">
                          {items.map((p) => (
                            <div
                              key={p.id}
                              className="bg-background border border-espresso/8 rounded-xl p-3 flex items-start justify-between gap-4"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-display font-semibold text-espresso text-sm">{p.nombre}</h3>
                                  {!p.activo && (
                                    <span className="text-2xs text-warm-gray bg-espresso/[0.06] px-2 py-0.5 rounded-full">
                                      Inactivo
                                    </span>
                                  )}
                                </div>
                                {p.descripcion && <p className="text-xs text-warm-gray mt-1">{p.descripcion}</p>}
                                {p.ingredientes?.length > 0 && (
                                  <p className="text-2xs text-warm-gray mt-1">
                                    {p.ingredientes.length} ingrediente{p.ingredientes.length !== 1 ? 's' : ''}:{' '}
                                    {p.ingredientes.map((i) => i.nombre).join(', ')}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <button onClick={() => onEditar(p)} className="text-sm text-terracotta hover:underline">
                                  Editar
                                </button>
                                {p.activo && (
                                  <button
                                    onClick={() => onEliminar(p)}
                                    className="text-2xs text-warm-gray hover:text-primary-600"
                                  >
                                    Desactivar
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
