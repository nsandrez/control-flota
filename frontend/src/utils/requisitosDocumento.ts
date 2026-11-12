import type { Documento, TitularDocumento } from '../interface/documento.interface'
import type { ProyectoTipoDocumento } from '../interface/proyectoTipoDocumento.interface'
import { diasEntre } from './fechas'

// A document expiring within this many days is flagged as "por vencer"
export const DIAS_POR_VENCER = 30

export type EstadoRequisito = 'SIN_DOCUMENTO' | 'VIGENTE' | 'POR_VENCER' | 'VENCIDO'

export interface Requisito {
  asignacion: ProyectoTipoDocumento
  // Latest document (highest id) of the type for this owner, if any
  actual: Documento | null
  estado: EstadoRequisito
}

export function estadoDeRequisito(actual: Documento | null, hoy: string): EstadoRequisito {
  if (!actual) return 'SIN_DOCUMENTO'
  // The backend already compared against its own "today"
  if (actual.estado === 'VENCIDO') return 'VENCIDO'
  if (actual.fechaVencimiento === null) return 'VIGENTE'
  const dias = diasEntre(hoy, actual.fechaVencimiento)
  if (dias < 0) return 'VENCIDO'
  return dias <= DIAS_POR_VENCER ? 'POR_VENCER' : 'VIGENTE'
}

// Checklist of the types assigned to the project that apply to this owner kind.
// Inactive types are left out: they can no longer be uploaded, so they cannot be fulfilled.
export function calcularRequisitos(
  asignaciones: ProyectoTipoDocumento[],
  documentos: Documento[],
  tipoTitular: TitularDocumento,
  hoy: string,
): Requisito[] {
  const actualPorTipo = new Map<number, Documento>()
  for (const documento of documentos) {
    const previo = actualPorTipo.get(documento.tipoDocumentoId)
    if (!previo || documento.id > previo.id) actualPorTipo.set(documento.tipoDocumentoId, documento)
  }
  return asignaciones
    .filter((a) => a.tipoDocumento.aplicaA === tipoTitular && a.tipoDocumento.activo)
    .map((asignacion) => {
      const actual = actualPorTipo.get(asignacion.tipoDocumentoId) ?? null
      return { asignacion, actual, estado: estadoDeRequisito(actual, hoy) }
    })
    .sort(
      (a, b) =>
        Number(b.asignacion.obligatorio) - Number(a.asignacion.obligatorio) ||
        a.asignacion.tipoDocumento.nombre.localeCompare(b.asignacion.tipoDocumento.nombre, 'es'),
    )
}

// A requirement is "al día" while its current document is not expired
export function estaAlDia(estado: EstadoRequisito): boolean {
  return estado === 'VIGENTE' || estado === 'POR_VENCER'
}
