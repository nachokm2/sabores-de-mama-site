import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'

vi.mock('../lib/publicApi', () => ({
  getComunas: vi.fn().mockResolvedValue([]),
}))
vi.mock('../lib/clienteApi', () => ({
  isTokenValid: vi.fn(),
  getPerfil: vi.fn(),
}))

import { isTokenValid, getPerfil } from '../lib/clienteApi'
import StepAddress from '../components/flow/StepAddress'

function Wrapper({ initialDireccion = '' }) {
  const [data, setData] = useState({
    direccion: initialDireccion,
    comuna: '',
    servicio: 'cocinera',
    tipo_entrega: 'delivery',
    base: 55000,
    bakingTotal: 0,
    costo_despacho: 5000,
    total: 60000,
  })
  const update = (p) => setData((d) => ({ ...d, ...p }))
  return <StepAddress data={data} update={update} onNext={vi.fn()} />
}

beforeEach(() => {
  isTokenValid.mockReset()
  getPerfil.mockReset()
})

describe('StepAddress · precarga de dirección del perfil', () => {
  it('precarga la dirección del perfil cuando el cliente está logueado', async () => {
    isTokenValid.mockReturnValue(true)
    getPerfil.mockResolvedValue({ user: { direccion: 'Av. Siempre Viva 742, Ñuñoa' } })

    render(<Wrapper />)

    await waitFor(() =>
      expect(screen.getByLabelText(/Dirección/)).toHaveValue('Av. Siempre Viva 742, Ñuñoa')
    )
  })

  it('no consulta el perfil si no hay sesión de cliente', async () => {
    isTokenValid.mockReturnValue(false)
    render(<Wrapper />)
    expect(getPerfil).not.toHaveBeenCalled()
    expect(screen.getByLabelText(/Dirección/)).toHaveValue('')
  })

  it('no pisa la dirección que el cliente ya escribió', async () => {
    isTokenValid.mockReturnValue(true)
    getPerfil.mockResolvedValue({ user: { direccion: 'Del perfil' } })

    render(<Wrapper initialDireccion="Lo que escribí" />)

    // Como ya había dirección, ni siquiera se consulta el perfil.
    expect(getPerfil).not.toHaveBeenCalled()
    expect(screen.getByLabelText(/Dirección/)).toHaveValue('Lo que escribí')
  })
})
