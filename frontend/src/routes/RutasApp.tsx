import { Navigate, Route, Routes } from 'react-router'
import { PaginaConductorFormulario } from '../pages/PaginaConductorFormulario'
import { PaginaConductores } from '../pages/PaginaConductores'
import { PaginaLogin } from '../pages/PaginaLogin'
import { PaginaNoEncontrada } from '../pages/PaginaNoEncontrada'
import { PaginaProyectoFormulario } from '../pages/PaginaProyectoFormulario'
import { PaginaProyectos } from '../pages/PaginaProyectos'
import { PaginaVehiculoFormulario } from '../pages/PaginaVehiculoFormulario'
import { PaginaVehiculos } from '../pages/PaginaVehiculos'
import { DisenoPrincipal } from './DisenoPrincipal'
import { RutaPorRol } from './RutaPorRol'
import { RutaProtegida } from './RutaProtegida'

export function RutasApp() {
  return (
    <Routes>
      <Route path="/login" element={<PaginaLogin />} />

      <Route element={<RutaProtegida />}>
        <Route element={<DisenoPrincipal />}>
          <Route index element={<Navigate to="/proyectos" replace />} />
          <Route path="/proyectos" element={<PaginaProyectos />} />

          <Route element={<RutaPorRol roles={['ADMIN']} />}>
            <Route path="/proyectos/nuevo" element={<PaginaProyectoFormulario />} />
            <Route path="/proyectos/:id/editar" element={<PaginaProyectoFormulario />} />
          </Route>

          {/* Vehicles always belong to a project; ADMIN and OPERADOR can create/edit */}
          <Route path="/proyectos/:proyectoId/vehiculos" element={<PaginaVehiculos />} />
          <Route
            path="/proyectos/:proyectoId/vehiculos/nuevo"
            element={<PaginaVehiculoFormulario />}
          />
          <Route
            path="/proyectos/:proyectoId/vehiculos/:id/editar"
            element={<PaginaVehiculoFormulario />}
          />

          {/* Drivers: same rules as vehicles (create/edit for ADMIN and OPERADOR) */}
          <Route path="/proyectos/:proyectoId/conductores" element={<PaginaConductores />} />
          <Route
            path="/proyectos/:proyectoId/conductores/nuevo"
            element={<PaginaConductorFormulario />}
          />
          <Route
            path="/proyectos/:proyectoId/conductores/:id/editar"
            element={<PaginaConductorFormulario />}
          />

          <Route path="*"element={<PaginaNoEncontrada />} />
        </Route>
      </Route>
    </Routes>
  )
}
