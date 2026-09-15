import { useState } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../lib/publicApi', () => ({
  getCupos: vi.fn(),
  getPlatos: vi.fn(),
  getProductosHornear: vi.fn(),
  getIngredientesDePlatos: vi.fn(),
  createPedido: vi.fn(),
  getPedidoResumen: vi.fn(),
  ApiError: class ApiError extends Error {},
}))

import { getProductosHornear, createPedido } from '../lib/publicApi'
import StepSummary from '../components/flow/StepSummary'
import { SECCIONES, TERMINOS_VERSION } from '../data/terminos'

const BASE = {
  direccion: 'Calle 1',
  comuna: 'Ñuñoa',
  fecha_entrega: '2026-07-01',
  platosDetalle: [
    { id: 1, nombre: 'A' },
    { id: 2, nombre: 'B' },
    { id: 3, nombre: 'C' },
    { id: 4, nombre: 'D' },
    { id: 5, nombre: 'E' },
  ],
  restricciones: [],
  observaciones: '',
  tipo_entrega: 'delivery',
  costo_despacho: 5000,
  total: 60000,
  productos_hornear: [],
  productosHornearDetalle: [],
  bakingTotal: 0,
  nombre: '',
  email: '',
  telefono: '',
}

function renderSummary(data) {
  render(
    <MemoryRouter>
      <StepSummary data={data} update={vi.fn()} onBack={vi.fn()} />
    </MemoryRouter>
  )
}

/**
 * Igual que `renderSummary`, pero con estado real: la casilla de los Términos y
 * Condiciones se controla desde `data`, así que sin un `update` que realmente
 * mute el estado marcarla no cambiaría nada.
 */
function renderSummaryConEstado(inicial) {
  function Host() {
    const [data, setData] = useState(inicial)
    return <StepSummary data={data} update={(p) => setData((d) => ({ ...d, ...p }))} onBack={vi.fn()} />
  }
  render(
    <MemoryRouter>
      <Host />
    </MemoryRouter>
  )
}

const DATOS_COMPLETOS = {
  ...BASE,
  servicio: 'meal_prep',
  base: 60000,
  nombre: 'Ana Pérez',
  email: 'ana@example.com',
  telefono: '+56 9 1234 5678',
}

const confirmar = () => screen.getByRole('button', { name: /Confirmar Pedido/ })
const casillaTerminos = () => screen.getByRole('checkbox', { name: /Términos y Condiciones/ })
const botonLeer = () => screen.getByRole('button', { name: /Leer los Términos y Condiciones/ })

/**
 * Abre el modal y confirma la lectura.
 *
 * En jsdom no hay layout (scrollHeight y clientHeight son 0), así que el modal
 * da el documento por recorrido de inmediato: acá se cubre el ORDEN (leer →
 * aceptar), y que el scroll hasta el final sea de verdad obligatorio lo verifica
 * el e2e, que corre en un navegador con dimensiones reales.
 */
function leerTerminos() {
  fireEvent.click(botonLeer())
  fireEvent.click(screen.getByRole('button', { name: /He leído los términos/ }))
}

beforeEach(() => {
  getProductosHornear.mockReset().mockResolvedValue([])
  createPedido.mockReset().mockResolvedValue({ id: 123, total: 65000, resumen_token: 'tok' })
})

describe('StepSummary · reutilización en Cocinera', () => {
  it('muestra la lista de compras cuando el servicio es "cocinera"', () => {
    renderSummary({
      ...BASE,
      servicio: 'cocinera',
      serviceLabel: 'Cocinera a Domicilio',
      base: 55000,
      lista_compras: [
        { nombre: 'Arroz', cantidad: 350, unidad: 'g' },
        { nombre: 'Cebolla', cantidad: 2, unidad: 'u' },
        { nombre: 'Sal', cantidad: 1, unidad: 'cdta' },
      ],
    })

    expect(screen.getByText('Lista de compras')).toBeInTheDocument()
    expect(screen.getByText('3 ingredientes')).toBeInTheDocument()
  })

  it('NO muestra la lista de compras en Meal Prep (lista vacía)', () => {
    renderSummary({ ...BASE, servicio: 'meal_prep', base: 60000, lista_compras: [] })
    expect(screen.queryByText('Lista de compras')).not.toBeInTheDocument()
  })
})

