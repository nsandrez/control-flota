import { Outlet } from 'react-router'
import { EncabezadoApp, type EnlaceNavegacion } from '../components/organisms/EncabezadoApp'
import { PlantillaPrincipal } from '../components/templates/PlantillaPrincipal'
import { useAuth } from '../hooks/useAuth'

// Add one entry per new section (vehículos, conductores, documentos, ...)
// Visible to ADMIN and OPERADOR alike (OPERADOR reads the catalog)
const ENLACES: EnlaceNavegacion[] = [
  { a: '/proyectos', texto: 'Proyectos' },
]

export function DisenoPrincipal() {
  const { usuario, cerrarSesion } = useAuth()
  if (!usuario) return null

  return (
    <PlantillaPrincipal
      encabezado={
        <EncabezadoApp usuario={usuario} enlaces={ENLACES} onCerrarSesion={cerrarSesion} />
      }
    >
      <Outlet />
    </PlantillaPrincipal>
  )
}
