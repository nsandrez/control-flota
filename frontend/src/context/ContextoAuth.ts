import { createContext } from 'react'
import type { Usuario } from '../interface/usuario.interface'

export interface ValorContextoAuth {
  usuario: Usuario | null
  // true while the session is being restored from the stored token
  cargando: boolean
  iniciarSesion: (rut: string, contrasena: string) => Promise<void>
  cerrarSesion: () => void
}

export const ContextoAuth = createContext<ValorContextoAuth | null>(null)
