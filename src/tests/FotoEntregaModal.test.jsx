import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('../lib/adminApi', () => ({
  subirImagen: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(message, status) {
      super(message)
      this.status = status
    }
  },
}))

import { subirImagen } from '../lib/adminApi'
import FotoEntregaModal from '../components/admin/FotoEntregaModal'

// jsdom no implementa createObjectURL/revokeObjectURL (usados para la preview).
beforeEach(() => {
  subirImagen.mockReset()
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:preview')
  globalThis.URL.revokeObjectURL = vi.fn()
})

function file() {
  return new File(['x'], 'pedido.jpg', { type: 'image/jpeg' })
}

describe('FotoEntregaModal', () => {
  it('el botón de confirmar está deshabilitado hasta que se elige un archivo', () => {
    render(<FotoEntregaModal pedido={{ id: 7 }} onConfirm={vi.fn()} onClose={vi.fn()} />)
    const btn = screen.getByRole('button', { name: /Subir y marcar En delivery/i })
    expect(btn).toBeDisabled()
  })

  it('sube la imagen y confirma con la key del bucket', async () => {
    subirImagen.mockResolvedValue('entregas/pedido.jpg')
    const onConfirm = vi.fn().mockResolvedValue()
    render(<FotoEntregaModal pedido={{ id: 7 }} onConfirm={onConfirm} onClose={vi.fn()} />)

    const input = document.querySelector('input[type="file"]')
    fireEvent.change(input, { target: { files: [file()] } })

    const btn = screen.getByRole('button', { name: /Subir y marcar En delivery/i })
    expect(btn).not.toBeDisabled()
    fireEvent.click(btn)

    await waitFor(() => expect(subirImagen).toHaveBeenCalledTimes(1))
    expect(subirImagen).toHaveBeenCalledWith(expect.any(File), 'entregas')
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith('entregas/pedido.jpg'))
  })

  it('muestra un error si la subida falla y no confirma', async () => {
    subirImagen.mockRejectedValue(new Error('Falló la red'))
    const onConfirm = vi.fn()
    render(<FotoEntregaModal pedido={{ id: 7 }} onConfirm={onConfirm} onClose={vi.fn()} />)

    fireEvent.change(document.querySelector('input[type="file"]'), { target: { files: [file()] } })
    fireEvent.click(screen.getByRole('button', { name: /Subir y marcar En delivery/i }))

    expect(await screen.findByText(/Falló la red/i)).toBeInTheDocument()
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
