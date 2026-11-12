export type RolUsuario = 'ADMIN' | 'OPERADOR'

// Mirrors backend UsuarioPublico (dates arrive as ISO strings over JSON)
export interface Usuario {
  id: number
  nombre: string
  rut: string | null
  correo: string | null
  rol: RolUsuario
  activo: boolean
  creadoEn: string
  actualizadoEn: string
}
