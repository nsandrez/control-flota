import type { TipoDocumento } from './tipoDocumento.interface'

// Mirrors backend ProyectoTipoDocumento: a catalog type assigned to a project
export interface ProyectoTipoDocumento {
  proyectoId: number
  tipoDocumentoId: number
  obligatorio: boolean
  asignadoEn: string
  tipoDocumento: TipoDocumento
}

export interface DatosAsignacionTipoDocumento {
  tipoDocumentoId: number
  obligatorio: boolean
}

export interface RespuestaListadoProyectoTipoDocumento {
  items: ProyectoTipoDocumento[]
}

export interface RespuestaAsignacion {
  asignacion: ProyectoTipoDocumento
}
