import { Router } from 'express'
import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { query } from '../models/index.js'
import { authJWT } from '../middleware/authJWT.js'
import { sendPasswordReset } from '../services/mailService.js'

const router = Router()

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, nombre: user.nombre, rol: user.rol },
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

/**
 * POST /api/auth/login  — admin o cliente (se distingue por `rol`).
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son obligatorios.' })
    }
    const { rows } = await query(
      'SELECT id, email, password_hash, nombre, telefono, direccion, rol FROM admin_users WHERE email = $1',
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
router.post('/registro', async (req, res, next) => {
  try {
    const { nombre, email, password, telefono, direccion } = req.body || {}
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios.' })
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' })
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
       RETURNING id, email, nombre, telefono, direccion, rol`,
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
router.post('/recuperar', async (req, res, next) => {
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
router.post('/reset', async (req, res, next) => {
  try {
    const { token, password } = req.body || {}
    if (!token || !password) return res.status(400).json({ error: 'Token y contraseña son obligatorios.' })
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' })
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
    await query(
      'UPDATE admin_users SET password_hash = $1, reset_token = NULL, reset_token_exp = NULL WHERE id = $2',
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
 */
router.patch('/perfil', authJWT, async (req, res, next) => {
  try {
    const { nombre, telefono, direccion, password } = req.body || {}
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
      if (String(password).length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' })
      }
      params.push(await bcrypt.hash(password, 10))
      sets.push(`password_hash = $${params.length}`)
    }
    if (!sets.length) return res.status(400).json({ error: 'No hay campos para actualizar.' })

    params.push(req.admin.sub)
    const { rows } = await query(
      `UPDATE admin_users SET ${sets.join(', ')} WHERE id = $${params.length}
       RETURNING id, email, nombre, telefono, direccion, rol`,
      params
    )
    if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado.' })
    return res.json({ user: publicUser(rows[0]) })
  } catch (err) {
    next(err)
  }
})

export default router
