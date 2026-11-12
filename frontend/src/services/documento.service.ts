import type {
  DatosSubidaDocumento,
  Documento,
  FiltrosDocumento,
  RespuestaDocumento,
  ResultadoListadoDocumento,
  TitularDocumento,
} from '../interface/documento.interface'
import { descargarArchivo, solicitar } from './cliente'

const rutaProyecto = (proyectoId: number) => `/proyectos/${proyectoId}`

const rutaTitular = (tipoTitular: TitularDocumento, proyectoId: number, titularId: number) =>
  `${rutaProyecto(proyectoId)}/${tipoTitular === 'VEHICULO' ? 'vehiculos' : 'conductores'}/${titularId}/documentos`

export function listarDocumentos(
  tipoTitular: TitularDocumento,
  proyectoId: number,
  titularId: number,
  filtros: FiltrosDocumento,
  senal?: AbortSignal,
): Promise<ResultadoListadoDocumento> {
  return solicitar<ResultadoListadoDocumento>(rutaTitular(tipoTitular, proyectoId, titularId), {
    parametros: {
      tipoDocumentoId: filtros.tipoDocumentoId,
      estado: filtros.estado,
      pagina: filtros.pagina,
      limite: filtros.limite,
    },
    senal,
  })
}

// multipart/form-data: the client adds the boundary header itself
export async function subirDocumento(
  tipoTitular: TitularDocumento,
  proyectoId: number,
  titularId: number,
  datos: DatosSubidaDocumento,
): Promise<Documento> {
  const formulario = new FormData()
  formulario.append('tipoDocumentoId', String(datos.tipoDocumentoId))
  if (datos.fechaVencimiento) formulario.append('fechaVencimiento', datos.fechaVencimiento)
  // The file goes last so the text fields are already parsed when the upload starts
  formulario.append('archivo', datos.archivo)
  const { documento } = await solicitar<RespuestaDocumento>(
    rutaTitular(tipoTitular, proyectoId, titularId),
    { metodo: 'POST', cuerpo: formulario },
  )
  return documento
}

// The backend requires the field in the body; null is only accepted for types without vencimiento
export async function actualizarVencimientoDocumento(
  proyectoId: number,
  id: number,
  fechaVencimiento: string | null,
): Promise<Documento> {
  const { documento } = await solicitar<RespuestaDocumento>(
    `${rutaProyecto(proyectoId)}/documentos/${id}`,
    { metodo: 'PUT', cuerpo: { fechaVencimiento } },
  )
  return documento
}

// 204 without body
export async function eliminarDocumento(proyectoId: number, id: number): Promise<void> {
  await solicitar<null>(`${rutaProyecto(proyectoId)}/documentos/${id}`, { metodo: 'DELETE' })
}

// Fetches the file with the Bearer token and hands it to the browser as a download
export async function descargarDocumento(proyectoId: number, documento: Documento): Promise<void> {
  const { blob, nombreArchivo } = await descargarArchivo(
    `${rutaProyecto(proyectoId)}/documentos/${documento.id}/descargar`,
  )
  const url = URL.createObjectURL(blob)
  try {
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = nombreArchivo ?? documento.nombreArchivo
    enlace.rel = 'noopener'
    enlace.style.display = 'none'
    document.body.append(enlace)
    enlace.click()
    enlace.remove()
  } finally {
    // Give the browser a moment to start the download before releasing the blob
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}
