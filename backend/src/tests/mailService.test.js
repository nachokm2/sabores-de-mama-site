import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'

// ── Mocks (hoisted para poder referenciarlos en los tests) ──
const { sendMailMock, queryMock } = vi.hoisted(() => ({
  sendMailMock: vi.fn(),
  queryMock: vi.fn(),
}))

// Nodemailer mockeado: NO se envían correos reales.
vi.mock('nodemailer', () => ({
  default: { createTransport: vi.fn(() => ({ sendMail: sendMailMock })) },
}))

// Conexión a la BD mockeada (para la lista de ingredientes en "pagado").
vi.mock('../models/index.js', () => ({
  query: queryMock,
  pool: { query: queryMock },
}))

import { sendEstadoEmail, ESTADOS_VALIDOS } from '../services/mailService.js'

const PEDIDO = {
  id: 99,
  nombre: 'María González',
  email: 'maria@example.com',
  servicio: 'meal_prep',
  fecha_entrega: '2026-07-01',
  comuna: 'Ñuñoa',
  tipo_entrega: 'delivery',
  costo_despacho: 5000,
  total: 65000,
  platos: [
    { id: 1, nombre: 'Pollo al Curry' },
    { id: 2, nombre: 'Lasaña Boloñesa' },
  ],
  restricciones: ['Sin gluten'],
}

const INGREDIENTES_ROWS = [
  { plato_id: 1, nombre: 'Pechuga de pollo', cantidad: '600', unidad: 'g' },
  { plato_id: 1, nombre: 'Curry', cantidad: '1', unidad: 'cda' },
  { plato_id: 2, nombre: 'Carne molida', cantidad: '500', unidad: 'g' },
]

// Devuelve el HTML del último correo "enviado" (capturado por el mock).
function ultimoHtml() {
  const calls = sendMailMock.mock.calls
  return calls.length ? calls[calls.length - 1][0].html : ''
}
function ultimoAsunto() {
  const calls = sendMailMock.mock.calls
  return calls.length ? calls[calls.length - 1][0].subject : ''
}

beforeAll(() => {
  // Config SMTP para que getTransporter cree el transporte (mockeado).
  process.env.SMTP_HOST = 'smtp.test'
  process.env.SMTP_USER = 'user@test'
  process.env.SMTP_PASS = 'secret'
  process.env.SMTP_FROM = 'Sabores de Mamá <pedidos@test>'
  // Datos bancarios deterministas.
  process.env.BANK_TITULAR = 'Estela Zavalla'
  process.env.BANK_BANCO = 'Banco de Chile'
  process.env.BANK_NUMERO = '12345678'
  process.env.BANK_RUT = '11.111.111-1'
})

beforeEach(() => {
  sendMailMock.mockReset().mockResolvedValue({ messageId: 'test-id' })
  queryMock.mockReset().mockResolvedValue({ rows: INGREDIENTES_ROWS })
})

describe('mailService', () => {
  it('Nodemailer está mockeado: no se envían correos reales', async () => {
    const res = await sendEstadoEmail(PEDIDO, 'entregado')
    expect(res.ok).toBe(true)
    expect(sendMailMock).toHaveBeenCalledTimes(1)
    // El "from" usa SMTP_FROM.
    expect(sendMailMock.mock.calls[0][0].from).toContain('pedidos@test')
  })

  it('solicitud_recibida incluye el resumen del pedido y los datos bancarios', async () => {
    await sendEstadoEmail(PEDIDO, 'solicitud_recibida')
    const html = ultimoHtml()
    expect(ultimoAsunto()).toBe('Sabores de Mamá — Recibimos tu pedido')
    // Resumen
    expect(html).toContain('Resumen de tu pedido')
    expect(html).toContain('#99')
    // Datos bancarios
    expect(html).toContain('Datos para transferencia')
    expect(html).toContain('Estela Zavalla')
    expect(html).toContain('12345678')
  })

  it('pagado incluye la lista de ingredientes de los platos seleccionados', async () => {
    await sendEstadoEmail(PEDIDO, 'pagado')
    const html = ultimoHtml()
    expect(ultimoAsunto()).toBe('¡Tu pago fue confirmado! 🎉')
    // Consultó la BD por los ids de los platos.
    expect(queryMock).toHaveBeenCalled()
    expect(queryMock.mock.calls[0][1]).toEqual([[1, 2]])
    // Lista de ingredientes presente con los nombres reales.
    expect(html).toContain('Lista de ingredientes')
    expect(html).toContain('Pechuga de pollo')
    expect(html).toContain('Curry')
    expect(html).toContain('Carne molida')
  })

  it('todas las plantillas generan HTML válido sin errores', async () => {
    const asuntosEsperados = {
      solicitud_recibida: 'Sabores de Mamá — Recibimos tu pedido',
      pagado: '¡Tu pago fue confirmado! 🎉',
      en_preparacion: 'Tu pedido está en preparación',
      en_delivery: 'Tu pedido va en camino 🚗',
      entregado: '¡Gracias por tu pedido! ❤️',
    }
    expect(ESTADOS_VALIDOS).toEqual(Object.keys(asuntosEsperados))

    for (const estado of ESTADOS_VALIDOS) {
      sendMailMock.mockClear()
      const res = await sendEstadoEmail(PEDIDO, estado)
      expect(res.ok, `estado ${estado}`).toBe(true)
      const html = ultimoHtml()
      expect(html, `estado ${estado}`).toContain('<!doctype html')
      expect(html, `estado ${estado}`).toContain('</html>')
      expect(html.length).toBeGreaterThan(200)
      expect(ultimoAsunto()).toBe(asuntosEsperados[estado])
    }
  })
})
