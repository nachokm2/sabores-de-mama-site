import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PedidoDetalle from '../components/admin/PedidoDetalle'
import { telefonoWhatsApp } from '../components/admin/adminHelpers'

const URL_ENCUESTA = 'https://saboresdemama.com/encuesta/41/0123456789abcdef0123456789abcdef'

const PEDIDO = {
  id: 41,
  nombre: 'María González',
  email: 'maria@example.com',
  telefono: '+56 9 1234 5678',
  estado: 'entregado',
  fecha_entrega: '2026-10-03',
  platos: [],
  encuesta_url: URL_ENCUESTA,
  encuesta_respondida: false,
}

describe('PedidoDetalle · encuesta', () => {
  it('ofrece mandar la encuesta por WhatsApp al número del cliente, con el enlace', () => {
    render(<PedidoDetalle pedido={PEDIDO} />)
    const enlace = screen.getByRole('link', { name: 'Enviar por WhatsApp' })
    const href = enlace.getAttribute('href')
    expect(href).toMatch(/^https:\/\/wa\.me\/56912345678\?text=/)
    const texto = decodeURIComponent(href.split('?text=')[1])
    expect(texto).toContain('¡Hola María!')
    expect(texto).toContain(URL_ENCUESTA)
    expect(screen.getByRole('button', { name: 'Copiar enlace' })).toBeInTheDocument()
  })

  it('si ya la respondió, sólo lo indica', () => {
    render(<PedidoDetalle pedido={{ ...PEDIDO, encuesta_respondida: true }} />)
    expect(screen.getByText('✅ Respondida')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Enviar por WhatsApp' })).not.toBeInTheDocument()
  })

  it('sin teléfono deja sólo copiar el enlace', () => {
    render(<PedidoDetalle pedido={{ ...PEDIDO, telefono: '' }} />)
    expect(screen.queryByRole('link', { name: 'Enviar por WhatsApp' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copiar enlace' })).toBeInTheDocument()
  })

  it('no aparece en pedidos que aún no se entregan', () => {
    render(<PedidoDetalle pedido={{ ...PEDIDO, estado: 'pagado' }} />)
    expect(screen.queryByText('Encuesta de satisfacción')).not.toBeInTheDocument()
  })
})

describe('telefonoWhatsApp', () => {
  it.each([
    ['+56 9 1234 5678', '56912345678'],
    ['912345678', '56912345678'],
    ['1234 5678', '56912345678'],
    ['56912345678', '56912345678'],
    ['', ''],
    ['123', ''],
  ])('%s → "%s"', (tel, esperado) => {
    expect(telefonoWhatsApp(tel)).toBe(esperado)
  })
})
