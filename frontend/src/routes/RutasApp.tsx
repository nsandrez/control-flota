import { Navigate, Route, Routes } from 'react-router'
import { PaginaLogin } from '../pages/PaginaLogin'
import { PaginaNoEncontrada } from '../pages/PaginaNoEncontrada'
import { PaginaProyectoFormulario } from '../pages/PaginaProyectoFormulario'
import { PaginaProyectos } from '../pages/PaginaProyectos'
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

          <Route path="*"element={<PaginaNoEncontrada />} />
        </Route>
      </Route>
    </Routes>
  )
}
