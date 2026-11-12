export type EstadoProyecto = 'ACTIVO' | 'INACTIVO'

// Mirrors backend Proyecto (dates arrive as ISO strings over JSON)
export interface Proyecto {
  id: number
  nombre: string
  descripcion: string | null
  estado: EstadoProyecto
  fechaInicio: string | null
  fechaFin: string | null
  creadoEn: string
  actualizadoEn: string
}

export interface DatosProyecto {
  nombre: string
  descripcion: string | null
  fechaInicio: string | null
  fechaFin: string | null
}

export interface FiltrosProyecto {
  estado?: EstadoProyecto
  busqueda?: string
  pagina: number
  limite: number
}

export interface ResultadoListadoProyecto {
  items: Proyecto[]
  total: number
  pagina: number
  limite: number
}

export interface RespuestaProyecto {
  proyecto: Proyecto
}
