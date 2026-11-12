import { BrowserRouter } from 'react-router'
import { ProveedorAuth } from './context/ProveedorAuth'
import { RutasApp } from './routes/RutasApp'

export default function App() {
  return (
    <BrowserRouter>
      <ProveedorAuth>
        <RutasApp />
      </ProveedorAuth>
    </BrowserRouter>
  )
}
