import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { isTokenValid } from '../../lib/clienteApi'

/** Protege las rutas del portal de clientes: exige sesión de cliente válida. */
export default function ClientePrivateRoute() {
  const location = useLocation()
  if (!isTokenValid()) {
    return <Navigate to="/cuenta/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
