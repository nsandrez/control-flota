export type RolUsuario = "ADMIN" | "OPERADOR";

export interface Usuario {
  id: number;
  nombre: string;
  rut: string | null;
  correo: string | null;
  contrasenaHash: string;
  rol: RolUsuario;
  activo: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
}

export type UsuarioPublico = Omit<Usuario, "contrasenaHash">;

export interface NuevoUsuario {
  nombre: string;
  rut: string;
  correo?: string | null;
  contrasenaHash: string;
  rol?: RolUsuario;
}
