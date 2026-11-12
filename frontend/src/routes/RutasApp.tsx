import { Navigate, Route, Routes } from 'react-router'
import { PaginaConductorFormulario } from '../pages/PaginaConductorFormulario'
import { PaginaConductores } from '../pages/PaginaConductores'
import { PaginaDocumentosConductor } from '../pages/PaginaDocumentosConductor'
import { PaginaDocumentosVehiculo } from '../pages/PaginaDocumentosVehiculo'
import { PaginaLogin } from '../pages/PaginaLogin'
import { PaginaNoEncontrada } from '../pages/PaginaNoEncontrada'
import { PaginaProyectoFormulario } from '../pages/PaginaProyectoFormulario'
import { PaginaProyectos } from '../pages/PaginaProyectos'
import { PaginaTipoDocumentoFormulario } from '../pages/PaginaTipoDocumentoFormulario'
import { PaginaTiposDocumento } from '../pages/PaginaTiposDocumento'
import { PaginaTiposDocumentoProyecto } from '../pages/PaginaTiposDocumentoProyecto'
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

          {/* Document types: catalog readable by ADMIN and OPERADOR, writes ADMIN only */}
          <Route path="/tipos-documento" element={<PaginaTiposDocumento />} />
          <Route element={<RutaPorRol roles={['ADMIN']} />}>
            <Route path="/tipos-documento/nuevo" element={<PaginaTipoDocumentoFormulario />} />
            <Route path="/tipos-documento/:id/editar" element={<PaginaTipoDocumentoFormulario />} />
          </Route>

          {/* Required document types of a project (read: ADMIN and OPERADOR; writes: ADMIN, hidden in UI otherwise) */}
          <Route
            path="/proyectos/:proyectoId/tipos-documento"
            element={<PaginaTiposDocumentoProyecto />}
          />

          {/* Uploaded documents of a vehicle / driver (write rules are enforced in the page by role) */}
          <Route
            path="/proyectos/:proyectoId/vehiculos/:vehiculoId/documentos"
            element={<PaginaDocumentosVehiculo />}
          />
          <Route
            path="/proyectos/:proyectoId/conductores/:conductorId/documentos"
            element={<PaginaDocumentosConductor />}
          />

          <Route path="*"element={<PaginaNoEncontrada />} />
        </Route>
      </Route>
    </Routes>
  )
}
