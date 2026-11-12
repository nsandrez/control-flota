// UX pre-checks that mirror the backend rules (documento.service.ts / almacenamientoArchivos.ts).
// The backend remains the source of truth: it re-validates the real type by magic bytes.
export const TAMANO_MAXIMO_MB = 10
export const TAMANO_MAXIMO_BYTES = TAMANO_MAXIMO_MB * 1024 * 1024
export const EXTENSIONES_PERMITIDAS = ['.pdf', '.jpg', '.jpeg', '.png']
const TIPOS_MIME_PERMITIDOS = ['application/pdf', 'image/jpeg', 'image/png']
// Value for <input type="file" accept>
export const ACEPTAR_ARCHIVOS = [...EXTENSIONES_PERMITIDAS, ...TIPOS_MIME_PERMITIDOS].join(',')
export const TEXTO_FORMATOS = `PDF, JPG o PNG, hasta ${TAMANO_MAXIMO_MB} MB`

const FORMATO_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/
const ANIO_MINIMO = 1970
const ANIO_MAXIMO = 2100

export interface ValoresFormularioDocumento {
  archivo: File | null
  // '' until the user picks one
  tipoDocumentoId: string
  fechaVencimiento: string
  requiereVencimiento: boolean
}

export type ErroresDocumento = Partial<
  Record<'archivo' | 'tipoDocumentoId' | 'fechaVencimiento', string>
>

export function formatearTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function validarArchivo(archivo: File | null): string | undefined {
  if (!archivo) return 'Seleccione un archivo'
  if (archivo.size === 0) return 'El archivo está vacío'
  const nombre = archivo.name.toLowerCase()
  const extensionValida = EXTENSIONES_PERMITIDAS.some((extension) => nombre.endsWith(extension))
  // Some systems report an empty mime type: only a non-empty, unknown one is rejected
  const mimeValido = archivo.type === '' || TIPOS_MIME_PERMITIDOS.includes(archivo.type)
  if (!extensionValida || !mimeValido) return 'Solo se admiten archivos PDF, JPG o PNG'
  if (archivo.size > TAMANO_MAXIMO_BYTES) {
    return `El archivo supera el máximo de ${TAMANO_MAXIMO_MB} MB`
  }
  return undefined
}

// `requerida`: the document type requires a due date
export function validarFechaVencimiento(valor: string, requerida: boolean): string | undefined {
  const texto = valor.trim()
  if (!texto) return requerida ? 'La fecha de vencimiento es obligatoria' : undefined
  const coincidencia = FORMATO_FECHA.exec(texto)
  if (!coincidencia) return 'Ingrese una fecha válida'
  const [anio, mes, dia] = [Number(coincidencia[1]), Number(coincidencia[2]), Number(coincidencia[3])]
  const fecha = new Date(Date.UTC(anio, mes - 1, dia))
  const real =
    fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia
  if (!real || anio < ANIO_MINIMO || anio > ANIO_MAXIMO) return 'Ingrese una fecha válida'
  return undefined
}

export function validarDocumento(valores: ValoresFormularioDocumento): ErroresDocumento {
  const errores: ErroresDocumento = {}
  if (valores.tipoDocumentoId === '') {
    errores.tipoDocumentoId = 'Seleccione un tipo de documento'
  }
  const errorArchivo = validarArchivo(valores.archivo)
  if (errorArchivo) errores.archivo = errorArchivo
  // The date is only collected (and validated) for types that require it
  if (valores.requiereVencimiento) {
    const errorFecha = validarFechaVencimiento(valores.fechaVencimiento, true)
    if (errorFecha) errores.fechaVencimiento = errorFecha
  }
  return errores
}
