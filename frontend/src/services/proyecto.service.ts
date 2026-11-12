import type {
  DatosProyecto,
  FiltrosProyecto,
  Proyecto,
  RespuestaProyecto,
  ResultadoListadoProyecto,
} from '../interface/proyecto.interface'
import { solicitar } from './cliente'

export function listarProyectos(
  filtros: FiltrosProyecto,
  senal?: AbortSignal,
): Promise<ResultadoListadoProyecto> {
  return solicitar<ResultadoListadoProyecto>('/proyectos', {
    parametros: {
      estado: filtros.estado,
      busqueda: filtros.busqueda,
      pagina: filtros.pagina,
      limite: filtros.limite,
    },
    senal,
  })
}

export async function obtenerProyecto(id: number, senal?: AbortSignal): Promise<Proyecto> {
  const { proyecto } = await solicitar<RespuestaProyecto>(`/proyectos/${id}`, { senal })
  return proyecto
}

export async function crearProyecto(datos: DatosProyecto): Promise<Proyecto> {
  const { proyecto } = await solicitar<RespuestaProyecto>('/proyectos', {
    metodo: 'POST',
    cuerpo: datos,
  })
  return proyecto
}

export async function actualizarProyecto(id: number, datos: DatosProyecto): Promise<Proyecto> {
  const { proyecto } = await solicitar<RespuestaProyecto>(`/proyectos/${id}`, {
    metodo: 'PUT',
    cuerpo: datos,
  })
  return proyecto
}

export async function desactivarProyecto(id: number): Promise<Proyecto> {
  const { proyecto } = await solicitar<RespuestaProyecto>(`/proyectos/${id}`, { metodo: 'DELETE' })
  return proyecto
}

export async function reactivarProyecto(id: number): Promise<Proyecto> {
  const { proyecto } = await solicitar<RespuestaProyecto>(`/proyectos/${id}/reactivar`, {
    metodo: 'POST',
  })
  return proyecto
}
