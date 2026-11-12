export type AplicaA = 'VEHICULO' | 'CONDUCTOR'

// Mirrors backend TipoDocumento (dates arrive as ISO strings over JSON)
export interface TipoDocumento {
  id: number
  nombre: string
  descripcion: string | null
  aplicaA: AplicaA
  requiereVencimiento: boolean
  activo: boolean
  creadoEn: string
  actualizadoEn: string
}

export interface DatosTipoDocumento {
  nombre: string
  descripcion: string | null
  aplicaA: AplicaA
  requiereVencimiento: boolean
}

// Backend: activo omitted -> every state; activo=true|false -> only that state
export interface FiltrosTipoDocumento {
  aplicaA?: AplicaA
  activo?: boolean
  busqueda?: string
  pagina: number
  limite: number
}

export interface ResultadoListadoTipoDocumento {
  items: TipoDocumento[]
  total: number
  pagina: number
  limite: number
}

export interface RespuestaTipoDocumento {
  tipoDocumento: TipoDocumento
}
