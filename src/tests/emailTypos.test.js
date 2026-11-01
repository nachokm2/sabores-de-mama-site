import { describe, it, expect } from 'vitest'
import { sugerirEmail } from '../lib/emailTypos'

describe('sugerirEmail', () => {
  it.each([
    ['toto.fernanda@gamil.com', 'toto.fernanda@gmail.com'],
    ['ana@gmial.com', 'ana@gmail.com'],
    ['ana@gmail.co', 'ana@gmail.com'],
    ['ana@gmail.cl', 'ana@gmail.com'],
    ['Ana.Perez@HOTMIAL.COM', 'Ana.Perez@hotmail.com'],
    ['ana@outlok.com', 'ana@outlook.com'],
    ['ana@yaho.es', 'ana@yahoo.es'],
  ])('%s → %s', (email, esperado) => {
    expect(sugerirEmail(email)).toBe(esperado)
  })

  it.each(['ana@gmail.com', 'ana@hotmail.cl', 'ana@uc.cl', 'ana@empresa.cl', 'ana@saboresdemama.com', '', 'no-es-email'])(
    'no sugiere nada para %s',
    (email) => {
      expect(sugerirEmail(email)).toBeNull()
    }
  )
})
