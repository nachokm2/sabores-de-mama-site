import { describe, it, expect } from 'vitest'
import tailwindConfig from '../../tailwind.config.js'

/**
 * R-01 · Test de tokens y contraste de colores del tema claro.
 *
 * Verifica que el sistema de tokens definido en tailwind.config.js existe
 * (primary / background / text / accent + alias heredados) y que los pares
 * texto/fondo principales cumplen el contraste mínimo WCAG AA (≥ 4.5:1 para
 * texto normal).
 */

const colors = tailwindConfig.theme.extend.colors

// ── Utilidades WCAG ─────────────────────────────────────────────────────────
function relativeLuminance(hex) {
  const channels = hex
    .replace('#', '')
    .match(/.{2}/g)
    .map((h) => parseInt(h, 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)))
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function contrastRatio(a, b) {
  const l1 = relativeLuminance(a)
  const l2 = relativeLuminance(b)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

const HEX = /^#([0-9a-fA-F]{6})$/

describe('Tema claro · existencia de tokens', () => {
  it('expone la paleta de colores en theme.extend.colors', () => {
    expect(colors).toBeDefined()
    expect(typeof colors).toBe('object')
  })

  it.each(['primary', 'background', 'text', 'accent'])(
    'define el token semántico "%s" con un valor DEFAULT en formato hex',
    (token) => {
      expect(colors[token], `Falta el token "${token}"`).toBeDefined()
      expect(colors[token].DEFAULT, `"${token}.DEFAULT" no está definido`).toBeDefined()
      expect(colors[token].DEFAULT).toMatch(HEX)
    }
  )

  it('define una escala de acento con el tono accent-600 usado para texto AA', () => {
    expect(colors.accent['600']).toBeDefined()
    expect(colors.accent['600']).toMatch(HEX)
  })

  it('define las superficies de fondo claras (surface, soft, warm)', () => {
    expect(colors.background.surface).toMatch(HEX)
    expect(colors.background.soft).toMatch(HEX)
    expect(colors.background.warm).toMatch(HEX)
  })

  it('define el texto principal y el texto atenuado (muted)', () => {
    expect(colors.text.DEFAULT).toMatch(HEX)
    expect(colors.text.muted).toMatch(HEX)
  })

  it.each(['espresso', 'ivory', 'amber', 'terracotta', 'cream', 'warm-gray'])(
    'conserva el alias heredado "%s" para no romper clases existentes',
    (alias) => {
      expect(colors[alias], `Falta el alias heredado "${alias}"`).toBeDefined()
      expect(colors[alias]).toMatch(HEX)
    }
  )
})

describe('Tema claro · contraste WCAG AA (≥ 4.5:1)', () => {
  const AA_NORMAL = 4.5

  it('los titulares (text.DEFAULT) contrastan con el fondo de página', () => {
    expect(contrastRatio(colors.text.DEFAULT, colors.background.DEFAULT)).toBeGreaterThanOrEqual(AA_NORMAL)
  })

  it('el cuerpo de texto atenuado (text.muted) contrasta con el fondo de página', () => {
    expect(contrastRatio(colors.text.muted, colors.background.DEFAULT)).toBeGreaterThanOrEqual(AA_NORMAL)
  })

  it('el cuerpo de texto atenuado contrasta también sobre la superficie crema (soft)', () => {
    expect(contrastRatio(colors.text.muted, colors.background.soft)).toBeGreaterThanOrEqual(AA_NORMAL)
  })

  it('la etiqueta de acento (accent-600) contrasta con el fondo de página', () => {
    expect(contrastRatio(colors.accent['600'], colors.background.DEFAULT)).toBeGreaterThanOrEqual(AA_NORMAL)
  })

  it('el color primary (terracota) contrasta como texto sobre el fondo de página', () => {
    expect(contrastRatio(colors.primary.DEFAULT, colors.background.DEFAULT)).toBeGreaterThanOrEqual(AA_NORMAL)
  })

  it('el texto claro (ivory) sobre el botón primary (terracota) cumple AA', () => {
    expect(contrastRatio(colors.ivory, colors.primary.DEFAULT)).toBeGreaterThanOrEqual(AA_NORMAL)
  })

  it('el texto del legacy "warm-gray" no es negro puro pero sí legible (AA) sobre el fondo', () => {
    expect(colors['warm-gray'].toUpperCase()).not.toBe('#000000')
    expect(contrastRatio(colors['warm-gray'], colors.background.DEFAULT)).toBeGreaterThanOrEqual(AA_NORMAL)
  })
})
