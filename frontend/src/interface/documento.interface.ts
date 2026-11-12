import type { AplicaA } from './tipoDocumento.interface'

// Owner kind of a document: same values as the type's `aplicaA`
export type TitularDocumento = AplicaA

// Computed by the backend on every read
export type EstadoDocumento = 'VIGENTE' | 'VENCIDO'

// Mirrors backend Documento (never includes the stored path)
export interface Documento {
  id: number
  tipoDocumentoId: number
  tipoDocumentoNombre: string
  titular: TitularDocumento
  vehiculoId: number | null
  conductorId: number | null
  nombreArchivo: string
  // Plain date "YYYY-MM-DD" or null
  fechaVencimiento: string | null
  estado: EstadoDocumento
  subidoPorId: number
  creadoEn: string
  actualizadoEn: string
}

// Backend: both filters omitted -> every document; ordered by id DESC
export interface FiltrosDocumento {
  tipoDocumentoId?: number
  estado?: EstadoDocumento
  pagina: number
  limite: number
}

export interface ResultadoListadoDocumento {
  items: Documento[]
  total: number
  pagina: number
  limite: number
}

export interface RespuestaDocumento {
  documento: Documento
}

export interface DatosSubidaDocumento {
  archivo: File
  tipoDocumentoId: number
  // Only for types that require it; the backend rejects it for the others
  fechaVencimiento?: string
}
