import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { metaTrack, metaContactoWhatsApp, primeraVezEnLaSesion, escucharClicsWhatsApp } from '../lib/metaPixel'
import { trackEvent } from '../lib/analytics'

/**
 * Las tres etiquetas de HTML personalizado del contenedor GTM-PN56NXLC quedaron
 * pausadas (la CSP las bloqueaba). Estos tests cubren sus equivalentes en el
 * código — y el Purchase, que en GTM no existía.
 */
describe('píxel de Meta', () => {
  beforeEach(() => {
    window.fbq = vi.fn()
    window.dataLayer = undefined
    window.sessionStorage.clear()
  })
  afterEach(() => {
    delete window.fbq
  })

  describe('metaTrack', () => {
    it('envía el evento con sus parámetros', () => {
      metaTrack('ViewContent', { content_name: 'Menu' })
      expect(window.fbq).toHaveBeenCalledWith('track', 'ViewContent', { content_name: 'Menu' })
    })

    it('no revienta si el píxel no cargó (bloqueador de anuncios)', () => {
      delete window.fbq
      expect(() => metaTrack('Purchase', { value: 1 })).not.toThrow()
    })

    it('ignora un nombre de evento vacío', () => {
      metaTrack('')
      expect(window.fbq).not.toHaveBeenCalled()
    })
  })

  describe('Purchase (la conversión que nunca existió en GTM)', () => {
    it('trackEvent("pedido_confirmado") dispara Purchase con monto y moneda', () => {
      trackEvent('pedido_confirmado', { pedido_id: 42, servicio: 'meal_prep', value: 60000, currency: 'CLP' })
      expect(window.fbq).toHaveBeenCalledWith('track', 'Purchase', { value: 60000, currency: 'CLP' })
    })

    it('sigue empujando el evento completo a dataLayer (GA4 no cambia)', () => {
      trackEvent('pedido_confirmado', { pedido_id: 42, servicio: 'meal_prep', value: 60000, currency: 'CLP' })
      expect(window.dataLayer.at(-1)).toEqual({
        event: 'pedido_confirmado', pedido_id: 42, servicio: 'meal_prep', value: 60000, currency: 'CLP',
      })
    })

    it('los demás eventos de dataLayer NO llegan al píxel', () => {
      trackEvent('paso_completado', { paso: 'direccion' })
      expect(window.fbq).not.toHaveBeenCalled()
    })
  })

  describe('Contact (clics a WhatsApp)', () => {
    let dejarDeEscuchar
    // jsdom intenta navegar de verdad al hacer clic en un <a href> y escupe un
    // "not implemented: navigation" por cada test. Se cancela en fase de burbuja,
    // después de que corra el listener real (que escucha en captura).
    const noNavegar = (e) => e.preventDefault()

    beforeEach(() => {
      dejarDeEscuchar = escucharClicsWhatsApp()
      document.addEventListener('click', noNavegar)
    })
    afterEach(() => {
      dejarDeEscuchar()
      document.removeEventListener('click', noNavegar)
      document.body.innerHTML = ''
    })

    const clicEn = (html) => {
      document.body.innerHTML = html
      document.body.firstElementChild.click()
    }

    it('detecta un enlace a wa.me', () => {
      clicEn('<a href="https://wa.me/56900000000?text=hola">Escríbenos</a>')
      expect(window.fbq).toHaveBeenCalledWith('track', 'Contact', { content_name: 'WhatsApp' })
    })

    it('detecta el clic aunque caiga en un hijo del enlace (un icono)', () => {
      document.body.innerHTML = '<a href="https://wa.me/56900000000"><svg><title>wa</title></svg></a>'
      // cancelable: true → si no, preventDefault no hace nada y jsdom navega.
      document.querySelector('svg').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      expect(window.fbq).toHaveBeenCalledWith('track', 'Contact', { content_name: 'WhatsApp' })
    })

    it('ignora los enlaces que no son de WhatsApp', () => {
      clicEn('<a href="/menu">Ver el menú</a>')
      expect(window.fbq).not.toHaveBeenCalled()
    })

    it('los botones que abren WhatsApp con window.open lo emiten a mano', () => {
      metaContactoWhatsApp()
      expect(window.fbq).toHaveBeenCalledWith('track', 'Contact', { content_name: 'WhatsApp' })
    })

    it('deja de escuchar al desmontar', () => {
      dejarDeEscuchar()
      clicEn('<a href="https://wa.me/56900000000">Escríbenos</a>')
      expect(window.fbq).not.toHaveBeenCalled()
    })
  })

  describe('primeraVezEnLaSesion', () => {
    it('responde true una sola vez por clave', () => {
      expect(primeraVezEnLaSesion('sdm:x')).toBe(true)
      expect(primeraVezEnLaSesion('sdm:x')).toBe(false)
      expect(primeraVezEnLaSesion('sdm:x')).toBe(false)
    })

    it('las claves son independientes', () => {
      primeraVezEnLaSesion('sdm:a')
      expect(primeraVezEnLaSesion('sdm:b')).toBe(true)
    })

    // El espía va sobre Storage.prototype: en jsdom sessionStorage es un Proxy y
    // asignar el método sobre la instancia no lo sustituye (el original sigue
    // corriendo, y el test pasaría o fallaría por el motivo equivocado).
    it('con sessionStorage bloqueado prefiere medir de más a no medir', () => {
      const espia = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('acceso a storage denegado')
      })
      try {
        expect(primeraVezEnLaSesion('sdm:y')).toBe(true)
        expect(primeraVezEnLaSesion('sdm:y')).toBe(true)
      } finally {
        espia.mockRestore()
      }
    })
  })
})
