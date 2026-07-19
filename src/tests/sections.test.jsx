import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import Hero from '../components/sections/Hero'
import Marquee from '../components/sections/Marquee'
import MenuSection from '../components/sections/MenuSection'
import Storytelling from '../components/sections/Storytelling'
import Testimonials from '../components/sections/Testimonials'
import WhatsAppCTA from '../components/sections/WhatsAppCTA'
import FamilyStory from '../components/sections/FamilyStory'
import Gallery from '../components/sections/Gallery'
import FAQ from '../components/sections/FAQ'

/**
 * R-01 · Test de regresión visual de las secciones.
 *
 * Tras el rediseño a tema claro:
 *  1. Cada sección debe renderizar sin errores.
 *  2. Ninguna sección debe conservar fondos oscuros hardcodeados (paleta dark
 *     genérica de Tailwind o los tokens oscuros heredados usados como fondo).
 *  3. `text-white` sólo puede aparecer sobre el verde de marca de WhatsApp.
 *
 * Nota: se permiten los tonos oscuros con opacidad (p. ej. `bg-espresso/[0.04]`
 * como tinte sutil, o `bg-espresso/70` como overlay SOBRE fotos/vídeo), ya que
 * no oscurecen la sección — son matices/legibilidad sobre medios.
 */

const SECTIONS = [
  ['Hero', Hero],
  ['Marquee', Marquee],
  ['MenuSection', MenuSection],
  ['Storytelling', Storytelling],
  ['Testimonials', Testimonials],
  ['WhatsAppCTA', WhatsAppCTA],
  ['FamilyStory', FamilyStory],
  ['Gallery', Gallery],
  ['FAQ', FAQ],
]

// Patrones de fondo OSCURO que no deben existir en el tema claro.
// Se excluyen deliberadamente los tonos con opacidad (`bg-espresso/...`), que
// son tintes/overlays válidos sobre superficies claras o medios.
const DARK_CLASS_PATTERNS = [
  /\bbg-(gray|slate|zinc|neutral|stone)-(700|800|900|950)\b/,
  /\bbg-black\b/,
  /\btext-black\b/,
  /\bbg-espresso(?![/\w-])/, // bg-espresso sólido (sin /opacidad)
  /\bbg-bark(?![/\w-])/, // bg-bark sólido (sin /opacidad)
]

function renderSection(Component) {
  return render(
    <MemoryRouter>
      <Component />
    </MemoryRouter>
  )
}

describe('Regresión visual de secciones (tema claro)', () => {
  it.each(SECTIONS)('%s se renderiza sin errores tras el rediseño', (_name, Component) => {
    const { container } = renderSection(Component)
    // Si render() hubiese lanzado, el test ya habría fallado; además
    // confirmamos que produjo marcado real.
    expect(container.innerHTML.length).toBeGreaterThan(0)
    expect(container.firstChild).not.toBeNull()
  })

  it.each(SECTIONS)('%s no contiene clases de fondo oscuro hardcodeadas', (_name, Component) => {
    const { container } = renderSection(Component)
    const html = container.innerHTML
    for (const pattern of DARK_CLASS_PATTERNS) {
      expect(html, `Se encontró una clase oscura que coincide con ${pattern}`).not.toMatch(pattern)
    }
  })

  it.each(SECTIONS)('%s sólo usa text-white sobre el verde de WhatsApp (#25D366)', (_name, Component) => {
    const { container } = renderSection(Component)
    const whiteTextEls = container.querySelectorAll('[class*="text-white"]')
    whiteTextEls.forEach((el) => {
      expect(
        el.getAttribute('class'),
        'text-white sólo está permitido en los CTA verdes de WhatsApp'
      ).toMatch(/#25D366/)
    })
  })
})
