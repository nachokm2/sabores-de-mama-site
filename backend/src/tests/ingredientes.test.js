import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'

import app from '../app.js'
import { pool } from '../models/index.js'
import { runMigrations } from '../models/migrations.js'

async function crearPlatoConIngredientes(nombre, ingredientes) {
  const { rows } = await pool.query(
    `INSERT INTO platos (nombre, categoria, activo) VALUES ($1, 'Test', true) RETURNING id`,
    [nombre]
  )
  const id = rows[0].id
  for (const ing of ingredientes) {
    await pool.query(
      `INSERT INTO ingredientes (plato_id, nombre, cantidad, unidad) VALUES ($1,$2,$3,$4)`,
      [id, ing.nombre, ing.cantidad, ing.unidad]
    )
  }
  return id
}

beforeAll(async () => {
  await runMigrations()
})

afterAll(async () => {
  await pool.end()
})

beforeEach(async () => {
  await pool.query('TRUNCATE platos, ingredientes RESTART IDENTITY CASCADE')
})

describe('GET /api/platos/ingredientes (consolidación)', () => {
  it('devuelve los ingredientes consolidados de los platos solicitados', async () => {
    const a = await crearPlatoConIngredientes('Plato A', [
      { nombre: 'Arroz', cantidad: '200', unidad: 'g' },
      { nombre: 'Pollo', cantidad: '500', unidad: 'g' },
    ])
    const b = await crearPlatoConIngredientes('Plato B', [
      { nombre: 'Arroz', cantidad: '150', unidad: 'g' },
      { nombre: 'Sal', cantidad: '1', unidad: 'cdta' },
    ])

    const res = await request(app).get(`/api/platos/ingredientes?platos=${a},${b}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.ingredientes)).toBe(true)
    // 3 ingredientes distintos: Arroz (consolidado), Pollo, Sal.
    expect(res.body.ingredientes).toHaveLength(3)

    const arroz = res.body.ingredientes.find((i) => i.nombre === 'Arroz')
    expect(arroz.platos.sort()).toEqual([a, b].sort())
  })

  it('si dos platos usan "arroz 200g" y "arroz 150g", el total es "arroz 350g"', async () => {
    const a = await crearPlatoConIngredientes('A', [{ nombre: 'arroz', cantidad: '200', unidad: 'g' }])
    const b = await crearPlatoConIngredientes('B', [{ nombre: 'arroz', cantidad: '150', unidad: 'g' }])

    const res = await request(app).get(`/api/platos/ingredientes?platos=${a},${b}`)

    expect(res.status).toBe(200)
    const arroz = res.body.ingredientes.find((i) => /arroz/i.test(i.nombre))
    expect(arroz.cantidad_total).toBe(350)
    expect(arroz.unidad).toBe('g')
  })

  it('con el parámetro platos inválido devuelve 400', async () => {
    const r1 = await request(app).get('/api/platos/ingredientes?platos=abc,xyz')
    expect(r1.status).toBe(400)

    const r2 = await request(app).get('/api/platos/ingredientes')
    expect(r2.status).toBe(400)
  })
})
