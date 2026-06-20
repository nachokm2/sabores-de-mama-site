import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Mock del cliente público (evita llamadas reales a la API).
vi.mock('../lib/publicApi', () => ({
  getCupos: vi.fn(),
  getPlatos: vi.fn(),
  getProductosHornear: vi.fn(),
  createPedido: vi.fn(),
  getPedidoResumen: vi.fn(),
  ApiError: class ApiError extends Error {},
}))

import { getCupos } from '../lib/publicApi'
import StepDate from '../components/flow/StepDate'

const CUPO_A = { id: 1, fecha: '2026-07-01T04:00:00.000Z', disponibles: 5, capacidad_maxima: 5 }
const CUPO_B = { id: 2, fecha: '2026-07-03T04:00:00.000Z', disponibles: 2, capacidad_maxima: 5 }
const CUPO_LLENO = { id: 3, fecha: '2026-07-05T04:00:00.000Z', disponibles: 0, capacidad_maxima: 5 }

function renderStep(props = {}) {
  const update = vi.fn()
  render(
    <StepDate data={{ fecha_entrega: '' }} update={update} onNext={vi.fn()} onBack={vi.fn()} {...props} />
  )
  return { update }
}

beforeEach(() => {
  getCupos.mockReset()
})

describe('StepDate', () => {
  it('llama a getCupos (GET /api/cupos) al montar', async () => {
    getCupos.mockResolvedValue([CUPO_A, CUPO_B])
    renderStep()
    await waitFor(() => expect(getCupos).toHaveBeenCalledTimes(1))
  })

  it('renderiza una tarjeta por cada fecha con cupo disponible', async () => {
    getCupos.mockResolvedValue([CUPO_A, CUPO_B])
    renderStep()
    expect(await screen.findByText('5 cupos')).toBeInTheDocument()
    expect(screen.getByText('2 cupos')).toBeInTheDocument()
    // No hay tarjetas "Sin cupo".
    expect(screen.queryByText('Sin cupo')).not.toBeInTheDocument()
  })

  it('una fecha sin cupo se muestra deshabilitada y no es seleccionable', async () => {
    getCupos.mockResolvedValue([CUPO_A, CUPO_LLENO])
    const { update } = renderStep()

    const sinCupo = await screen.findByText('Sin cupo')
    const boton = sinCupo.closest('button')

    expect(boton).toBeDisabled()
    expect(boton.className).toMatch(/cursor-not-allowed/)

    fireEvent.click(boton)
    // No se guarda ninguna fecha al hacer clic en una deshabilitada.
    expect(update).not.toHaveBeenCalled()
  })

  it('al seleccionar una fecha disponible guarda fecha_entrega', async () => {
    getCupos.mockResolvedValue([CUPO_A, CUPO_B])
    const { update } = renderStep()

    const disponible = await screen.findByText('5 cupos')
    fireEvent.click(disponible.closest('button'))

    expect(update).toHaveBeenCalledWith({ fecha_entrega: '2026-07-01' })
  })
})
