/**
 * Fotos de la entrega de un pedido, como lista de keys del bucket.
 *
 * Convive con el esquema anterior: `fotos_entrega` es el array (varias fotos) y
 * `foto_entrega` la columna original de una sola. Se leen ambas y se deduplica,
 * para que los pedidos anteriores al cambio sigan mostrando su imagen.
 *
 * Espejo de backend/src/utils/fotos.js: no comparten código, así que si cambia
 * una hay que mirar la otra.
 */
export function fotosDePedido(pedido) {
  const desde = (v) =>
    (Array.isArray(v) ? v : [v]).map((k) => (typeof k === 'string' ? k.trim() : '')).filter(Boolean)

  return [...new Set([...desde(pedido?.fotos_entrega), ...desde(pedido?.foto_entrega)])]
}
