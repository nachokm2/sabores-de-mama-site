/**
 * Línea corta de detalle de un producto de Postres y Snacks: formato y
 * porciones. Un número solo en porciones (la admin suele cargar "10") se lee
 * como cantidad de unidades; sin esto la tarjeta mostraba un "10" suelto.
 */
export function detalleProducto(p) {
  const porciones = String(p?.porciones ?? '').trim()
  const cantidad = /^\d+$/.test(porciones) ? `${porciones} unidades` : porciones
  return [String(p?.formato ?? '').trim(), cantidad].filter(Boolean).join(' · ')
}
