import type {
  DatosTipoDocumento,
  FiltrosTipoDocumento,
  RespuestaTipoDocumento,
  ResultadoListadoTipoDocumento,
  TipoDocumento,
} from '../interface/tipoDocumento.interface'
import { solicitar } from './cliente'

const RUTA = '/tipos-documento'

export function listarTiposDocumento(
  filtros: FiltrosTipoDocumento,
  senal?: AbortSignal,
): Promise<ResultadoListadoTipoDocumento> {
  return solicitar<ResultadoListadoTipoDocumento>(RUTA, {
    parametros: {
      aplicaA: filtros.aplicaA,
      activo: filtros.activo === undefined ? undefined : String(filtros.activo),
      busqueda: filtros.busqueda,
      pagina: filtros.pagina,
      limite: filtros.limite,
    },
    senal,
  })
}

export async function obtenerTipoDocumento(id: number, senal?: AbortSignal): Promise<TipoDocumento> {
  const { tipoDocumento } = await solicitar<RespuestaTipoDocumento>(`${RUTA}/${id}`, { senal })
  return tipoDocumento
}

export async function crearTipoDocumento(datos: DatosTipoDocumento): Promise<TipoDocumento> {
  const { tipoDocumento } = await solicitar<RespuestaTipoDocumento>(RUTA, {
    metodo: 'POST',
    cuerpo: datos,
  })
  return tipoDocumento
}

export async function actualizarTipoDocumento(
  id: number,
  datos: DatosTipoDocumento,
): Promise<TipoDocumento> {
  const { tipoDocumento } = await solicitar<RespuestaTipoDocumento>(`${RUTA}/${id}`, {
    metodo: 'PUT',
    cuerpo: datos,
  })
  return tipoDocumento
}

export async function desactivarTipoDocumento(id: number): Promise<TipoDocumento> {
  const { tipoDocumento } = await solicitar<RespuestaTipoDocumento>(`${RUTA}/${id}`, {
    metodo: 'DELETE',
  })
  return tipoDocumento
}

export async function reactivarTipoDocumento(id: number): Promise<TipoDocumento> {
  const { tipoDocumento } = await solicitar<RespuestaTipoDocumento>(`${RUTA}/${id}/reactivar`, {
    metodo: 'POST',
  })
  return tipoDocumento
}
