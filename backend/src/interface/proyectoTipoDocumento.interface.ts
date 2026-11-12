import type { TipoDocumento } from "./tipoDocumento.interface";

export interface ProyectoTipoDocumento {
  proyectoId: number;
  tipoDocumentoId: number;
  obligatorio: boolean;
  asignadoEn: Date;
  tipoDocumento: TipoDocumento;
}
