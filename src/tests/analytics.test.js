import { describe, it, expect, beforeEach } from 'vitest'
import { trackEvent } from '../lib/analytics'

describe('trackEvent (dataLayer / GTM)', () => {
  beforeEach(() => {
    // Reinicia la capa de datos entre pruebas.
    window.dataLayer = undefined
  })

  it('inicializa dataLayer y empuja el evento con sus parámetros', () => {
    trackEvent('pedido_confirmado', { value: 60000, currency: 'CLP', servicio: 'meal_prep' })
    expect(Array.isArray(window.dataLayer)).toBe(true)
    expect(window.dataLayer.at(-1)).toEqual({
      event: 'pedido_confirmado',
      value: 60000,
      currency: 'CLP',
      servicio: 'meal_prep',
    })
  })

  it('funciona sin parámetros (solo el nombre del evento)', () => {
    trackEvent('algo')
    expect(window.dataLayer.at(-1)).toEqual({ event: 'algo' })
  })

  it('no empuja nada si no se da nombre de evento', () => {
    trackEvent('')
    expect(window.dataLayer).toBeUndefined()
  })

  it('conserva eventos previos (append, no reemplaza)', () => {
    trackEvent('uno')
    trackEvent('dos')
    expect(window.dataLayer.map((e) => e.event)).toEqual(['uno', 'dos'])
  })
})
