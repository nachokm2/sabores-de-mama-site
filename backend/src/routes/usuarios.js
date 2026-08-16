import { Router } from 'express'
import { query } from '../models/index.js'
import { hashPassword } from '../utils/password.js'
import { requireAdmin } from '../middleware/authJWT.js'

const router = Router()

/**
 * Gestión de usuarios desde el panel (solo administradores).
 *
 * Existe para poder ROTAR la cuenta de administración sin tocar la base a mano.
 * Antes la única forma de crear un admin era la variable ADMIN_EMAIL del arranque,
 * que además no cambia la contraseña de una cuenta ya existente (el seed usa
 * ON CONFLICT DO NOTHING), así que en la práctica no había manera de rotarla.
 *
 * REGLA QUE NO SE PUEDE VIOLAR: el sistema nunca queda sin administradores. Cada
 * operación que podría dejar cero (borrar, degradar a cliente) se rechaza. Sin
 * eso, un clic dejaría el panel inaccesible para siempre y habría que entrar a
 * PostgreSQL a repararlo.
 */

const ROLES = ['admin', 'cliente']
const PASSWORD_MIN = 12
const emailNorm = (e) => String(e || '').toLowerCase().trim()

// Columnas seguras de exponer: nunca el hash ni los tokens de recuperación.
const COLS = 'id, email, nombre, telefono, rol, created_at'

/** ¿Cuántos administradores quedarían si `excluir` deja de serlo? */
async function otrosAdmins(excluirId) {
  const { rows } = await query(
    "SELECT count(*)::int AS n FROM admin_users WHERE rol = 'admin' AND id <> $1",
    [excluirId]
  )
  return rows[0]?.n || 0
}

/** GET /api/usuarios — lista de cuentas. */
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT ${COLS},
              (SELECT count(*)::int FROM pedidos p WHERE p.usuario_id = u.id) AS pedidos
         FROM admin_users u
        ORDER BY (rol = 'admin') DESC, email ASC`
    )
    return res.json({ usuarios: rows, count: rows.length })
  } catch (err) {
    next(err)
  }
})

/** POST /api/usuarios — crea una cuenta (admin o cliente). */
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { email, password, nombre, telefono } = req.body || {}
    const rol = ROLES.includes(req.body?.rol) ? req.body.rol : 'cliente'

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios.' })
    }
    if (String(password).length < PASSWORD_MIN) {
      return res.status(400).json({ error: `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.` })
    }

    const correo = emailNorm(email)
    const existe = await query('SELECT 1 FROM admin_users WHERE email = $1', [correo])
    if (existe.rows.length) return res.status(409).json({ error: 'Ya existe una cuenta con ese email.' })

    const hash = await hashPassword(password)
    const { rows } = await query(
      `INSERT INTO admin_users (email, password_hash, nombre, telefono, rol)
       VALUES ($1, $2, $3, $4, $5) RETURNING ${COLS}`,
      [correo, hash, (nombre && String(nombre).trim()) || null, telefono || null, rol]
    )
    return res.status(201).json({ usuario: rows[0] })
  } catch (err) {
    next(err)
  }
})

/**
 * PATCH /api/usuarios/:id — cambia nombre, teléfono, rol y/o contraseña.
 *
 * Cambiar la contraseña incrementa token_version, así que las sesiones abiertas
 * de esa cuenta se cierran: si se rota un administrador porque se sospecha que
 * alguien más tiene acceso, dejarlas vivas anularía el sentido de la rotación.
 */
router.patch('/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Id inválido.' })

    const b = req.body || {}
    const sets = []
    const params = []
    const add = (frag, valor) => {
      params.push(valor)
      sets.push(`${frag} = $${params.length}`)
    }

    if (b.nombre !== undefined) add('nombre', (b.nombre && String(b.nombre).trim()) || null)
    if (b.telefono !== undefined) add('telefono', b.telefono || null)

    if (b.rol !== undefined) {
      if (!ROLES.includes(b.rol)) {
        return res.status(400).json({ error: `Rol inválido. Valores permitidos: ${ROLES.join(', ')}` })
      }
      // Degradar al último admin dejaría el panel sin acceso.
      if (b.rol !== 'admin' && (await otrosAdmins(id)) === 0) {
        return res.status(409).json({
          error: 'Es el único administrador. Crea otro administrador antes de cambiarle el rol.',
        })
      }
      add('rol', b.rol)
    }

    if (b.password !== undefined) {
      if (String(b.password).length < PASSWORD_MIN) {
        return res.status(400).json({ error: `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.` })
      }
      add('password_hash', await hashPassword(b.password))
      // Cierra las sesiones abiertas de esa cuenta.
      sets.push('token_version = token_version + 1')
    }

    if (!sets.length) return res.status(400).json({ error: 'No hay campos para actualizar.' })

    params.push(id)
    const { rows } = await query(
      `UPDATE admin_users SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING ${COLS}`,
      params
    )
    if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado.' })
    return res.json({ usuario: rows[0] })
  } catch (err) {
    next(err)
  }
})

/** DELETE /api/usuarios/:id — elimina una cuenta. */
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Id inválido.' })

    const actual = await query('SELECT rol FROM admin_users WHERE id = $1', [id])
    if (!actual.rows[0]) return res.status(404).json({ error: 'Usuario no encontrado.' })

    // Borrar al último administrador deja el panel inaccesible.
    if (actual.rows[0].rol === 'admin' && (await otrosAdmins(id)) === 0) {
      return res.status(409).json({
        error: 'Es el único administrador. Crea otro antes de eliminar esta cuenta.',
      })
    }

    // Los pedidos NO se borran: usuario_id queda en null (el pedido sigue
    // existiendo con su email y sus datos, que es lo que importa para la operación).
    await query('UPDATE pedidos SET usuario_id = NULL WHERE usuario_id = $1', [id])
    await query('DELETE FROM admin_users WHERE id = $1', [id])
    return res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

export default router
