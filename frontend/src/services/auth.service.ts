import type { Credenciales, RespuestaLogin, RespuestaPerfil } from '../interface/auth.interface'
import type { Usuario } from '../interface/usuario.interface'
import { solicitar } from './cliente'

export function iniciarSesion(credenciales: Credenciales): Promise<RespuestaLogin> {
  return solicitar<RespuestaLogin>('/auth/login', {
    metodo: 'POST',
    cuerpo: credenciales,
    omitirNoAutorizado: true,
  })
}

export async function obtenerPerfil(senal?: AbortSignal): Promise<Usuario> {
  const { usuario } = await solicitar<RespuestaPerfil>('/auth/yo', { senal })
  return usuario
}
