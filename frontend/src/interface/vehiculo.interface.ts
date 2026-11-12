// Mirrors backend Vehiculo (dates arrive as ISO strings over JSON)
export interface Vehiculo {
  id: number
  proyectoId: number
  patente: string
  marca: string | null
  modelo: string | null
  anio: number | null
  activo: boolean
  creadoEn: string
  actualizadoEn: string
}

export interface DatosVehiculo {
  patente: string
  marca: string | null
  modelo: string | null
  anio: number | null
}

// Backend: activo omitted -> only active vehicles; activo=false -> only inactive ones
export interface FiltrosVehiculo {
  busqueda?: string
  activo: boolean
  pagina: number
  limite: number
}

export interface ResultadoListadoVehiculo {
  items: Vehiculo[]
  total: number
  pagina: number
  limite: number
}

export interface RespuestaVehiculo {
  vehiculo: Vehiculo
}
