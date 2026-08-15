import { describe, it, expect, afterEach } from 'vitest'
import { resumenToken, resumenTokenValido, surveyToken, tokenValido } from '../utils/tokens.js'

describe('Tokens HMAC de pedido y encuesta', () => {
  const originales = {
    JWT_SECRET: process.env.JWT_SECRET,
    SURVEY_SECRET: process.env.SURVEY_SECRET,
    RESUMEN_SECRET: process.env.RESUMEN_SECRET,
  }

  afterEach(() => {
    for (const [k, v] of Object.entries(originales)) {
      if (v === undefined) delete process.env[k]
      else process.env[k] = v
    }
  })

  it('el token de resumen sólo valida contra su propio pedido', () => {
    const t = resumenToken(42)
    expect(resumenTokenValido(42, t)).toBe(true)
    expect(resumenTokenValido(43, t)).toBe(false)
  })

  it('un token de encuesta NO sirve como token de resumen (separación por propósito)', () => {
    expect(resumenTokenValido(42, surveyToken(42))).toBe(false)
    expect(tokenValido(42, resumenToken(42))).toBe(false)
  })

  it('un token vacío o mal formado no valida', () => {
    expect(resumenTokenValido(42, '')).toBe(false)
    expect(resumenTokenValido(42, undefined)).toBe(false)
    expect(resumenTokenValido(42, 'no-es-un-token')).toBe(false)
  })

  it('sin secreto configurado LANZA en vez de caer a uno por defecto', () => {
    // Antes existía el literal 'sabores-token-secret' como fallback. En un repo
    // público eso hacía todos los tokens forjables, y en silencio.
    delete process.env.JWT_SECRET
    delete process.env.SURVEY_SECRET
    delete process.env.RESUMEN_SECRET

    expect(() => resumenToken(1)).toThrow(/JWT_SECRET/)
    expect(() => surveyToken(1)).toThrow(/JWT_SECRET/)
  })
})
