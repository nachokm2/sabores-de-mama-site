import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import request from 'supertest'

// El envío de correos se mockea (los tests de plantillas viven en mailService.test.js).
vi.mock('../services/mailService.js', () => ({
  sendEstadoEmail: vi.fn().mockResolvedValue({ ok: true, skipped: true }),
  sendPasswordReset: vi.fn().mockResolvedValue({ ok: true, skipped: true }),
  ESTADOS_VALIDOS: ['solicitud_recibida', 'pagado', 'en_preparacion', 'en_delivery', 'entregado'],
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
  // Las cuentas de cliente que crean los tests también se limpian: usan emails
  // fijos y `admin_users` no se trunca, así que sin esto la suite pasa la primera
  // vez contra una base y falla con 409 en la segunda (en CI no se notaba porque
  // cada corrida levanta un Postgres nuevo). Se conserva el admin del seed, que
  // es de donde sale el login de los tests.
  await pool.query("DELETE FROM admin_users WHERE rol <> 'admin'")
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
      password: 'secreto123456',
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
      password: 'secreto123456',
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

describe('El total del pedido lo calcula el servidor (A1)', () => {
  const COMUNA = 'Las Condes'

  beforeEach(async () => {
    // Comunas y servicios_config NO se truncan (los siembran las migraciones),
    // así que se fijan valores explícitos para que el test sea determinista.
    await pool.query(
      `UPDATE comunas SET costo_meal_prep = 5000, activo_meal_prep = true WHERE nombre = $1`,
      [COMUNA]
    )
    await pool.query(
      `UPDATE servicios_config SET precio_base = 60000, costo_ingredientes = 1000, costo_porcionado = 3000
        WHERE servicio = 'meal_prep'`
    )
    await seedCupo('2026-12-20', 5)
  })

  const pedidoConDespacho = (over = {}) =>
    pedidoValido({
      fecha_entrega: '2026-12-20',
      tipo_entrega: 'delivery',
      comuna: COMUNA,
      ...over,
    })

  it('ignora un total manipulado y cobra base + despacho', async () => {
    // El ataque: pedido CON despacho enviado con el total del precio base pelado.
    // Antes pasaba el piso (60000 >= 60000) y se guardaba tal cual.
    const res = await request(app)
      .post('/api/pedidos')
      .send(pedidoConDespacho({ total: 60000, costo_despacho: 0 }))

    expect(res.status).toBe(201)
    expect(Number(res.body.pedido.total)).toBe(65000)
    expect(Number(res.body.pedido.costo_despacho)).toBe(5000)
  })

  it('ignora un total absurdo (total: 1)', async () => {
    const res = await request(app).post('/api/pedidos').send(pedidoConDespacho({ total: 1 }))
    expect(res.status).toBe(201)
    expect(Number(res.body.pedido.total)).toBe(65000)
  })

  it('cobra los productos para hornear al precio de la tabla, no al del body', async () => {
    const { rows } = await pool.query(
      `INSERT INTO productos_hornear (nombre, precio, activo) VALUES ('Kuchen', 8000, true) RETURNING id`
    )
    const res = await request(app)
      .post('/api/pedidos')
      .send(
        pedidoConDespacho({
          total: 60000,
          productos_hornear: [{ id: rows[0].id, nombre: 'Kuchen', precio: 1 }],
        })
      )

    expect(res.status).toBe(201)
    expect(Number(res.body.pedido.total)).toBe(73000) // 60000 + 5000 + 8000
  })

  it('cobra los adicionales al precio de servicios_config, no al del body', async () => {
    const res = await request(app)
      .post('/api/pedidos')
      .send(
        pedidoConDespacho({
          total: 60000,
          adicionales: [
            { clave: 'ingredientes', nombre: 'Ingredientes', precio: 0 },
            { clave: 'porcionado', nombre: 'Porcionado', precio: 0 },
          ],
        })
      )

    expect(res.status).toBe(201)
    expect(Number(res.body.pedido.total)).toBe(69000) // 60000 + 5000 + 1000 + 3000
  })

  it('no permite evadir el despacho omitiendo tipo_entrega', async () => {
    const res = await request(app)
      .post('/api/pedidos')
      .send(pedidoConDespacho({ tipo_entrega: undefined, total: 60000 }))

    expect(res.status).toBe(201)
    expect(Number(res.body.pedido.costo_despacho)).toBe(5000)
  })

  it('rechaza (400) un delivery a una comuna sin cobertura y no consume cupo', async () => {
    const res = await request(app)
      .post('/api/pedidos')
      .send(pedidoConDespacho({ comuna: 'Isla de Pascua' }))

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/despacho/i)

    const { rows } = await pool.query('SELECT confirmados_meal_prep FROM cupos WHERE fecha = $1', ['2026-12-20'])
    expect(rows[0].confirmados_meal_prep).toBe(0)
  })

  it('un retiro no paga despacho aunque venga la comuna', async () => {
    const res = await request(app)
      .post('/api/pedidos')
      .send(pedidoConDespacho({ tipo_entrega: 'retiro', total: 99999 }))

    expect(res.status).toBe(201)
    expect(Number(res.body.pedido.total)).toBe(60000)
    expect(Number(res.body.pedido.costo_despacho)).toBe(0)
  })
})

describe('Separación de roles admin/cliente (A2)', () => {
  it('el token de un cliente NO abre los endpoints de admin (403)', async () => {
    const registro = await request(app).post('/api/auth/registro').send({
      nombre: 'Cliente Test',
      email: `cliente.rol.${Date.now()}@example.com`,
      password: 'contraseña-larga-12',
    })
    expect(registro.status).toBe(201)
    expect(registro.body.user.rol).toBe('cliente')

    const res = await request(app)
      .get('/api/pedidos')
      .set('Authorization', `Bearer ${registro.body.token}`)
    expect(res.status).toBe(403)
  })

  it('el rol por defecto de la columna es cliente, no admin', async () => {
    const { rows } = await pool.query(
      `SELECT column_default FROM information_schema.columns
        WHERE table_name = 'admin_users' AND column_name = 'rol'`
    )
    expect(rows[0].column_default).toMatch(/cliente/)
  })

  it('la columna rol solo acepta admin o cliente', async () => {
    await expect(
      pool.query(
        `INSERT INTO admin_users (email, password_hash, nombre, rol)
         VALUES ('rol.invalido@example.com', 'x', 'X', 'superadmin')`
      )
    ).rejects.toThrow()
  })
})

describe('POST /api/pedidos/admin (alta manual)', () => {
  it('sin token devuelve 401', async () => {
    const res = await request(app).post('/api/pedidos/admin').send(pedidoValido())
    expect(res.status).toBe(401)
  })

  it('crea la reserva aunque NO haya cupo configurado (override del admin)', async () => {
    const token = await login()
    const res = await request(app)
      .post('/api/pedidos/admin')
      .set('Authorization', `Bearer ${token}`)
      .send(pedidoValido({ fecha_entrega: '2026-12-25', servicio: 'cocinera', personas: 3 }))
    expect(res.status).toBe(201)
    expect(res.body.pedido.servicio).toBe('cocinera')
    expect(res.body.pedido.personas).toBe(3)
    // No envía correo si no se pide explícitamente.
    expect(sendEstadoEmail).not.toHaveBeenCalled()
  })

  it('descuenta el cupo del servicio si existe (best-effort)', async () => {
    await seedCupo('2026-12-26', 5)
    const token = await login()
    const res = await request(app)
      .post('/api/pedidos/admin')
      .set('Authorization', `Bearer ${token}`)
      .send(pedidoValido({ fecha_entrega: '2026-12-26', servicio: 'meal_prep' }))
    expect(res.status).toBe(201)
    const { rows } = await pool.query('SELECT confirmados_meal_prep FROM cupos WHERE fecha = $1', ['2026-12-26'])
    expect(rows[0].confirmados_meal_prep).toBe(1)
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

  it('NO permite pasar a "en_delivery" sin una foto del pedido (422)', async () => {
    const id = await crearPedidoDirecto()
    const token = await login()
    const res = await request(app)
      .patch(`/api/pedidos/${id}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({ estado: 'en_delivery' })
    expect(res.status).toBe(422)
    expect(res.body.error).toMatch(/fotograf/i)
    // No cambió el estado ni se disparó el correo.
    const { rows } = await pool.query('SELECT estado FROM pedidos WHERE id = $1', [id])
    expect(rows[0].estado).toBe('solicitud_recibida')
    expect(sendEstadoEmail).not.toHaveBeenCalled()
  })

  it('permite "en_delivery" cuando se adjunta la foto y la persiste (200)', async () => {
    const id = await crearPedidoDirecto()
    const token = await login()
    const res = await request(app)
      .patch(`/api/pedidos/${id}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({ estado: 'en_delivery', foto_entrega: 'entregas/foto-123.jpg' })
    expect(res.status).toBe(200)
    expect(res.body.pedido.estado).toBe('en_delivery')
    expect(res.body.pedido.foto_entrega).toBe('entregas/foto-123.jpg')
    expect(sendEstadoEmail).toHaveBeenCalledWith(expect.objectContaining({ id }), 'en_delivery')
  })

  it('permite "en_delivery" si el pedido ya tenía una foto guardada (200)', async () => {
    const id = await crearPedidoDirecto()
    await pool.query('UPDATE pedidos SET foto_entrega = $1 WHERE id = $2', ['entregas/previa.jpg', id])
    const token = await login()
    const res = await request(app)
      .patch(`/api/pedidos/${id}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({ estado: 'en_delivery' })
    expect(res.status).toBe(200)
    expect(res.body.pedido.estado).toBe('en_delivery')
    expect(res.body.pedido.foto_entrega).toBe('entregas/previa.jpg')
  })
})

describe('GET /api/platos (servicio y cantidades exactas)', () => {
  async function seedPlato({ nombre, meal_prep = true, cocinera = true, ingredientes = [] }) {
    const { rows } = await pool.query(
      `INSERT INTO platos (nombre, categoria, activo, meal_prep, cocinera) VALUES ($1,'Cat',true,$2,$3) RETURNING id`,
      [nombre, meal_prep, cocinera]
    )
    const id = rows[0].id
    for (const ing of ingredientes) {
      await pool.query(
        `INSERT INTO ingredientes (plato_id, nombre, unidad, p1, p2, p3, p4, p5) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [id, ing.nombre, ing.unidad, ing.p1, ing.p2, ing.p3, ing.p4, ing.p5]
      )
    }
    return id
  }

  it('?servicio=meal_prep excluye los platos solo-Cocinera', async () => {
    await seedPlato({ nombre: 'Ambos', meal_prep: true, cocinera: true })
    await seedPlato({ nombre: 'Solo Cocinera', meal_prep: false, cocinera: true })

    const mp = await request(app).get('/api/platos?servicio=meal_prep')
    const nombresMp = mp.body.platos.map((p) => p.nombre)
    expect(nombresMp).toContain('Ambos')
    expect(nombresMp).not.toContain('Solo Cocinera')

    const coc = await request(app).get('/api/platos?servicio=cocinera')
    expect(coc.body.platos.map((p) => p.nombre)).toEqual(expect.arrayContaining(['Ambos', 'Solo Cocinera']))
  })

  it('GET /ingredientes?personas=N usa la columna pN y consolida por nombre+unidad', async () => {
    const id1 = await seedPlato({
      nombre: 'P1', ingredientes: [{ nombre: 'Arroz', unidad: 'g', p1: '100', p2: '200', p3: '300', p4: '400', p5: '500' }],
    })
    const id2 = await seedPlato({
      nombre: 'P2', ingredientes: [{ nombre: 'Arroz', unidad: 'g', p1: '50', p2: '50', p3: '50', p4: '50', p5: '50' }],
    })

    const res = await request(app).get(`/api/platos/ingredientes?platos=${id1},${id2}&personas=3`)
    expect(res.status).toBe(200)
    const arroz = res.body.ingredientes.find((i) => i.nombre === 'Arroz')
    expect(arroz.cantidad).toBe(350) // 300 (p3 de P1) + 50 (p3 de P2)
  })
})

describe('POST /api/platos/recargar-catalogo', () => {
  it('sin token devuelve 401', async () => {
    const res = await request(app).post('/api/platos/recargar-catalogo').send({ confirmacion: 'REEMPLAZAR' })
    expect(res.status).toBe(401)
  })

  it('con confirmación inválida devuelve 400', async () => {
    const token = await login()
    const res = await request(app)
      .post('/api/platos/recargar-catalogo')
      .set('Authorization', `Bearer ${token}`)
      .send({ confirmacion: 'no' })
    expect(res.status).toBe(400)
  })

  it('recarga el catálogo completo (200) y separa por servicio', async () => {
    const token = await login()
    const res = await request(app)
      .post('/api/platos/recargar-catalogo')
      .set('Authorization', `Bearer ${token}`)
      .send({ confirmacion: 'REEMPLAZAR' })
    expect(res.status).toBe(200)
    expect(res.body.resumen.totalPlatos).toBe(67)

    const mp = await request(app).get('/api/platos?servicio=meal_prep')
    const nombresMp = mp.body.platos.map((p) => p.nombre)
    expect(nombresMp).toContain('Lasaña')
    expect(nombresMp).not.toContain('Cazuela') // Cazuela es solo Cocinera
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