describe('StepSummary · aceptación de los Términos y Condiciones', () => {
  it('con los datos completos pero SIN aceptar, el botón sigue deshabilitado y no envía nada', () => {
    renderSummaryConEstado(DATOS_COMPLETOS)

    expect(casillaTerminos()).not.toBeChecked()
    expect(confirmar()).toBeDisabled()

    fireEvent.click(confirmar())
    expect(createPedido).not.toHaveBeenCalled()
  })

  it('al marcar la casilla se habilita el botón, y al desmarcarla se vuelve a bloquear', () => {
    renderSummaryConEstado(DATOS_COMPLETOS)

    leerTerminos()
    fireEvent.click(casillaTerminos())
    expect(confirmar()).toBeEnabled()

    fireEvent.click(casillaTerminos())
    expect(confirmar()).toBeDisabled()
  })

  it('la casilla NO reemplaza al resto de la validación (sin email válido sigue bloqueado)', () => {
    renderSummaryConEstado({ ...DATOS_COMPLETOS, email: 'no-es-un-email' })

    leerTerminos()
    fireEvent.click(casillaTerminos())
    expect(confirmar()).toBeDisabled()
  })

  it('el enlace a los términos abre en una pestaña nueva (no se pierde el pedido en curso)', () => {
    renderSummaryConEstado(DATOS_COMPLETOS)

    const enlace = screen.getByRole('link', { name: /Términos y Condiciones/ })
    expect(enlace).toHaveAttribute('href', '/terminos-y-condiciones')
    expect(enlace).toHaveAttribute('target', '_blank')
    expect(enlace).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('el pedido viaja con el respaldo de la aceptación: versión, fecha y confirmación', async () => {
    const antes = Date.now()
    renderSummaryConEstado(DATOS_COMPLETOS)

    leerTerminos()
    fireEvent.click(casillaTerminos())
    fireEvent.click(confirmar())

    await waitFor(() => expect(createPedido).toHaveBeenCalledTimes(1))
    const payload = createPedido.mock.calls[0][0]

    expect(payload.acepta_terminos).toBe(true)
    expect(payload.terminos_version).toBe(TERMINOS_VERSION)
    // La fecha registrada es la del clic en la casilla, no la del envío.
    const aceptadoEn = Date.parse(payload.terminos_aceptados_en)
    expect(Number.isFinite(aceptadoEn)).toBe(true)
    expect(aceptadoEn).toBeGreaterThanOrEqual(antes)
    expect(aceptadoEn).toBeLessThanOrEqual(Date.now())
  })
})

describe('StepSummary · lectura obligatoria antes de aceptar', () => {
  it('la casilla nace deshabilitada: no se puede aceptar lo que no se ha leído', () => {
    renderSummaryConEstado(DATOS_COMPLETOS)

    expect(casillaTerminos()).toBeDisabled()
    expect(screen.getByText(/primero abre y revisa los términos/i)).toBeInTheDocument()
    expect(confirmar()).toBeDisabled()
  })

  it('hacer clic en la casilla bloqueada no marca nada ni habilita el envío', () => {
    renderSummaryConEstado(DATOS_COMPLETOS)

    fireEvent.click(casillaTerminos())
    expect(casillaTerminos()).not.toBeChecked()
    expect(confirmar()).toBeDisabled()
  })

  it('el modal muestra el texto real de los términos, no un resumen', () => {
    renderSummaryConEstado(DATOS_COMPLETOS)
    fireEvent.click(botonLeer())

    const dialogo = screen.getByRole('dialog')
    // Las 14 secciones de src/data/terminos.js, con la de horarios incluida.
    for (const seccion of SECCIONES) {
      expect(within(dialogo).getByText(seccion.titulo)).toBeInTheDocument()
    }
    expect(within(dialogo).getByText(/no con una hora exacta/)).toBeInTheDocument()
  })

  it('tras leer, la casilla se habilita y el envío queda disponible al aceptar', () => {
    renderSummaryConEstado(DATOS_COMPLETOS)

    leerTerminos()
    expect(casillaTerminos()).toBeEnabled()
    // Leer no acepta por sí solo: siguen siendo dos actos distintos.
    expect(casillaTerminos()).not.toBeChecked()
    expect(confirmar()).toBeDisabled()

    fireEvent.click(casillaTerminos())
    expect(confirmar()).toBeEnabled()
  })

  it('desmarcar la aceptación no obliga a releer (un clic accidental no castiga)', () => {
    renderSummaryConEstado(DATOS_COMPLETOS)

    leerTerminos()
    fireEvent.click(casillaTerminos())
    fireEvent.click(casillaTerminos())

    expect(casillaTerminos()).not.toBeChecked()
    expect(casillaTerminos()).toBeEnabled()
  })

  it('el pedido registra CUÁNDO se leyó, y que fue antes de aceptar', async () => {
    renderSummaryConEstado(DATOS_COMPLETOS)

    leerTerminos()
    fireEvent.click(casillaTerminos())
    fireEvent.click(confirmar())

    await waitFor(() => expect(createPedido).toHaveBeenCalledTimes(1))
    const payload = createPedido.mock.calls[0][0]

    const leido = Date.parse(payload.terminos_leidos_en)
    const aceptado = Date.parse(payload.terminos_aceptados_en)
    expect(Number.isFinite(leido)).toBe(true)
    expect(leido).toBeLessThanOrEqual(aceptado)
  })
})
