import type { Usuario } from './usuario.interface'

export interface Credenciales {
  // Normalized RUT without dots, e.g. "12345678-9"
  rut: string
  contrasena: string
}

export interface RespuestaLogin {
  token: string
  usuario: Usuario
}

export interface RespuestaPerfil {
  usuario: Usuario
}
