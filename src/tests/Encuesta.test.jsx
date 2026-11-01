import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'

vi.mock('../lib/publicApi', () => ({
  getEncuesta: vi.fn(),
  enviarEncuesta: vi.fn(),
  ApiError: class ApiError extends Error {},
}))

import { getEncuesta, enviarEncuesta } from '../lib/publicApi'
import Encuesta from '../pages/Encuesta'

const GOOGLE = 'https://g.page/r/sabores-de-mama/review'

function renderEncuesta(ruta) {
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path="/encuesta/:orderId/:token" element={<Encuesta />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  )
}

const estrella = (n) => screen.getByRole('button', { name: `${n} estrella${n > 1 ? 's' : ''}` })

beforeEach(() => {
  getEncuesta.mockReset().mockResolvedValue({ valido: true, yaRespondida: false, nombre: 'María' })
  enviarEncuesta.mockReset().mockResolvedValue({ ok: true })
  vi.stubEnv('VITE_GOOGLE_REVIEW_URL', GOOGLE)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('Encuesta', () => {
  it('llega con la nota marcada desde la estrella del correo', async () => {
    renderEncuesta('/encuesta/41/tok?rating=4')
    await screen.findByText(/María, cuéntanos/)
    expect(estrella(4)).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: /Sí/ }))
    fireEvent.click(screen.getByRole('button', { name: /Enviar mi opinión/ }))
    await waitFor(() =>
      expect(enviarEncuesta).toHaveBeenCalledWith('41', expect.objectContaining({ token: 'tok', satisfaction_rating: 4 }))
    )
  })

  it('ignora una nota fuera de 1–5 en el enlace', async () => {
    renderEncuesta('/encuesta/41/tok?rating=9')
    await screen.findByText(/María, cuéntanos/)
    for (let n = 1; n <= 5; n++) expect(estrella(n)).toHaveAttribute('aria-pressed', 'false')
  })

  it('a quien pone 4 o 5 estrellas lo invita a dejar la reseña en Google', async () => {
    renderEncuesta('/encuesta/41/tok?rating=5')
    await screen.findByText(/María, cuéntanos/)
    fireEvent.click(screen.getByRole('button', { name: /Sí/ }))
    fireEvent.click(screen.getByRole('button', { name: /Enviar mi opinión/ }))

    const enlace = await screen.findByRole('link', { name: /Dejar mi reseña en Google/ })
    expect(enlace).toHaveAttribute('href', GOOGLE)
  })

  it('con una nota baja no pide la reseña en Google', async () => {
    renderEncuesta('/encuesta/41/tok?rating=2')
    await screen.findByText(/María, cuéntanos/)
    fireEvent.click(screen.getByRole('button', { name: /No/ }))
    fireEvent.click(screen.getByRole('button', { name: /Enviar mi opinión/ }))

    await screen.findByText('¡Gracias por tu opinión!')
    expect(screen.queryByRole('link', { name: /Google/ })).not.toBeInTheDocument()
  })

  it('sin el enlace de Google configurado no muestra la invitación', async () => {
    vi.stubEnv('VITE_GOOGLE_REVIEW_URL', '')
    renderEncuesta('/encuesta/41/tok?rating=5')
    await screen.findByText(/María, cuéntanos/)
    fireEvent.click(screen.getByRole('button', { name: /Sí/ }))
    fireEvent.click(screen.getByRole('button', { name: /Enviar mi opinión/ }))

    await screen.findByText('¡Gracias por tu opinión!')
    expect(screen.queryByRole('link', { name: /Google/ })).not.toBeInTheDocument()
  })
})
