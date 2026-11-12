export interface Conductor {
  id: number;
  proyectoId: number;
  nombre: string;
  documentoIdentidad: string;
  telefono: string | null;
  activo: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
}

export interface CrearConductorDatos {
  nombre: string;
  documentoIdentidad: string;
  telefono?: string | null;
}

export interface ActualizarConductorDatos {
  nombre?: string;
  documentoIdentidad?: string;
  telefono?: string | null;
}

export interface FiltrosListadoConductor {
  busqueda?: string;
  activo: boolean;
  pagina: number;
  limite: number;
}

export interface ResultadoListadoConductor {
  items: Conductor[];
  total: number;
  pagina: number;
  limite: number;
}
