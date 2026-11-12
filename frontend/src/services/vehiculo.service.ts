import type {
  DatosVehiculo,
  FiltrosVehiculo,
  RespuestaVehiculo,
  ResultadoListadoVehiculo,
  Vehiculo,
} from '../interface/vehiculo.interface'
import { solicitar } from './cliente'

const ruta = (proyectoId: number) => `/proyectos/${proyectoId}/vehiculos`

export function listarVehiculos(
  proyectoId: number,
  filtros: FiltrosVehiculo,
  senal?: AbortSignal,
): Promise<ResultadoListadoVehiculo> {
  return solicitar<ResultadoListadoVehiculo>(ruta(proyectoId), {
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

export async function obtenerVehiculo(
  proyectoId: number,
  id: number,
  senal?: AbortSignal,
): Promise<Vehiculo> {
  const { vehiculo } = await solicitar<RespuestaVehiculo>(`${ruta(proyectoId)}/${id}`, { senal })
  return vehiculo
}

export async function crearVehiculo(proyectoId: number, datos: DatosVehiculo): Promise<Vehiculo> {
  const { vehiculo } = await solicitar<RespuestaVehiculo>(ruta(proyectoId), {
    metodo: 'POST',
    cuerpo: datos,
  })
  return vehiculo
}

export async function actualizarVehiculo(
  proyectoId: number,
  id: number,
  datos: DatosVehiculo,
): Promise<Vehiculo> {
  const { vehiculo } = await solicitar<RespuestaVehiculo>(`${ruta(proyectoId)}/${id}`, {
    metodo: 'PUT',
    cuerpo: datos,
  })
  return vehiculo
}

export async function desactivarVehiculo(proyectoId: number, id: number): Promise<Vehiculo> {
  const { vehiculo } = await solicitar<RespuestaVehiculo>(`${ruta(proyectoId)}/${id}`, {
    metodo: 'DELETE',
  })
  return vehiculo
}

export async function reactivarVehiculo(proyectoId: number, id: number): Promise<Vehiculo> {
  const { vehiculo } = await solicitar<RespuestaVehiculo>(`${ruta(proyectoId)}/${id}/reactivar`, {
    metodo: 'POST',
  })
  return vehiculo
}
