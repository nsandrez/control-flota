import type {
  Conductor,
  DatosConductor,
  FiltrosConductor,
  RespuestaConductor,
  ResultadoListadoConductor,
} from '../interface/conductor.interface'
import { solicitar } from './cliente'

const ruta = (proyectoId: number) => `/proyectos/${proyectoId}/conductores`

export function listarConductores(
  proyectoId: number,
  filtros: FiltrosConductor,
  senal?: AbortSignal,
): Promise<ResultadoListadoConductor> {
  return solicitar<ResultadoListadoConductor>(ruta(proyectoId), {
    parametros: {
      busqueda: filtros.busqueda,
      // Only sent for inactive: omitting it already means "activos"
      activo: filtros.activo ? undefined : 'false',
      pagina: filtros.pagina,
      limite: filtros.limite,
    },
    senal,
  })
}

export async function obtenerConductor(
  proyectoId: number,
  id: number,
  senal?: AbortSignal,
): Promise<Conductor> {
  const { conductor } = await solicitar<RespuestaConductor>(`${ruta(proyectoId)}/${id}`, { senal })
  return conductor
}

export async function crearConductor(proyectoId: number, datos: DatosConductor): Promise<Conductor> {
  const { conductor } = await solicitar<RespuestaConductor>(ruta(proyectoId), {
    metodo: 'POST',
    cuerpo: datos,
  })
  return conductor
}

export async function actualizarConductor(
  proyectoId: number,
  id: number,
  datos: DatosConductor,
): Promise<Conductor> {
  const { conductor } = await solicitar<RespuestaConductor>(`${ruta(proyectoId)}/${id}`, {
    metodo: 'PUT',
    cuerpo: datos,
  })
  return conductor
}

export async function desactivarConductor(proyectoId: number, id: number): Promise<Conductor> {
  const { conductor } = await solicitar<RespuestaConductor>(`${ruta(proyectoId)}/${id}`, {
    metodo: 'DELETE',
  })
  return conductor
}

export async function reactivarConductor(proyectoId: number, id: number): Promise<Conductor> {
  const { conductor } = await solicitar<RespuestaConductor>(`${ruta(proyectoId)}/${id}/reactivar`, {
    metodo: 'POST',
  })
  return conductor
}
