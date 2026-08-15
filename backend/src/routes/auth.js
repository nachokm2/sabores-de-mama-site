import { Router } from 'express'
import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { query } from '../models/index.js'
import { authJWT } from '../middleware/authJWT.js'
import { authRateLimiter } from '../middleware/rateLimiter.js'
import { sendPasswordReset } from '../services/mailService.js'

const router = Router()

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      // Versión de sesión: authJWT la contrasta contra la BD, así que al cambiar
      // la contraseña (que la incrementa) los tokens anteriores dejan de valer.
      tv: Number(user.token_version) || 0,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  )
}

// Forma pública del usuario (sin password_hash ni tokens).
function publicUser(u) {
  return {
    id: u.id,
    email: u.email,
    nombre: u.nombre,
    telefono: u.telefono || null,
    direccion: u.direccion || null,
    rol: u.rol,
  }
}

const emailNorm = (e) => String(e || '').toLowerCase().trim()

// Longitud mínima de contraseña. Sube de 6 a 12: con el email del admin conocido
// y sin MFA, 6 caracteres es muy poco. No bloquea a nadie que ya tenga una
// contraseña más corta (el login no valida longitud), solo aplica al fijarla.
const PASSWORD_MIN = 12
const passwordCorta = (p) => String(p).length < PASSWORD_MIN
const ERROR_PASSWORD = `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`

/**
 * POST /api/auth/login  — admin o cliente (se distingue por `rol`).
 */
router.post('/login', authRateLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son obligatorios.' })
    }
    const { rows } = await query(
      'SELECT id, email, password_hash, nombre, telefono, direccion, rol, token_version FROM admin_users WHERE email = $1',
      [emailNorm(email)]
    )
    const user = rows[0]
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Credenciales inválidas.' })
    }
    return res.json({ token: signToken(user), user: publicUser(user) })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/auth/registro  (público) — crea una cuenta de CLIENTE.
 * Body: { nombre, email, password, telefono?, direccion? }
 */
