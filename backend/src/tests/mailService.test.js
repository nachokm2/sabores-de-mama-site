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

import { sendEstadoEmail, sendChecklistIngredientes, ESTADOS_VALIDOS } from '../services/mailService.js'
import { categorizarIngrediente, agruparPorCategoria } from '../utils/categorias.js'

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

  it('en_delivery informa el plazo estimado y la condición de recepción', async () => {
    await sendEstadoEmail(PEDIDO, 'en_delivery')
    const html = ultimoHtml()
    expect(ultimoAsunto()).toBe('Tu pedido va en camino 🚗')

    expect(html).toContain('Horario estimado de entrega')
    expect(html).toContain('2:30 horas')
    // El plazo depende de la comuna: se dice explícitamente que no hay rango fijo,
    // para no generar una expectativa de hora exacta que no se puede cumplir.
    expect(html).toContain('No existe un rango fijo de entrega')
    expect(html).toContain('comprometo a estar disponible para recibirlo')

    // Va ANTES del resumen del pedido: es lo primero que el cliente necesita leer.
    expect(html.indexOf('Horario estimado de entrega')).toBeLessThan(html.indexOf('Resumen de tu pedido'))
  })

  it('el resumen lista los Postres y Snacks y los adicionales con su precio', async () => {
    await sendEstadoEmail(
      {
        ...PEDIDO,
        productos_hornear: [{ id: 1, nombre: 'Kuchen de nuez', precio: 8000 }],
        adicionales: [{ clave: 'porcionado', nombre: 'Porcionado', precio: 3000 }],
      },
      'pagado'
    )
    const html = ultimoHtml()
    expect(html).toContain('Postres y Snacks')
    expect(html).toContain('Kuchen de nuez')
    expect(html).toContain('$8.000')
    expect(html).toContain('Servicios adicionales')
    expect(html).toContain('Porcionado')
  })

  it('sin extras, el resumen no imprime esas secciones vacías', async () => {
    await sendEstadoEmail(PEDIDO, 'pagado')
    const html = ultimoHtml()
    expect(html).not.toContain('Postres y Snacks')
    expect(html).not.toContain('Servicios adicionales')
  })

  it('clasifica los ingredientes en su categoría (incluidos los nombres compuestos)', () => {
    expect(categorizarIngrediente('Pechuga de pollo')).toBe('Proteínas')
    expect(categorizarIngrediente('Huevos')).toBe('Proteínas')
    expect(categorizarIngrediente('Zapallo italiano')).toBe('Verduras')
    expect(categorizarIngrediente('Pera')).toBe('Frutas')
    expect(categorizarIngrediente('Crema de leche')).toBe('Lácteos')
    expect(categorizarIngrediente('Harina')).toBe('Carbohidratos')
    // Compuestos que contienen la palabra de OTRA categoría: si se resolvieran
    // por simple inclusión, "salsa de tomate" caería en Verduras y "pan rallado"
    // competiría con Proteínas por el pan.
    expect(categorizarIngrediente('Salsa de tomate')).toBe('Otros')
    expect(categorizarIngrediente('Pan rallado')).toBe('Carbohidratos')
    // Lo desconocido va a Otros: aparece igual en la lista, nunca se pierde.
    expect(categorizarIngrediente('Ingrediente inventado')).toBe('Otros')
  })

  it('consolida el total por ingrediente y conserva el desglose por plato', () => {
    const grupos = agruparPorCategoria([
      { nombre: 'Panqueques', ingredientes: [{ nombre: 'Choclo', cantidad: 200, unidad: 'g' }] },
      { nombre: 'Ensalada mediterránea', ingredientes: [{ nombre: 'Choclo', cantidad: 100, unidad: 'g' }] },
    ])
    const verduras = grupos.find((g) => g.categoria === 'Verduras')
    const choclo = verduras.items.find((i) => i.nombre === 'Choclo')
    expect(choclo.total).toBe(300)
    expect(choclo.detalle).toHaveLength(2)
  })

  it('el checklist se omite si no está configurado el destinatario', async () => {
    const previo = process.env.CHECKLIST_EMAIL
    delete process.env.CHECKLIST_EMAIL
    const res = await sendChecklistIngredientes(PEDIDO, [
      { nombre: 'Pollo al Curry', ingredientes: [{ nombre: 'Pechuga de pollo', cantidad: 600, unidad: 'g' }] },
    ])
    expect(res.skipped).toBe(true)
    expect(sendMailMock).not.toHaveBeenCalled()
    if (previo !== undefined) process.env.CHECKLIST_EMAIL = previo
  })

  it('el checklist agrupa por categorías y va al destinatario configurado', async () => {
    process.env.CHECKLIST_EMAIL = 'cocina@test'
    await sendChecklistIngredientes(PEDIDO, [
      {
        nombre: 'Pollo al Curry',
        ingredientes: [
          { nombre: 'Pechuga de pollo', cantidad: 600, unidad: 'g' },
          { nombre: 'Crema de leche', cantidad: 200, unidad: 'ml' },
          { nombre: 'Cebolla', cantidad: 2, unidad: 'unidad' },
        ],
      },
      { nombre: 'Queque', ingredientes: [{ nombre: 'Harina', cantidad: 320, unidad: 'g' }] },
    ])

    const llamada = sendMailMock.mock.calls[0][0]
    expect(llamada.to).toBe('cocina@test')
    expect(llamada.subject).toContain('Checklist de ingredientes')
    expect(llamada.subject).toContain('#99')
    // El checklist interno NO se copia a las direcciones de negocio.
    expect(llamada.bcc == null || llamada.bcc.length === 0).toBe(true)

    const html = llamada.html
    for (const cat of ['Proteínas', 'Verduras', 'Lácteos', 'Carbohidratos']) expect(html).toContain(cat)
    expect(html).toContain('Pechuga de pollo: 600 g')
    // Sin ingredientes de fruta, esa sección no se imprime.
    expect(html).not.toContain('>Frutas<')
    delete process.env.CHECKLIST_EMAIL
  })

  it('el correo al cliente de "pagado" NO cambia por el checklist', async () => {
    process.env.CHECKLIST_EMAIL = 'cocina@test'
    await sendEstadoEmail(PEDIDO, 'pagado')
    // El PRIMER envío es siempre el del cliente, con su asunto y su contenido.
    const alCliente = sendMailMock.mock.calls[0][0]
    expect(alCliente.to).toBe(PEDIDO.email)
    expect(alCliente.subject).toBe('¡Tu pago fue confirmado! 🎉')
    expect(alCliente.html).toContain('Lista de ingredientes')
    delete process.env.CHECKLIST_EMAIL
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
