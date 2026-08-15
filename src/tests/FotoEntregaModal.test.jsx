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
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:preview-' + Math.random())
  globalThis.URL.revokeObjectURL = vi.fn()
})

function file(nombre = 'pedido.jpg') {
  return new File(['x'], nombre, { type: 'image/jpeg' })
}

const inputFile = () => document.querySelector('input[type="file"]')
const botonSubir = () => screen.getByRole('button', { name: /Subir .*marcar En delivery/i })

describe('FotoEntregaModal', () => {
  it('el botón de confirmar está deshabilitado hasta que se elige un archivo', () => {
    render(<FotoEntregaModal pedido={{ id: 7 }} onConfirm={vi.fn()} onClose={vi.fn()} />)
    expect(botonSubir()).toBeDisabled()
  })

  it('acepta varios archivos y confirma con TODAS las keys', async () => {
    subirImagen.mockResolvedValueOnce('entregas/a.jpg').mockResolvedValueOnce('entregas/b.jpg')
    const onConfirm = vi.fn().mockResolvedValue()
    render(<FotoEntregaModal pedido={{ id: 7 }} onConfirm={onConfirm} onClose={vi.fn()} />)

    fireEvent.change(inputFile(), { target: { files: [file('a.jpg'), file('b.jpg')] } })
    expect(screen.getByText(/2 elegidas/i)).toBeInTheDocument()

    fireEvent.click(botonSubir())

    await waitFor(() => expect(subirImagen).toHaveBeenCalledTimes(2))
    await waitFor(() =>
      expect(onConfirm).toHaveBeenCalledWith(['entregas/a.jpg', 'entregas/b.jpg'])
    )
  })

  it('acumula los archivos de varias tandas y descarta los repetidos', () => {
    render(<FotoEntregaModal pedido={{ id: 7 }} onConfirm={vi.fn()} onClose={vi.fn()} />)

    fireEvent.change(inputFile(), { target: { files: [file('a.jpg')] } })
    // Segunda tanda: el selector de archivos solo permite elegir dentro de una
    // carpeta por vez, así que agregar debe sumar y no reemplazar.
    fireEvent.change(inputFile(), { target: { files: [file('b.jpg'), file('a.jpg')] } })

    expect(screen.getByText(/2 elegidas/i)).toBeInTheDocument()
  })

  it('el botón de elegir cambia a "Agregar más" cuando ya hay fotos', () => {
    // El input nativo va oculto y se abre desde este botón: al limpiar su valor
    // (para poder re-elegir un archivo quitado) el navegador escribía "No file
    // chosen" al lado del control, contradiciendo al contador.
    render(<FotoEntregaModal pedido={{ id: 7 }} onConfirm={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Elegir fotos/i })).toBeInTheDocument()

    fireEvent.change(inputFile(), { target: { files: [file('a.jpg')] } })

    expect(screen.getByRole('button', { name: /Agregar más fotos/i })).toBeInTheDocument()
    expect(screen.getByText(/1 elegida/i)).toBeInTheDocument()
  })

  it('permite quitar una foto antes de subir', () => {
    render(<FotoEntregaModal pedido={{ id: 7 }} onConfirm={vi.fn()} onClose={vi.fn()} />)

    fireEvent.change(inputFile(), { target: { files: [file('a.jpg'), file('b.jpg')] } })
    fireEvent.click(screen.getByRole('button', { name: /Quitar foto 1/i }))

    // Singular: queda una sola.
    expect(screen.getByText(/1 elegida/i)).toBeInTheDocument()
  })

  it('con una sola foto confirma con un array de un elemento', async () => {
    subirImagen.mockResolvedValue('entregas/pedido.jpg')
    const onConfirm = vi.fn().mockResolvedValue()
    render(<FotoEntregaModal pedido={{ id: 7 }} onConfirm={onConfirm} onClose={vi.fn()} />)

    fireEvent.change(inputFile(), { target: { files: [file()] } })
    fireEvent.click(botonSubir())

    await waitFor(() => expect(subirImagen).toHaveBeenCalledWith(expect.any(File), 'entregas'))
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith(['entregas/pedido.jpg']))
  })

  it('muestra un error si la subida falla y no confirma', async () => {
    subirImagen.mockRejectedValue(new Error('Falló la red'))
    const onConfirm = vi.fn()
    render(<FotoEntregaModal pedido={{ id: 7 }} onConfirm={onConfirm} onClose={vi.fn()} />)

    fireEvent.change(inputFile(), { target: { files: [file()] } })
    fireEvent.click(botonSubir())

    expect(await screen.findByText(/Falló la red/i)).toBeInTheDocument()
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
