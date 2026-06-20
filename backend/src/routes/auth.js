import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { query } from '../models/index.js'

const router = Router()

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Respuesta: { token, user } si las credenciales son válidas.
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son obligatorios.' })
    }

    const { rows } = await query(
      'SELECT id, email, password_hash, nombre FROM admin_users WHERE email = $1',
      [String(email).toLowerCase().trim()]
    )
    const user = rows[0]

    // Mismo mensaje genérico para usuario inexistente o password incorrecta.
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas.' })
    }

    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) {
      return res.status(401).json({ error: 'Credenciales inválidas.' })
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, nombre: user.nombre },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    )

    return res.json({
      token,
      user: { id: user.id, email: user.email, nombre: user.nombre },
    })
  } catch (err) {
    next(err)
  }
})

export default router