router.post('/registro', authRateLimiter, async (req, res, next) => {
  try {
    const { nombre, email, password, telefono, direccion } = req.body || {}
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios.' })
    }
    if (passwordCorta(password)) {
      return res.status(400).json({ error: ERROR_PASSWORD })
    }
    const correo = emailNorm(email)
    const existe = await query('SELECT 1 FROM admin_users WHERE email = $1', [correo])
    if (existe.rows.length) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese email.' })
    }
    const hash = await bcrypt.hash(password, 10)
    const { rows } = await query(
      `INSERT INTO admin_users (email, password_hash, nombre, telefono, direccion, rol)
       VALUES ($1, $2, $3, $4, $5, 'cliente')
       RETURNING id, email, nombre, telefono, direccion, rol, token_version`,
      [correo, hash, String(nombre).trim(), telefono || null, (direccion && String(direccion).trim()) || null]
    )
    const user = rows[0]
    return res.status(201).json({ token: signToken(user), user: publicUser(user) })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/auth/recuperar  (público) — envía un enlace de recuperación.
 * Siempre responde 200 (no revela si el email existe).
 */
router.post('/recuperar', authRateLimiter, async (req, res, next) => {
  try {
    const { email } = req.body || {}
    if (!email) return res.status(400).json({ error: 'El email es obligatorio.' })
    const { rows } = await query('SELECT id, email FROM admin_users WHERE email = $1', [emailNorm(email)])
    const user = rows[0]
    if (user) {
      const token = crypto.randomBytes(32).toString('hex')
      const hash = crypto.createHash('sha256').update(token).digest('hex')
      const exp = new Date(Date.now() + 60 * 60 * 1000) // 1 hora
      await query('UPDATE admin_users SET reset_token = $1, reset_token_exp = $2 WHERE id = $3', [hash, exp, user.id])
      const base = (process.env.CLIENT_URL || 'https://saboresdemama.com').replace(/\/$/, '')
      const url = `${base}/cuenta/reset?token=${token}`
      sendPasswordReset(user.email, url).catch((e) => console.error('[auth] no se pudo enviar recuperación:', e.message))
    }
    return res.json({ ok: true, message: 'Si el email existe, te enviamos instrucciones para recuperar tu contraseña.' })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/auth/reset  (público) — restablece la contraseña con el token.
 * Body: { token, password }
 */
router.post('/reset', authRateLimiter, async (req, res, next) => {
  try {
    const { token, password } = req.body || {}
    if (!token || !password) return res.status(400).json({ error: 'Token y contraseña son obligatorios.' })
    if (passwordCorta(password)) {
      return res.status(400).json({ error: ERROR_PASSWORD })
    }
    const hash = crypto.createHash('sha256').update(String(token)).digest('hex')
    const { rows } = await query(
      'SELECT id FROM admin_users WHERE reset_token = $1 AND reset_token_exp > now()',
      [hash]
    )
    if (!rows[0]) {
      return res.status(400).json({ error: 'El enlace es inválido o expiró. Solicita uno nuevo.' })
    }
    const newHash = await bcrypt.hash(password, 10)
    // `token_version + 1` cierra TODAS las sesiones abiertas. Es el punto del
    // arreglo: quien recupera su contraseña normalmente lo hace porque sospecha
    // que alguien más entró, y hasta ahora el token del intruso seguía válido.
    await query(
      `UPDATE admin_users
          SET password_hash = $1, reset_token = NULL, reset_token_exp = NULL,
              token_version = token_version + 1
        WHERE id = $2`,
      [newHash, rows[0].id]
    )
    return res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/auth/perfil  (autenticado) — datos del usuario actual.
 */
router.get('/perfil', authJWT, async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, email, nombre, telefono, direccion, rol FROM admin_users WHERE id = $1',
      [req.admin.sub]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado.' })
    return res.json({ user: publicUser(rows[0]) })
  } catch (err) {
    next(err)
  }
})

/**
 * PATCH /api/auth/perfil  (autenticado) — edita nombre, teléfono y/o contraseña.
 * Para cambiar la contraseña exige además `password_actual`: así un token robado
 * (XSS, sesión compartida) no alcanza para apropiarse de la cuenta de forma
 * permanente — el atacante necesitaría también la contraseña vigente.
 */
router.patch('/perfil', authJWT, async (req, res, next) => {
  try {
    const { nombre, telefono, direccion, password, password_actual } = req.body || {}
    const sets = []
    const params = []
    if (nombre !== undefined) {
      params.push(String(nombre).trim())
      sets.push(`nombre = $${params.length}`)
    }
    if (telefono !== undefined) {
      params.push(telefono || null)
      sets.push(`telefono = $${params.length}`)
    }
    if (direccion !== undefined) {
      params.push((direccion && String(direccion).trim()) || null)
      sets.push(`direccion = $${params.length}`)
    }
    if (password) {
      if (passwordCorta(password)) {
        return res.status(400).json({ error: ERROR_PASSWORD })
      }
      if (!password_actual) {
        return res.status(400).json({ error: 'Debes ingresar tu contraseña actual para cambiarla.' })
      }
      const actual = await query('SELECT password_hash FROM admin_users WHERE id = $1', [req.admin.sub])
      if (!actual.rows[0]) return res.status(404).json({ error: 'Usuario no encontrado.' })
      if (!(await bcrypt.compare(String(password_actual), actual.rows[0].password_hash))) {
        return res.status(401).json({ error: 'La contraseña actual no es correcta.' })
      }
      params.push(await bcrypt.hash(password, 10))
      sets.push(`password_hash = $${params.length}`)
      // Cambiar la contraseña cierra las demás sesiones (mismo motivo que en
      // /reset). Como esta petición viene de una sesión legítima, más abajo se
      // devuelve un token nuevo para no echar al usuario de la suya.
      sets.push('token_version = token_version + 1')
    }
    if (!sets.length) return res.status(400).json({ error: 'No hay campos para actualizar.' })

    params.push(req.admin.sub)
    const { rows } = await query(
      `UPDATE admin_users SET ${sets.join(', ')} WHERE id = $${params.length}
       RETURNING id, email, nombre, telefono, direccion, rol, token_version`,
      params
    )
    if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado.' })
    return res.json({
      user: publicUser(rows[0]),
      ...(password ? { token: signToken(rows[0]) } : {}),
    })
  } catch (err) {
    next(err)
  }
})

export default router
