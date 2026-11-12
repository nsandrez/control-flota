export type EstadoProyecto = "ACTIVO" | "INACTIVO";

export interface Proyecto {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: EstadoProyecto;
  fechaInicio: Date | null;
  fechaFin: Date | null;
  creadoEn: Date;
  actualizadoEn: Date;
}

export interface CrearProyectoDatos {
  nombre: string;
  descripcion?: string | null;
  fechaInicio?: Date | null;
  fechaFin?: Date | null;
}

export interface ActualizarProyectoDatos {
  nombre?: string;
  descripcion?: string | null;
  fechaInicio?: Date | null;
  fechaFin?: Date | null;
}

export interface FiltrosListadoProyecto {
  estado?: EstadoProyecto;
  busqueda?: string;
  pagina: number;
  limite: number;
}

export interface ResultadoListadoProyecto {
  items: Proyecto[];
  total: number;
  pagina: number;
  limite: number;
}
