// Mirrors backend Conductor (dates arrive as ISO strings over JSON)
export interface Conductor {
  id: number
  proyectoId: number
  nombre: string
  documentoIdentidad: string
  telefono: string | null
  activo: boolean
  creadoEn: string
  actualizadoEn: string
}

export interface DatosConductor {
  nombre: string
  documentoIdentidad: string
  telefono: string | null
}

// Backend: activo omitted -> only active drivers; activo=false -> only inactive ones
export interface FiltrosConductor {
  busqueda?: string
  activo: boolean
  pagina: number
  limite: number
}

export interface ResultadoListadoConductor {
  items: Conductor[]
  total: number
  pagina: number
  limite: number
}

export interface RespuestaConductor {
  conductor: Conductor
}
