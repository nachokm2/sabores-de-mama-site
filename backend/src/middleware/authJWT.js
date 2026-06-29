import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

/**
 * Verifica el JWT del header `Authorization: Bearer <token>`. Si es válido,
 * adjunta el payload a `req.admin` (incluye `rol`); si no, responde 401.
 * Permite el acceso de CUALQUIER usuario autenticado (admin o cliente).
 */
export function authJWT(req, res, next) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token no proporcionado. Usa "Authorization: Bearer <token>".' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.admin = payload // { sub, email, nombre, rol, iat, exp }
    next()
  } catch (err) {
    const expirado = err.name === 'TokenExpiredError'
    return res.status(401).json({
      error: expirado ? 'Token expirado. Vuelve a iniciar sesión.' : 'Token inválido.',
    })
  }
}

/**
 * Exige un usuario autenticado CON rol de administrador. Los tokens antiguos
 * sin `rol` se tratan como admin (compatibilidad). Los clientes (rol 'cliente')
 * reciben 403.
 */
export function requireAdmin(req, res, next) {
  authJWT(req, res, () => {
    if (req.admin?.rol && req.admin.rol !== 'admin') {
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
    return payload.rol !== 'cliente' // admin o token legado sin rol
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
