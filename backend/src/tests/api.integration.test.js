import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import request from 'supertest'

// El envío de correos se mockea (los tests de plantillas viven en mailService.test.js).
vi.mock('../services/mailService.js', () => ({
  sendEstadoEmail: vi.fn().mockResolvedValue({ ok: true, skipped: true }),
  sendPasswordReset: vi.fn().mockResolvedValue({ ok: true, skipped: true }),
  ESTADOS_VALIDOS: ['solicitud_recibida', 'pagado', 'en_preparacion', 'entregado'],
}))

import app from '../app.js'
import { pool } from '../models/index.js'
import { runMigrations } from '../models/migrations.js'
import { pedidosRateLimiter } from '../middleware/rateLimiter.js'
import { sendEstadoEmail } from '../services/mailService.js'

const ADMIN = { email: 'admin@test.com', password: 'test1234' }

const pedidoValido = (over = {}) => ({
  nombre: 'María González',
  email: 'maria@example.com',
  telefono: '+56 9 1111 1111',
  fecha_entrega: '2026-12-01',
  servicio: 'meal_prep',
  platos: [{ id: 1, nombre: 'Pollo al Curry' }],
  total: 60000,
  ...over,
})

async function login() {
  const res = await request(app).post('/api/auth/login').send(ADMIN)
  return res.body.token
}

async function seedCupo(fecha, capacidad = 5, activo = true) {
  // Cupos por servicio: se siembra capacidad para AMBOS servicios.
  await pool.query(
    `INSERT INTO cupos
       (fecha, capacidad_maxima, pedidos_confirmados, activo,
        capacidad_meal_prep, capacidad_cocinera,
        confirmados_meal_prep, confirmados_cocinera,
        activo_meal_prep, activo_cocinera)
     VALUES ($1, $2, 0, $3, $2, $2, 0, 0, $3, $3)`,
    [fecha, capacidad, activo]
  )
}

beforeAll(async () => {
  await runMigrations() // crea tablas en sabores_test + seedea el admin de test
})

afterAll(async () => {
  await pool.end()
})

beforeEach(async () => {
  await pool.query('TRUNCATE pedidos, cupos, ingredientes, platos, productos_hornear RESTART IDENTITY CASCADE')
  pedidosRateLimiter.reset()
  sendEstadoEmail.mockClear()
})

describe('Auth / JWT', () => {
  it('login con credenciales correctas devuelve un token', async () => {
    const res = await request(app).post('/api/auth/login').send(ADMIN)
    expect(res.status).toBe(200)
    expect(res.body.token).toBeTruthy()
    expect(res.body.user.email).toBe(ADMIN.email)
  })

  it('login con password incorrecta devuelve 401', async () => {
    const res = await request(app).post('/api/auth/login').send({ ...ADMIN, password: 'malo' })
    expect(res.status).toBe(401)
  })

  it('GET /api/pedidos sin token devuelve 401', async () => {
    const res = await request(app).get('/api/pedidos')
    expect(res.status).toBe(401)
  })

  it('GET /api/pedidos con token válido devuelve 200', async () => {
    const token = await login()
    const res = await request(app).get('/api/pedidos').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.pedidos)).toBe(true)
  })
})

describe('Registro y perfil de cliente (dirección)', () => {
  it('el registro guarda la dirección y la devuelve en el usuario', async () => {
    const res = await request(app).post('/api/auth/registro').send({
      nombre: 'Cliente Dir',
      email: 'cliente.dir@example.com',
      password: 'secreto123',
      telefono: '+56900000000',
      direccion: 'Av. Siempre Viva 742, Ñuñoa',
    })
    expect(res.status).toBe(201)
    expect(res.body.user.rol).toBe('cliente')
    expect(res.body.user.direccion).toBe('Av. Siempre Viva 742, Ñuñoa')

    const { rows } = await pool.query('SELECT direccion FROM admin_users WHERE email = $1', ['cliente.dir@example.com'])
    expect(rows[0].direccion).toBe('Av. Siempre Viva 742, Ñuñoa')
  })

  it('PATCH /api/auth/perfil actualiza la dirección', async () => {
    const reg = await request(app).post('/api/auth/registro').send({
      nombre: 'Cliente Dir2',
      email: 'cliente.dir2@example.com',
      password: 'secreto123',
    })
    const token = reg.body.token
    const res = await request(app)
      .patch('/api/auth/perfil')
      .set('Authorization', `Bearer ${token}`)
      .send({ direccion: 'Nueva 123, Maipú' })
    expect(res.status).toBe(200)
    expect(res.body.user.direccion).toBe('Nueva 123, Maipú')
  })
})

