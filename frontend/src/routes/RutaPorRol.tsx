import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import type { RolUsuario } from '../interface/usuario.interface'

// Nest inside RutaProtegida. The backend enforces roles too; this only keeps the UI honest.
export function RutaPorRol({ roles }: { roles: RolUsuario[] }) {
  const { usuario } = useAuth()
  if (!usuario || !roles.includes(usuario.rol)) return <Navigate to="/proyectos" replace />
  return <Outlet />
}
