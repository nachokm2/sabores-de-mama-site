import { query } from '../models/index.js'

/**
 * Cálculo AUTORITATIVO del total de un pedido, en el servidor.
 *
 * Antes el total venía del navegador y sólo se validaba un piso (>= precio base
 * del servicio). Eso dejaba pasar la manipulación más rentable: un pedido con
 * despacho y adicionales enviado con `total` igual al precio base. El correo con
 * las instrucciones de transferencia se arma con ese mismo campo, así que el
 * monto adulterado llegaba a la clienta y se confirmaba a mano contra él.
 *
 * La fórmula replica la del frontend (`src/lib/flowConfig.js` → computeTotal):
 *
 *     total = precio base + despacho + productos para hornear + adicionales
 *
 * pero cada componente se lee de su fuente autoritativa en la BD, no del body.
 */

// Precio unitario de una ensalada agregada como adicional. Es el único
// componente sin fuente en la BD: las ensaladas no están en `platos` con precio,
// se cobran como un extra de monto fijo. Debe coincidir con VITE_ENSALADA_PRECIO
// del frontend.
const ensaladaPrecio = () => Number(process.env.ENSALADA_PRECIO) || 1500

// Columnas de despacho por servicio (whitelist; nunca se interpola input).
function comunaCols(servicio) {
  return servicio === 'cocinera'
    ? { costo: 'costo_cocinera', activo: 'activo_cocinera' }
    : { costo: 'costo_meal_prep', activo: 'activo_meal_prep' }
}

function error400(mensaje) {
  const err = new Error(mensaje)
  err.status = 400
  return err
}

/**
 * Costo de despacho real de la comuna para ese servicio.
 *
 * La regla la manda la COMUNA, no `tipo_entrega`: si el pedido trae comuna se
 * cobra su despacho, venga el tipo de entrega que venga. Si dependiera de
 * `tipo_entrega`, bastaría con omitir ese campo para llevarse el despacho
 * gratis. A la inversa, un `delivery` sin comuna no se puede tarifar y se
 * rechaza. Sin comuna y sin delivery es un retiro: no paga despacho.
 */
async function costoDespacho(b) {
  const nombre = String(b.comuna || '').trim()
  if (!nombre) {
    if (b.tipo_entrega === 'delivery') throw error400('Falta la comuna de despacho.')
    return 0
  }
  if (b.tipo_entrega === 'retiro') return 0

  const c = comunaCols(b.servicio)
  const { rows } = await query(
    `SELECT COALESCE(${c.costo}, 0) AS costo
       FROM comunas
      WHERE lower(nombre) = lower($1)
        AND ${c.costo} IS NOT NULL
        AND COALESCE(${c.activo}, false) = true`,
    [nombre]
  )
  if (!rows[0]) {
    throw error400(`No tenemos despacho disponible para la comuna "${nombre}".`)
  }
  return Number(rows[0].costo) || 0
}

/**
 * Suma de los productos para hornear, con el precio de la tabla (no el del
 * body). Los ids que no existan o estén inactivos suman 0.
 */
async function totalHornear(productos) {
  const ids = (Array.isArray(productos) ? productos : [])
    .map((p) => parseInt(p?.id, 10))
    .filter((n) => Number.isInteger(n) && n > 0)
  if (!ids.length) return 0

  const { rows } = await query(
    'SELECT id, precio FROM productos_hornear WHERE id = ANY($1) AND activo = true',
    [ids]
  )
  const precioPorId = new Map(rows.map((r) => [r.id, Number(r.precio) || 0]))
  // Se suma por CADA entrada enviada (el mismo producto puede ir repetido),
  // pero siempre al precio de la tabla.
  return ids.reduce((acc, id) => acc + (precioPorId.get(id) || 0), 0)
}

/**
 * Suma de los servicios adicionales. Las claves son las que arma el frontend:
 *   - `ingredientes` / `porcionado` → precio de servicios_config
 *   - `ensalada-<id>`               → precio fijo por unidad
 * Cualquier otra clave suma 0 (no se acepta un precio inventado por el cliente).
 */
function totalAdicionales(adicionales, cfg) {
  return (Array.isArray(adicionales) ? adicionales : []).reduce((acc, a) => {
    const clave = String(a?.clave || '')
    if (clave === 'ingredientes') return acc + (Number(cfg.costo_ingredientes) || 0)
    if (clave === 'porcionado') return acc + (Number(cfg.costo_porcionado) || 0)
    if (clave.startsWith('ensalada-')) return acc + ensaladaPrecio()
    return acc
  }, 0)
}

/**
 * Calcula el total del pedido. Devuelve también el `costo_despacho` para
 * guardarlo coherente con el total (antes también venía del cliente).
 *
 * Lanza un error con `status = 400` si el pedido no es despachable.
 */
export async function calcularTotal(b) {
  const { rows } = await query(
    'SELECT precio_base, costo_ingredientes, costo_porcionado FROM servicios_config WHERE servicio = $1',
    [b.servicio]
  )
  const cfg = rows[0]
  if (!cfg) {
    // servicios_config se siembra en las migraciones para ambos servicios; si
    // falta, es un problema de la base y no algo que deba pagar el cliente.
    throw new Error(`No hay configuración de precios para el servicio "${b.servicio}".`)
  }

  const despacho = await costoDespacho(b)
  const hornear = await totalHornear(b.productos_hornear)
  const adicionales = totalAdicionales(b.adicionales, cfg)
  const base = Number(cfg.precio_base) || 0

  return {
    total: base + despacho + hornear + adicionales,
    costo_despacho: despacho,
    detalle: { base, despacho, hornear, adicionales },
  }
}
