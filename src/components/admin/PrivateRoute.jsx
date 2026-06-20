import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { isTokenValid, clearToken } from '../../lib/adminApi'

/**
 * Guarda de rutas del panel admin.
 * Lee el JWT de localStorage y:
 *  - Si es válido (existe y no ha expirado) → renderiza la ruta hija (<Outlet/>).
 *  - Si no existe o está expirado → limpia el token y redirige a /admin/login,
 *    recordando la ruta a la que se intentaba acceder.
 */
export default function PrivateRoute() {
  const location = useLocation()

  if (!isTokenValid()) {
    clearToken()
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
