import { test as base, expect } from '@playwright/test'

/**
 * `test` con el píxel de Meta neutralizado en TODAS las pruebas.
 *
 * Por qué existe: el 16/08/2026 dos corridas de CI registraron un Purchase de
 * $60.000 en la cuenta real de Meta. El grabador estaba puesto a mano en
 * mealprep.spec.js, pero el flujo de Cocinera también confirma un pedido y ahí
 * no estaba. Poner la salvaguarda spec por spec obliga a acordarse de ella cada
 * vez que un test nuevo toque una conversión, y ese olvido ya costó datos
 * falsos en la campaña. Aquí se aplica por defecto y hay que pedir lo contrario
 * de forma explícita.
 *
 * Dos capas, a propósito:
 *  1. `window.fbq` se define ANTES de que corra el snippet de index.html —que
 *     empieza con `if (f.fbq) return`—, así que ni pide fbevents.js. Los eventos
 *     quedan en `window.__meta`, que es lo que leen las aserciones.
 *  2. Todo el tráfico a facebook.net/facebook.com se aborta. Si alguien quita el
 *     grabador, sigue sin poder salir un evento.
 *
 * Para probar el píxel de verdad (la guarda de dominio de index.html):
 *   test.use({ pixelReal: true })
 * Esa prueba se hace responsable de que nada llegue a Meta.
 */
export const test = base.extend({
  pixelReal: [false, { option: true }],

  page: async ({ page, pixelReal }, use) => {
    if (!pixelReal) {
      await page.addInitScript(() => {
        window.__meta = []
        window.fbq = (...args) => window.__meta.push(args)
      })
      await page.route(/facebook\.(net|com)/, (route) => route.abort())
    }
    await use(page)
  },
})

export { expect }

/** Eventos que el código intentó enviar al píxel en esta página. */
export const eventosMeta = (page) => page.evaluate(() => window.__meta || [])
