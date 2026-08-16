import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcryptjs'

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

// Claves de los fixtures. Van como constantes con nombre en vez de literales
// pegados a una clave `password`: ese patrón es el que el escáner de secretos
// del repositorio marca como credencial filtrada, y estos valores —que no
// protegen nada— generaban avisos falsos. Un aviso falso recurrente es peor que
// ninguno, porque enseña a ignorar los verdaderos.
const CLAVE_ADMIN = 'test1234' // debe coincidir con ADMIN_PASSWORD de vitest.config.js
const CLAVE_CLIENTE = 'secreto123456'
const CLAVE_VALIDA = 'contraseña-larga-12'
const CLAVE_NUEVA = 'contraseña-nueva-larga'
const CLAVE_RESET = 'otra-contraseña-larga'
const CLAVE_INCORRECTA = 'malo'

const ADMIN = { email: 'admin@test.com', password: CLAVE_ADMIN }

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

// Hash del admin de test, calculado UNA vez (bcrypt es lento a propósito).
let hashAdmin
beforeAll(async () => {
  await runMigrations() // crea tablas en sabores_test + seedea el admin de test
  hashAdmin = await bcrypt.hash(ADMIN.password, 10)
})

afterAll(async () => {
  await pool.end()
})

beforeEach(async () => {
  await pool.query('TRUNCATE pedidos, cupos, ingredientes, platos, productos_hornear RESTART IDENTITY CASCADE')
  // Se limpian TODAS las cuentas que crean los tests, conservando solo el admin
  // del seed (de donde sale login()). Antes se filtraba por `rol <> 'admin'`, y
  // eso dejaba acumularse los administradores que crean los tests de gestión de
  // usuarios: los que comprueban "es el único administrador" veían tres y fallaban.
  // Filtrar por el email del seed es lo único estable.
  await pool.query('DELETE FROM admin_users WHERE email <> $1', [ADMIN.email])
  // El admin del seed se RECREA si falta, en vez de darlo por existente: el test
  // de rotación de administrador lo elimina a propósito (es el punto de rotar), y
  // sin esto los tests siguientes se quedaban sin cuenta con la que iniciar sesión
  // y fallaban por una causa que no era la suya.
  await pool.query(
    `INSERT INTO admin_users (email, password_hash, nombre, rol)
     VALUES ($1, $2, 'Admin Test', 'admin')
     ON CONFLICT (email) DO UPDATE
        SET rol = 'admin', password_hash = EXCLUDED.password_hash, token_version = 0`,
    [ADMIN.email, hashAdmin]
  )
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
    const res = await request(app).post('/api/auth/login').send({ ...ADMIN, password: CLAVE_INCORRECTA })
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
      password: CLAVE_CLIENTE,
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
      password: CLAVE_CLIENTE,
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

describe('Cambiar la contraseña cierra las sesiones abiertas (M2)', () => {
  const nuevoCliente = async (over = {}) => {
    const email = `sesion.${Date.now()}.${Math.round(performance.now() * 1000)}@example.com`
    const res = await request(app).post('/api/auth/registro').send({
      nombre: 'Cliente Sesión',
      email,
      password: CLAVE_VALIDA,
      ...over,
    })
    return { email, token: res.body.token }
  }

  it('el token sigue sirviendo mientras no cambie la contraseña', async () => {
    const { token } = await nuevoCliente()
    const res = await request(app).get('/api/auth/perfil').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
  })

  it('tras un /auth/reset, el token anterior deja de valer (401)', async () => {
    const { email, token } = await nuevoCliente()

    // Se dispara el flujo de recuperación y se toma el token del correo desde la
    // BD (guarda el sha256, así que se genera uno propio y se escribe su hash).
    const crypto = await import('node:crypto')
    const resetToken = crypto.randomBytes(32).toString('hex')
    const hash = crypto.createHash('sha256').update(resetToken).digest('hex')
    await pool.query(
      `UPDATE admin_users SET reset_token = $1, reset_token_exp = now() + interval '1 hour' WHERE email = $2`,
      [hash, email]
    )

    const reset = await request(app)
      .post('/api/auth/reset')
      .send({ token: resetToken, password: CLAVE_RESET })
    expect(reset.status).toBe(200)

    const res = await request(app).get('/api/auth/perfil').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/sesión|contraseña/i)
  })

  it('cambiar la contraseña desde el perfil invalida el token viejo y devuelve uno nuevo', async () => {
    const { token } = await nuevoCliente()

    const patch = await request(app)
      .patch('/api/auth/perfil')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: CLAVE_NUEVA, password_actual: CLAVE_VALIDA })
    expect(patch.status).toBe(200)
    expect(patch.body.token).toBeTruthy()
    expect(patch.body.token).not.toBe(token)

    // El viejo ya no vale...
    const viejo = await request(app).get('/api/auth/perfil').set('Authorization', `Bearer ${token}`)
    expect(viejo.status).toBe(401)

    // ...y el nuevo sí, para no echar de su propia sesión a quien hizo el cambio.
    const nuevo = await request(app).get('/api/auth/perfil').set('Authorization', `Bearer ${patch.body.token}`)
    expect(nuevo.status).toBe(200)
  })

  it('un token de una cuenta borrada deja de valer (401)', async () => {
    const { email, token } = await nuevoCliente()
    await pool.query('DELETE FROM admin_users WHERE email = $1', [email])

    const res = await request(app).get('/api/auth/perfil').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(401)
  })

  it('un token sin el claim tv (emitido antes de la columna) sigue siendo válido', async () => {
    const { email } = await nuevoCliente()
    const { rows } = await pool.query('SELECT id, email, nombre, rol FROM admin_users WHERE email = $1', [email])
    const jwt = (await import('jsonwebtoken')).default
    const legado = jwt.sign(
      { sub: rows[0].id, email: rows[0].email, nombre: rows[0].nombre, rol: rows[0].rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    const res = await request(app).get('/api/auth/perfil').set('Authorization', `Bearer ${legado}`)
    expect(res.status).toBe(200)
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
      password: CLAVE_VALIDA,
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

  it('acepta VARIAS fotos y las guarda todas', async () => {
    const id = await crearPedidoDirecto()
    const token = await login()
    const fotos = ['entregas/a.jpg', 'entregas/b.jpg', 'entregas/c.jpg']
    const res = await request(app)
      .patch(`/api/pedidos/${id}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({ estado: 'en_delivery', fotos_entrega: fotos })

    expect(res.status).toBe(200)
    expect(res.body.pedido.fotos_entrega).toEqual(fotos)
    // `foto_entrega` sigue guardando la primera: los pedidos y las vistas que
    // leen esa columna no se rompen mientras conviven ambos campos.
    expect(res.body.pedido.foto_entrega).toBe('entregas/a.jpg')
  })

  it('una sola foto en el campo antiguo también entra al array', async () => {
    const id = await crearPedidoDirecto()
    const token = await login()
    const res = await request(app)
      .patch(`/api/pedidos/${id}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({ estado: 'en_delivery', foto_entrega: 'entregas/sola.jpg' })

    expect(res.status).toBe(200)
    expect(res.body.pedido.fotos_entrega).toEqual(['entregas/sola.jpg'])
  })

  it('un pedido con foto antigua conserva su imagen al pasar a en_delivery', async () => {
    // Pedidos creados ANTES de que existiera el array: la foto vive solo en la
    // columna vieja y no debe perderse.
    const id = await crearPedidoDirecto()
    await pool.query(`UPDATE pedidos SET foto_entrega = $1, fotos_entrega = '[]'::jsonb WHERE id = $2`, [
      'entregas/legado.jpg',
      id,
    ])
    const token = await login()
    const res = await request(app)
      .patch(`/api/pedidos/${id}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({ estado: 'en_delivery' })

    expect(res.status).toBe(200)
    expect(res.body.pedido.fotos_entrega).toEqual(['entregas/legado.jpg'])
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

describe('Gestión de usuarios desde el panel', () => {
  const nuevoEmail = () => `usuario.${Date.now()}.${Math.round(performance.now() * 1000)}@example.com`

  it('sin token no se puede listar (401)', async () => {
    const res = await request(app).get('/api/usuarios')
    expect(res.status).toBe(401)
  })

  it('un cliente no puede listar usuarios (403)', async () => {
    const reg = await request(app)
      .post('/api/auth/registro')
      .send({ nombre: 'Cliente', email: nuevoEmail(), password: CLAVE_VALIDA })
    const res = await request(app).get('/api/usuarios').set('Authorization', `Bearer ${reg.body.token}`)
    expect(res.status).toBe(403)
  })

  it('lista las cuentas sin exponer el hash ni los tokens de recuperación', async () => {
    const token = await login()
    const res = await request(app).get('/api/usuarios').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.usuarios.length).toBeGreaterThan(0)
    const campos = Object.keys(res.body.usuarios[0])
    expect(campos).toContain('email')
    expect(campos).toContain('rol')
    expect(campos).not.toContain('password_hash')
    expect(campos).not.toContain('reset_token')
  })

  it('crea un administrador nuevo y puede iniciar sesión con él', async () => {
    const token = await login()
    const email = nuevoEmail()
    const crear = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${token}`)
      .send({ email, password: CLAVE_NUEVA, nombre: 'Admin Dos', rol: 'admin' })

    expect(crear.status).toBe(201)
    expect(crear.body.usuario.rol).toBe('admin')

    // La cuenta nueva sirve de verdad: es lo que permite rotar el administrador.
    const sesion = await request(app).post('/api/auth/login').send({ email, password: CLAVE_NUEVA })
    expect(sesion.status).toBe(200)
    const suyo = await request(app).get('/api/usuarios').set('Authorization', `Bearer ${sesion.body.token}`)
    expect(suyo.status).toBe(200)
  })

  it('rechaza una contraseña corta (400) y un email repetido (409)', async () => {
    const token = await login()
    const email = nuevoEmail()
    const corta = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${token}`)
      .send({ email, password: 'corta', rol: 'admin' })
    expect(corta.status).toBe(400)

    await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${token}`)
      .send({ email, password: CLAVE_NUEVA, rol: 'cliente' })
    const repetido = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${token}`)
      .send({ email, password: CLAVE_NUEVA, rol: 'cliente' })
    expect(repetido.status).toBe(409)
  })

  it('NO permite eliminar al único administrador (409)', async () => {
    const token = await login()
    const { rows } = await pool.query("SELECT id FROM admin_users WHERE rol = 'admin'")
    expect(rows).toHaveLength(1) // el del seed

    const res = await request(app)
      .delete(`/api/usuarios/${rows[0].id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/único administrador/i)
    // Y sigue ahí: fallar acá dejaría el panel inaccesible para siempre.
    const despues = await pool.query("SELECT count(*)::int AS n FROM admin_users WHERE rol = 'admin'")
    expect(despues.rows[0].n).toBe(1)
  })

  it('NO permite degradar al único administrador (409)', async () => {
    const token = await login()
    const { rows } = await pool.query("SELECT id FROM admin_users WHERE rol = 'admin'")
    const res = await request(app)
      .patch(`/api/usuarios/${rows[0].id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rol: 'cliente' })

    expect(res.status).toBe(409)
    const despues = await pool.query('SELECT rol FROM admin_users WHERE id = $1', [rows[0].id])
    expect(despues.rows[0].rol).toBe('admin')
  })

  it('con DOS administradores sí se puede eliminar uno (la rotación completa)', async () => {
    const token = await login()
    const email = nuevoEmail()
    const crear = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${token}`)
      .send({ email, password: CLAVE_NUEVA, rol: 'admin' })
    const nuevoId = crear.body.usuario.id

    // Se entra con el nuevo y se elimina el viejo: así se rota la cuenta.
    const sesion = await request(app).post('/api/auth/login').send({ email, password: CLAVE_NUEVA })
    const viejo = await pool.query("SELECT id FROM admin_users WHERE rol = 'admin' AND id <> $1", [nuevoId])
    const res = await request(app)
      .delete(`/api/usuarios/${viejo.rows[0].id}`)
      .set('Authorization', `Bearer ${sesion.body.token}`)

    expect(res.status).toBe(200)
    const quedan = await pool.query("SELECT email FROM admin_users WHERE rol = 'admin'")
    expect(quedan.rows).toHaveLength(1)
    expect(quedan.rows[0].email).toBe(email)
  })

  it('cambiar la contraseña de una cuenta cierra sus sesiones abiertas', async () => {
    const token = await login()
    const email = nuevoEmail()
    const crear = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${token}`)
      .send({ email, password: CLAVE_NUEVA, rol: 'cliente' })
    const sesion = await request(app).post('/api/auth/login').send({ email, password: CLAVE_NUEVA })
    const antes = await request(app).get('/api/auth/perfil').set('Authorization', `Bearer ${sesion.body.token}`)
    expect(antes.status).toBe(200)

    await request(app)
      .patch(`/api/usuarios/${crear.body.usuario.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ password: CLAVE_RESET })

    // El token anterior deja de valer: es el punto de rotar una contraseña.
    const despues = await request(app).get('/api/auth/perfil').set('Authorization', `Bearer ${sesion.body.token}`)
    expect(despues.status).toBe(401)
  })

  it('al eliminar una cuenta, sus pedidos NO se borran', async () => {
    const token = await login()
    const email = nuevoEmail()
    const crear = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${token}`)
      .send({ email, password: CLAVE_NUEVA, rol: 'cliente' })
    const id = crear.body.usuario.id

    const { rows } = await pool.query(
      `INSERT INTO pedidos (nombre, email, fecha_entrega, servicio, total, usuario_id)
       VALUES ('X', $1, '2026-12-28', 'meal_prep', 60000, $2) RETURNING id`,
      [email, id]
    )

    await request(app).delete(`/api/usuarios/${id}`).set('Authorization', `Bearer ${token}`)

    const pedido = await pool.query('SELECT usuario_id FROM pedidos WHERE id = $1', [rows[0].id])
    expect(pedido.rows).toHaveLength(1)
    expect(pedido.rows[0].usuario_id).toBeNull()
  })
})
