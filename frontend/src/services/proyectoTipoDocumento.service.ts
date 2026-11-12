import type {
  DatosAsignacionTipoDocumento,
  ProyectoTipoDocumento,
  RespuestaAsignacion,
  RespuestaListadoProyectoTipoDocumento,
} from '../interface/proyectoTipoDocumento.interface'
import { solicitar } from './cliente'

const ruta = (proyectoId: number) => `/proyectos/${proyectoId}/tipos-documento`

// The endpoint is not paginated: it returns every type assigned to the project
export async function listarTiposDocumentoDeProyecto(
  proyectoId: number,
  senal?: AbortSignal,
): Promise<ProyectoTipoDocumento[]> {
  const { items } = await solicitar<RespuestaListadoProyectoTipoDocumento>(ruta(proyectoId), {
    senal,
  })
  return items
}

export async function asignarTipoDocumento(
  proyectoId: number,
  datos: DatosAsignacionTipoDocumento,
): Promise<ProyectoTipoDocumento> {
  const { asignacion } = await solicitar<RespuestaAsignacion>(ruta(proyectoId), {
    metodo: 'POST',
    cuerpo: datos,
  })
  return asignacion
}

export async function actualizarObligatorioTipoDocumento(
  proyectoId: number,
  tipoDocumentoId: number,
  obligatorio: boolean,
): Promise<ProyectoTipoDocumento> {
  const { asignacion } = await solicitar<RespuestaAsignacion>(
    `${ruta(proyectoId)}/${tipoDocumentoId}`,
    { metodo: 'PATCH', cuerpo: { obligatorio } },
  )
  return asignacion
}

// 204 without body
export async function desasignarTipoDocumento(
  proyectoId: number,
  tipoDocumentoId: number,
): Promise<void> {
  await solicitar<null>(`${ruta(proyectoId)}/${tipoDocumentoId}`, { metodo: 'DELETE' })
}
