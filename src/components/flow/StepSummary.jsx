import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BakingAddon from './BakingAddon'
import AdicionalesMealPrep from './AdicionalesMealPrep'
import EnsaladasAddon from './EnsaladasAddon'
import TerminosModal from './TerminosModal'
import { createPedido, ApiError } from '../../lib/publicApi'
import { trackEvent } from '../../lib/analytics'
import { fmtCLP } from '../../lib/flowConfig'
import { TERMINOS_RUTA, TERMINOS_VERSION } from '../../data/terminos'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function fmtFecha(fecha) {
  if (!fecha) return '—'
  return new Date(String(fecha).slice(0, 10) + 'T00:00:00').toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function Fila({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-warm-gray flex-shrink-0">{label}</span>
      <span className="text-espresso text-right">{children}</span>
    </div>
  )
}

/**
 * Paso 6 · Resumen + datos personales + add-on de hornear + confirmar pedido.
 * Al confirmar hace POST /api/pedidos y navega a /pago/:pedidoId.
 */
export default function StepSummary({ data, update, onBack }) {
  const navigate = useNavigate()
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [modalTerminos, setModalTerminos] = useState(false)

  const emailValido = EMAIL_RE.test(data.email || '')
  // La aceptación de los Términos y Condiciones es parte de la validación, no un
  // aviso: sin ella el botón "Confirmar Pedido" queda deshabilitado y `confirmar`
  // corta antes del POST.
  //
  // Y la aceptación, a su vez, exige haberlos LEÍDO: la casilla no se puede
  // marcar hasta recorrer el documento. Sin eso, "acepto" es un clic sobre algo
  // que el cliente nunca vio, que es justo lo que pasaba con los horarios de
  // entrega cuando la regla vivía escondida en un correo posterior al pedido.
  const terminosLeidos = data.terminosLeidos === true
  const aceptaTerminos = data.aceptaTerminos === true
  const valido =
    (data.nombre || '').trim() !== '' && emailValido && (data.telefono || '').trim() !== '' && aceptaTerminos

  /** El cliente llegó al final del documento en el modal. */
  const confirmarLectura = () => {
    setModalTerminos(false)
    if (!terminosLeidos) update({ terminosLeidos: true, terminosLeidosEn: new Date().toISOString() })
  }

  /**
   * Marca/desmarca la aceptación y guarda el INSTANTE en que se marcó. Ese
   * momento —no el del envío— es el que viaja al backend como fecha de
   * aceptación; al desmarcar se borra para que no quede una hora colgada de una
   * aceptación que ya no existe.
   *
   * La lectura NO se borra al desmarcar: leer ya ocurrió, y obligar a releer
   * para volver a marcar la casilla castigaría un clic accidental.
   */
  const toggleTerminos = (checked) => {
    if (!terminosLeidos) return
    update({
      aceptaTerminos: checked,
      terminosAceptadosEn: checked ? new Date().toISOString() : null,
      terminosVersion: checked ? TERMINOS_VERSION : null,
    })
  }

  const platosDetalle = data.platosDetalle || []
  const restricciones = data.restricciones || []
  const baking = data.productosHornearDetalle || []
  const adicionales = data.adicionales || []
  // Las ensaladas viajan dentro de `adicionales` con clave `ensalada-*`; se
  // separan sólo para mostrarlas en su propia línea del resumen.
  const esEnsalada = (a) => String(a.clave || '').startsWith('ensalada-')
  const adicionalesServicios = adicionales.filter((a) => !esEnsalada(a))
  const ensaladasSel = adicionales.filter(esEnsalada)
  const esMealPrep = (data.servicio || 'meal_prep') === 'meal_prep'

  const confirmar = async () => {
    setTouched(true)
    if (!valido) return
    setSubmitting(true)
    setError('')
    try {
      const pedido = await createPedido({
        nombre: data.nombre.trim(),
        email: data.email.trim(),
        telefono: data.telefono.trim(),
        direccion: data.direccion,
        comuna: data.comuna,
        fecha_entrega: data.fecha_entrega,
        // Servicio parametrizado por el flujo (meal_prep | cocinera).
        servicio: data.servicio || 'meal_prep',
        platos: platosDetalle.map((p) => ({ id: p.id, nombre: p.nombre, acompanamiento: p.acompanamiento || null })),
        restricciones,
        observaciones: data.observaciones || null,
        tipo_entrega: data.tipo_entrega,
        costo_despacho: data.costo_despacho,
        total: data.total,
        productos_hornear: baking.map((p) => ({ id: p.id, nombre: p.nombre, precio: p.precio })),
        // Servicios adicionales elegidos (Meal Prep).
        adicionales: adicionales.map((a) => ({ clave: a.clave, nombre: a.nombre, precio: a.precio })),
        // Lista de compras editable (flujo Cocinera); vacío en Meal Prep.
        lista_compras: data.lista_compras || [],
        // Nº de comensales (flujo Cocinera); null en Meal Prep.
        personas: data.personas || null,
        // Respaldo de la aceptación de los Términos y Condiciones. La versión
        // acompaña siempre a la aceptación: si mañana cambian las condiciones,
        // este pedido sigue mostrando cuáles aceptó su cliente.
        acepta_terminos: true,
        terminos_version: data.terminosVersion || TERMINOS_VERSION,
        terminos_aceptados_en: data.terminosAceptadosEn || new Date().toISOString(),
        // Cuándo terminó de LEERLOS, que es lo que precede y sostiene al "acepto".
        terminos_leidos_en: data.terminosLeidosEn || null,
      })
      // Conversión: pedido creado con éxito. GTM escucha 'pedido_confirmado' y
      // lo envía a GA4 (donde se marca como evento clave / conversión).
      trackEvent('pedido_confirmado', {
        pedido_id: pedido.id,
        servicio: data.servicio || 'meal_prep',
        value: Number(pedido.total ?? data.total) || 0,
        currency: 'CLP',
      })
      // replace: true → evita volver atrás al resumen una vez en la página de pago.
      // El token va en la URL (no solo en el state) para que la página siga
      // mostrando el monto si el cliente la recarga o la guarda en favoritos.
      const t = pedido.resumen_token ? `?t=${encodeURIComponent(pedido.resumen_token)}` : ''
      navigate(`/pago/${pedido.id}${t}`, { replace: true, state: { total: pedido.total } })
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('La fecha elegida acaba de llenarse. Vuelve al paso de Fecha y elige otra.')
      } else if (err instanceof ApiError && err.status === 0) {
        setError('No pudimos conectar con el servidor. Intenta nuevamente.')
      } else {
        setError(err.message || 'No se pudo confirmar el pedido.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls =
    'w-full rounded-xl border border-espresso/15 bg-background px-3.5 py-2.5 text-sm text-espresso focus:outline-none focus:border-terracotta/60'

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-espresso mb-1">Revisa tu pedido</h2>
      <p className="text-warm-gray text-sm mb-6">Confirma los detalles antes de finalizar.</p>

      {/* Resumen */}
      <div className="rounded-2xl bg-background-warm border border-espresso/10 p-4 mb-5">
        <Fila label="Fecha de entrega">
          <span className="capitalize">{fmtFecha(data.fecha_entrega)}</span>
        </Fila>
        <Fila label="Entrega">{data.tipo_entrega === 'retiro' ? 'Retiro' : 'Delivery'}</Fila>
        <Fila label="Dirección">
          {data.direccion}
          {data.comuna ? `, ${data.comuna}` : ''}
        </Fila>
        <div className="py-1.5 text-sm">
          <span className="text-warm-gray block mb-1">Platos ({platosDetalle.length})</span>
          <ul className="list-disc pl-5 text-espresso">
            {platosDetalle.map((p) => (
              <li key={p.id}>
                {p.nombre}
                {p.acompanamiento ? <span className="text-warm-gray"> (con {p.acompanamiento.nombre})</span> : ''}
              </li>
            ))}
          </ul>
        </div>
        {data.personas > 0 && (
          <Fila label="Personas">
            {data.personas} {data.personas === 1 ? 'persona' : 'personas'}
          </Fila>
        )}
        {(data.lista_compras || []).length > 0 && (
          <Fila label="Lista de compras">{data.lista_compras.length} ingredientes</Fila>
        )}
        {restricciones.length > 0 && <Fila label="Restricciones">{restricciones.join(', ')}</Fila>}
        {data.observaciones && <Fila label="Observaciones">{data.observaciones}</Fila>}
        {baking.length > 0 && <Fila label="Para hornear">{baking.map((p) => p.nombre).join(', ')}</Fila>}
        {adicionalesServicios.length > 0 && (
          <Fila label="Servicios adicionales">{adicionalesServicios.map((a) => a.nombre).join(', ')}</Fila>
        )}
        {ensaladasSel.length > 0 && (
          <Fila label="Ensaladas">
            {ensaladasSel.map((a) => a.nombre.replace(/^Ensalada:\s*/, '')).join(', ')}
          </Fila>
        )}
        <div className="flex justify-between font-bold text-espresso mt-2 pt-2 border-t border-espresso/10">
          <span>Total</span>
          <span className="text-terracotta">{fmtCLP(data.total)}</span>
        </div>
      </div>

      {/* Servicios adicionales (sólo Meal Prep) + add-on de hornear (ANTES del botón confirmar) */}
      {esMealPrep && (
        <div className="mb-5">
          <AdicionalesMealPrep data={data} update={update} />
        </div>
      )}
      <div className="mb-5">
        <EnsaladasAddon data={data} update={update} />
      </div>
      <div className="mb-5">
        <BakingAddon data={data} update={update} />
      </div>

      {/* Datos personales */}
      <h3 className="font-display text-base font-bold text-espresso mb-3">Tus datos</h3>
      <div className="space-y-3 mb-6">
        <label className="block text-sm">
          <span className="block text-espresso font-medium mb-1.5">Nombre *</span>
          <input className={inputCls} value={data.nombre || ''} onChange={(e) => update({ nombre: e.target.value })} />
          {touched && (data.nombre || '').trim() === '' && (
            <span className="text-xs text-primary-600 mt-1 block">El nombre es obligatorio.</span>
          )}
        </label>
        <label className="block text-sm">
          <span className="block text-espresso font-medium mb-1.5">Email *</span>
          <input
            type="email"
            className={inputCls}
            value={data.email || ''}
            onChange={(e) => update({ email: e.target.value })}
            placeholder="tucorreo@ejemplo.com"
          />
          {touched && !emailValido && (
            <span className="text-xs text-primary-600 mt-1 block">Ingresa un email válido.</span>
          )}
        </label>
        <label className="block text-sm">
          <span className="block text-espresso font-medium mb-1.5">Teléfono *</span>
          <input
            type="tel"
            className={inputCls}
            value={data.telefono || ''}
            onChange={(e) => update({ telefono: e.target.value })}
            placeholder="+56 9 ..."
          />
          {touched && (data.telefono || '').trim() === '' && (
            <span className="text-xs text-primary-600 mt-1 block">El teléfono es obligatorio.</span>
          )}
        </label>
      </div>

      {/* Términos y Condiciones · lectura y aceptación obligatorias ANTES de
          enviar. Son dos pasos y en este orden a propósito: primero se lee el
          documento (modal, sin salir del flujo) y sólo entonces se habilita la
          casilla. Aceptar algo que no se puede haber leído no es aceptar. */}
      <div className="mb-5">
        <div
          className={`rounded-xl border px-4 py-3.5 mb-2.5 transition-colors ${
            terminosLeidos ? 'border-espresso/15 bg-background-surface' : 'border-terracotta/50 bg-amber/[0.07]'
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-lg leading-none mt-0.5 flex-shrink-0" aria-hidden="true">
              {terminosLeidos ? '✅' : '📄'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-espresso">
                {terminosLeidos ? 'Términos y Condiciones leídos' : 'Antes de enviar, lee los Términos y Condiciones'}
              </p>
              <p id="terminos-ayuda" className="text-xs text-warm-gray mt-0.5 leading-relaxed">
                Incluyen cómo funcionan los horarios de entrega: nos comprometemos con la fecha, no con una hora
                exacta.
              </p>
              <button
                type="button"
                onClick={() => setModalTerminos(true)}
                className={`mt-2.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  terminosLeidos
                    ? 'text-terracotta hover:text-ember underline underline-offset-2'
                    : 'bg-terracotta text-ivory hover:bg-ember'
                }`}
              >
                {terminosLeidos ? 'Volver a leerlos' : 'Leer los Términos y Condiciones'}
              </button>
            </div>
          </div>
        </div>

        <label
          className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 transition-colors ${
            !terminosLeidos
              ? 'border-espresso/10 bg-espresso/[0.03] cursor-not-allowed'
              : aceptaTerminos
                ? 'border-terracotta bg-amber/10 cursor-pointer'
                : 'border-espresso/15 bg-background-surface hover:border-terracotta/40 cursor-pointer'
          }`}
        >
          <input
            type="checkbox"
            checked={aceptaTerminos}
            disabled={!terminosLeidos}
            onChange={(e) => toggleTerminos(e.target.checked)}
            className="accent-terracotta w-4 h-4 mt-0.5 flex-shrink-0 disabled:cursor-not-allowed"
            aria-describedby="terminos-ayuda"
          />
          <span className={`text-sm leading-relaxed ${terminosLeidos ? 'text-espresso' : 'text-warm-gray'}`}>
            He leído y acepto los{' '}
            {/* El enlace abre en pestaña nueva a propósito: el pedido vive en el
                estado del componente, así que navegar acá perdería los pasos. */}
            <Link
              to={TERMINOS_RUTA}
              target="_blank"
              rel="noopener noreferrer"
              className="text-terracotta font-semibold underline underline-offset-2 hover:text-ember"
              onClick={(e) => e.stopPropagation()}
            >
              Términos y Condiciones
            </Link>{' '}
            del servicio. <span className="text-warm-gray">(versión {TERMINOS_VERSION})</span>
          </span>
        </label>

        {!terminosLeidos && (
          <p className="text-xs text-warm-gray mt-1.5 px-1">
            Para poder marcar esta casilla, primero abre y revisa los términos.
          </p>
        )}
        {touched && !aceptaTerminos && (
          <span className="text-xs text-primary-600 mt-1 block px-1">
            {terminosLeidos
              ? 'Debes aceptar los Términos y Condiciones para enviar tu pedido.'
              : 'Debes leer y aceptar los Términos y Condiciones para enviar tu pedido.'}
          </span>
        )}
      </div>

      <TerminosModal
        abierto={modalTerminos}
        onCerrar={() => setModalTerminos(false)}
        onLeido={confirmarLectura}
      />

      {error && (
        <div className="mb-4 text-sm text-primary-700 bg-primary-50 border border-primary-200 rounded-lg px-4 py-2.5">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <button onClick={onBack} disabled={submitting} className="text-warm-gray hover:text-espresso px-4 py-3 disabled:opacity-50">
          ← Atrás
        </button>
        <button
          onClick={confirmar}
          disabled={submitting || !valido}
          className="bg-terracotta text-ivory font-semibold rounded-full px-7 py-3 hover:bg-ember transition-colors disabled:opacity-50"
        >
          {submitting ? 'Confirmando…' : 'Confirmar Pedido'}
        </button>
      </div>
    </div>
  )
}
