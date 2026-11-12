export interface Vehiculo {
  id: number;
  proyectoId: number;
  patente: string;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  activo: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
}

export interface CrearVehiculoDatos {
  patente: string;
  marca?: string | null;
  modelo?: string | null;
  anio?: number | null;
}

export interface ActualizarVehiculoDatos {
  patente?: string;
  marca?: string | null;
  modelo?: string | null;
  anio?: number | null;
}

export interface FiltrosListadoVehiculo {
  busqueda?: string;
  activo: boolean;
  pagina: number;
  limite: number;
}

export interface ResultadoListadoVehiculo {
  items: Vehiculo[];
  total: number;
  pagina: number;
  limite: number;
}
