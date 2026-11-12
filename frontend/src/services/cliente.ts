import { ErrorApi } from '../interface/error.interface'
import { obtenerToken } from './sesion'

const URL_BASE: string = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/+$/, '')

type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
type Parametros = Record<string, string | number | undefined>

interface OpcionesSolicitud {
  metodo?: Metodo
  cuerpo?: unknown
  parametros?: Parametros
  senal?: AbortSignal
  // Login: a 401 means "wrong credentials", not "expired session"
  omitirNoAutorizado?: boolean
}

let manejadorNoAutorizado: (() => void) | null = null

// The auth context registers how to drop the session when the API answers 401
export function registrarManejadorNoAutorizado(manejador: (() => void) | null): void {
  manejadorNoAutorizado = manejador
}

function construirUrl(ruta: string, parametros?: Parametros): string {
  const consulta = new URLSearchParams()
  for (const [clave, valor] of Object.entries(parametros ?? {})) {
    if (valor !== undefined && valor !== '') consulta.set(clave, String(valor))
  }
  const texto = consulta.toString()
  return `${URL_BASE}${ruta}${texto ? `?${texto}` : ''}`
}

async function leerJson(respuesta: Response): Promise<unknown> {
  try {
    return await respuesta.json()
  } catch {
    return null
  }
}

function mensajeDe(cuerpo: unknown, estado: number): string {
  if (cuerpo && typeof cuerpo === 'object' && 'mensaje' in cuerpo) {
    const { mensaje } = cuerpo as { mensaje: unknown }
    if (typeof mensaje === 'string' && mensaje) return mensaje
  }
  return `Error inesperado del servidor (${estado})`
}

// Adds the Bearer token, maps network failures and non-2xx
// answers to ErrorApi and drops the session on 401. Resolves with the successful Response.
async function enviar(
  ruta: string,
  opciones: OpcionesSolicitud,
  aceptar: string,
): Promise<Response> {
  const { metodo = 'GET', cuerpo, parametros, senal, omitirNoAutorizado = false } = opciones

  const cabeceras: Record<string, string> = { Accept: aceptar }
  const token = obtenerToken()
  if (token) cabeceras.Authorization = `Bearer ${token}`

  let cuerpoHttp: string | undefined
  if (cuerpo !== undefined) {
    cabeceras['Content-Type'] = 'application/json'
    cuerpoHttp = JSON.stringify(cuerpo)
  }

  let respuesta: Response
  try {
    respuesta = await fetch(construirUrl(ruta, parametros), {
      method: metodo,
      headers: cabeceras,
      body: cuerpoHttp,
      signal: senal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ErrorApi(0, 'No se pudo conectar con el servidor. Revise su conexión e intente de nuevo.')
  }

  if (!respuesta.ok) {
    const datos = await leerJson(respuesta)
    if (respuesta.status === 401 && !omitirNoAutorizado) manejadorNoAutorizado?.()
    throw new ErrorApi(respuesta.status, mensajeDe(datos, respuesta.status))
  }
  return respuesta
}

export async function solicitar<T>(ruta: string, opciones: OpcionesSolicitud = {}): Promise<T> {
  const respuesta = await enviar(ruta, opciones, 'application/json')
  return (await leerJson(respuesta)) as T
}