describe('POST /api/pedidos', () => {
  it('valida los campos obligatorios (400)', async () => {
    const res = await request(app).post('/api/pedidos').send({})
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/nombre|email|fecha_entrega|servicio/)
  })

  it('crea el pedido y reserva el cupo (201)', async () => {
    await seedCupo('2026-12-01', 5)
    const res = await request(app).post('/api/pedidos').send(pedidoValido())

    expect(res.status).toBe(201)
    expect(res.body.pedido.id).toBeTruthy()
    expect(res.body.pedido.estado).toBe('solicitud_recibida')

    const { rows } = await pool.query('SELECT confirmados_meal_prep FROM cupos WHERE fecha = $1', ['2026-12-01'])
    expect(rows[0].confirmados_meal_prep).toBe(1)

    // Dispara el correo de solicitud_recibida.
    expect(sendEstadoEmail).toHaveBeenCalledWith(expect.objectContaining({ id: res.body.pedido.id }), 'solicitud_recibida')
  })

  it('sin cupo configurado para la fecha devuelve 409', async () => {
    const res = await request(app).post('/api/pedidos').send(pedidoValido({ fecha_entrega: '2026-12-15' }))
    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/cupo/i)
  })

  it('lock optimista: con capacidad 1, el segundo pedido recibe 409', async () => {
    await seedCupo('2026-12-02', 1)
    const p = pedidoValido({ fecha_entrega: '2026-12-02' })

    const r1 = await request(app).post('/api/pedidos').send(p)
    const r2 = await request(app).post('/api/pedidos').send(p)

    expect(r1.status).toBe(201)
    expect(r2.status).toBe(409)

    const { rows } = await pool.query('SELECT confirmados_meal_prep FROM cupos WHERE fecha = $1', ['2026-12-02'])
    expect(rows[0].confirmados_meal_prep).toBe(1) // no se sobre-reservó
  })

  it('los cupos son independientes por servicio (agotar meal_prep no afecta a cocinera)', async () => {
    await seedCupo('2026-12-05', 1) // capacidad 1 para cada servicio

    // meal_prep: el primero entra, el segundo recibe 409 (lleno).
    const r1 = await request(app).post('/api/pedidos').send(pedidoValido({ fecha_entrega: '2026-12-05', servicio: 'meal_prep' }))
    const r2 = await request(app).post('/api/pedidos').send(pedidoValido({ fecha_entrega: '2026-12-05', servicio: 'meal_prep' }))
    expect(r1.status).toBe(201)
    expect(r2.status).toBe(409)

    // cocinera conserva su cupo intacto.
    const r3 = await request(app).post('/api/pedidos').send(pedidoValido({ fecha_entrega: '2026-12-05', servicio: 'cocinera' }))
    expect(r3.status).toBe(201)

    const { rows } = await pool.query(
      'SELECT confirmados_meal_prep, confirmados_cocinera FROM cupos WHERE fecha = $1',
      ['2026-12-05']
    )
    expect(rows[0].confirmados_meal_prep).toBe(1)
    expect(rows[0].confirmados_cocinera).toBe(1)
  })
})

describe('PATCH /api/pedidos/:id/estado', () => {
  async function crearPedidoDirecto() {
    const { rows } = await pool.query(
      `INSERT INTO pedidos (nombre, email, fecha_entrega, servicio, platos, total)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6) RETURNING id`,
      ['Cliente', 'cliente@example.com', '2026-12-03', 'meal_prep', JSON.stringify([{ id: 1, nombre: 'X' }]), 60000]
    )
    return rows[0].id
  }

  it('sin token devuelve 401', async () => {
    const id = await crearPedidoDirecto()
    const res = await request(app).patch(`/api/pedidos/${id}/estado`).send({ estado: 'pagado' })
    expect(res.status).toBe(401)
  })

  it('con token cambia el estado y dispara el correo (200)', async () => {
    const id = await crearPedidoDirecto()
    const token = await login()
    const res = await request(app)
      .patch(`/api/pedidos/${id}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({ estado: 'pagado' })

    expect(res.status).toBe(200)
    expect(res.body.pedido.estado).toBe('pagado')
    expect(sendEstadoEmail).toHaveBeenCalledWith(expect.objectContaining({ id }), 'pagado')
  })

  it('estado inválido devuelve 400', async () => {
    const id = await crearPedidoDirecto()
    const token = await login()
    const res = await request(app)
      .patch(`/api/pedidos/${id}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({ estado: 'inexistente' })
    expect(res.status).toBe(400)
  })
})

describe('Rate limiter (10 req/min por IP en /api/pedidos)', () => {
  it('permite 10 solicitudes y bloquea la 11ª con 429', async () => {
    const statuses = []
    for (let i = 0; i < 11; i++) {
      // Sin token → 401 si pasa el limiter; 429 cuando se supera el límite.
      const res = await request(app).get('/api/pedidos')
      statuses.push(res.status)
    }
    // Las primeras 10 NO son 429; la 11ª sí.
    expect(statuses.slice(0, 10).every((s) => s !== 429)).toBe(true)
    expect(statuses[10]).toBe(429)
  })
})

describe('POST /api/pedidos servicio=cocinera + lista_compras', () => {
  it('guarda el servicio cocinera y la lista_compras EDITADA en la BD', async () => {
    await seedCupo('2026-12-20', 5)
    // Lista de compras editada por el cliente (cantidad de Arroz ajustada a 500).
    const listaEditada = [
      { nombre: 'Arroz', cantidad: 500, unidad: 'g' },
      { nombre: 'Pollo', cantidad: 1, unidad: 'u' },
    ]
    const res = await request(app)
      .post('/api/pedidos')
      .send(pedidoValido({ fecha_entrega: '2026-12-20', servicio: 'cocinera', lista_compras: listaEditada, personas: 4 }))

    expect(res.status).toBe(201)
    expect(res.body.pedido.servicio).toBe('cocinera')
    expect(res.body.pedido.personas).toBe(4)

    // Verificar la persistencia leyendo directamente de la BD.
    const { rows } = await pool.query('SELECT servicio, lista_compras, personas FROM pedidos WHERE id = $1', [res.body.pedido.id])
    expect(rows[0].servicio).toBe('cocinera')
    expect(rows[0].lista_compras).toEqual(listaEditada)
    expect(rows[0].personas).toBe(4)
  })
})
