import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { query } from '../models/index.js'

dotenv.config()

/**
 * Verifica el JWT del header `Authorization: Bearer <token>`. Si es válido,
 * adjunta el payload a `req.admin` (incluye `rol`); si no, responde 401.
 * Permite el acceso de CUALQUIER usuario autenticado (admin o cliente).
 *
 * Además de la firma, contrasta el claim `tv` (token version) contra el valor
 * guardado del usuario: así, cambiar la contraseña cierra de verdad las sesiones
 * abiertas. Cuesta una consulta por petición autenticada, que a este volumen
 * (panel de administración) es despreciable frente a dejar vivo un token robado
 * hasta 8h después de un reseteo.
 *
 * Los tokens emitidos antes de que existiera la columna no traen `tv`: se
 * asumen 0, que es el valor inicial de `token_version`, así que siguen siendo
 * válidos y desplegar esto no desloguea a nadie.
 */
export async function authJWT(req, res, next) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token no proporcionado. Usa "Authorization: Bearer <token>".' })
  }

  let payload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET)
  } catch (err) {
    const expirado = err.name === 'TokenExpiredError'
    return res.status(401).json({
      error: expirado ? 'Token expirado. Vuelve a iniciar sesión.' : 'Token inválido.',
    })
  }

  try {
    const { rows } = await query('SELECT token_version FROM admin_users WHERE id = $1', [payload.sub])
    if (!rows[0]) {
      // La cuenta ya no existe: el token no debe seguir abriendo puertas.
      return res.status(401).json({ error: 'Token inválido.' })
    }
    if ((Number(rows[0].token_version) || 0) !== (Number(payload.tv) || 0)) {
      return res.status(401).json({
        error: 'Tu sesión se cerró porque cambió la contraseña. Vuelve a iniciar sesión.',
      })
    }
  } catch (err) {
    return next(err)
  }

  req.admin = payload // { sub, email, nombre, rol, tv, iat, exp }
  next()
}

/**
 * Exige un usuario autenticado CON rol de administrador.
 *
 * Allowlist, no denylist: solo pasa `rol === 'admin'`. Antes la condición era
 * `if (req.admin?.rol && req.admin.rol !== 'admin')`, que fallaba ABIERTO — un
 * token sin el claim `rol` entraba como administrador. Los únicos tokens sin
 * `rol` serían anteriores a que existiera la columna, y caducaron hace mucho
 * (viven 8h), así que exigirlo no deja a nadie fuera.
 */
export function requireAdmin(req, res, next) {
  authJWT(req, res, () => {
    if (req.admin?.rol !== 'admin') {
      return res.status(403).json({ error: 'Acceso restringido a administradores.' })
    }
    next()
  })
}

/**
 * ¿La petición trae un token válido de administrador? (para vistas admin como
 * ?todos=true). No corta la petición; devuelve boolean.
 */
export function isAdminToken(req) {
  const [scheme, token] = (req.headers.authorization || '').split(' ')
  if (scheme !== 'Bearer' || !token) return false
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    // Allowlist: antes era `payload.rol !== 'cliente'`, que daba por admin a
    // cualquier valor distinto de 'cliente' (incluido ninguno).
    return payload.rol === 'admin'
  } catch {
    return false
  }
}

/**
 * Devuelve el id del usuario si la petición trae un token válido; si no, null.
 * Útil para endpoints públicos que opcionalmente vinculan al usuario logueado.
 */
export function optionalUserId(req) {
  const [scheme, token] = (req.headers.authorization || '').split(' ')
  if (scheme !== 'Bearer' || !token) return null
  try {
    return jwt.verify(token, process.env.JWT_SECRET).sub || null
  } catch {
    return null
  }
}

export default authJWT
