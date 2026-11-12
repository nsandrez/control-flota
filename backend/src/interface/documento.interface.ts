export type EstadoDocumento = "VIGENTE" | "VENCIDO";
export type TitularDocumento = "VEHICULO" | "CONDUCTOR";

export interface Documento {
  id: number;
  tipoDocumentoId: number;
  tipoDocumentoNombre: string;
  titular: TitularDocumento;
  vehiculoId: number | null;
  conductorId: number | null;
  nombreArchivo: string;
  // Date only (YYYY-MM-DD) or null
  fechaVencimiento: string | null;
  // Effective state computed at read time
  estado: EstadoDocumento;
  subidoPorId: number;
  creadoEn: Date;
  actualizadoEn: Date;
}

// Internal shape: includes the stored relative path, never sent to clients
export interface DocumentoInterno extends Documento {
  rutaArchivo: string;
}

export interface CrearDocumentoDatos {
  tipoDocumentoId: number;
  vehiculoId: number | null;
  conductorId: number | null;
  nombreArchivo: string;
  rutaArchivo: string;
  fechaVencimiento: string | null;
  estado: EstadoDocumento;
  subidoPorId: number;
}

export interface FiltrosListadoDocumento {
  tipoDocumentoId?: number;
  estado?: EstadoDocumento;
  hoy: string;
  pagina: number;
  limite: number;
}

export interface ResultadoListadoDocumento {
  items: Documento[];
  total: number;
  pagina: number;
  limite: number;
}

export interface ArchivoSubido {
  buffer: Buffer;
  nombreOriginal: string;
}

export interface DescargaDocumento {
  flujo: NodeJS.ReadableStream;
  tamano: number;
  nombreArchivo: string;
  tipoMime: string;
}
