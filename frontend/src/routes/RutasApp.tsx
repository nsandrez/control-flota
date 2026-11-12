import { Route, Routes } from 'react-router'
import { PaginaLogin } from '../pages/PaginaLogin'
import { PaginaNoEncontrada } from '../pages/PaginaNoEncontrada'
import { DisenoPrincipal } from './DisenoPrincipal'
import { RutaProtegida } from './RutaProtegida'

export function RutasApp() {
  return (
    <Routes>
      <Route path="/login" element={<PaginaLogin />} />

      <Route element={<RutaProtegida />}>
        <Route element={<DisenoPrincipal />}>
          <Route path="*"element={<PaginaNoEncontrada />} />
        </Route>
      </Route>
    </Routes>
  )
}
