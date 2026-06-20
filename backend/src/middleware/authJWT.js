import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

/**
 * Middleware que protege rutas exigiendo un JWT válido en el header
 * `Authorization: Bearer <token>`. Si es válido, adjunta el payload a
 * `req.admin`; en caso contrario responde 401.
 */
export function authJWT(req, res, next) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token no proporcionado. Usa "Authorization: Bearer <token>".' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.admin = payload // { sub, email, nombre, iat, exp }
    next()
  } catch (err) {
    const expirado = err.name === 'TokenExpiredError'
    return res.status(401).json({
      error: expirado ? 'Token expirado. Vuelve a iniciar sesión.' : 'Token inválido.',
    })
  }
}

export default authJWT
