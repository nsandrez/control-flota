import type { RolUsuario, UsuarioPublico } from "./usuario.interface";

export interface Credenciales {
  rut: string;
  contrasena: string;
}

export interface PayloadAuth {
  usuarioId: number;
  rut: string | null;
  rol: RolUsuario;
}

export interface RespuestaLogin {
  token: string;
  usuario: UsuarioPublico;
}

export interface DatosRegistro {
  nombre: string;
  rut: string;
  correo?: string | null;
  contrasena: string;
  rol?: RolUsuario;
}
