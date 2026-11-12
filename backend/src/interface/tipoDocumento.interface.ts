export type AplicaA = "VEHICULO" | "CONDUCTOR";

export interface TipoDocumento {
  id: number;
  nombre: string;
  descripcion: string | null;
  aplicaA: AplicaA;
  requiereVencimiento: boolean;
  activo: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
}

export interface CrearTipoDocumentoDatos {
  nombre: string;
  descripcion?: string | null;
  aplicaA: AplicaA;
  requiereVencimiento?: boolean;
  activo?: boolean;
}

export interface ActualizarTipoDocumentoDatos {
  nombre?: string;
  descripcion?: string | null;
  aplicaA?: AplicaA;
  requiereVencimiento?: boolean;
  activo?: boolean;
}

export interface FiltrosListadoTipoDocumento {
  aplicaA?: AplicaA;
  activo?: boolean;
  busqueda?: string;
  pagina: number;
  limite: number;
}

export interface ResultadoListadoTipoDocumento {
  items: TipoDocumento[];
  total: number;
  pagina: number;
  limite: number;
}
