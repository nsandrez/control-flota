import { Navigate, Outlet, useLocation } from 'react-router'
import { Cargando } from '../components/atoms/Cargando'
import { useAuth } from '../hooks/useAuth'

// Requires an authenticated user; otherwise redirects to /login remembering where the user was going
export function RutaProtegida() {
  const { usuario, cargando } = useAuth()
  const ubicacion = useLocation()

  if (cargando) return <Cargando texto="Verificando sesión…" />
  if (!usuario) return <Navigate to="/login" replace state={{ desde: ubicacion }} />
  return <Outlet />
}
