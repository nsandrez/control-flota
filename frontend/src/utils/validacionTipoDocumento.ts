import type { AplicaA } from '../interface/tipoDocumento.interface'

// Mirrors backend rules (tipoDocumento.service.ts); the backend remains the source of truth.
export const LARGO_MAXIMO_NOMBRE = 150

export interface ValoresFormularioTipoDocumento {
  nombre: string
  descripcion: string
  // '' until the user picks one
  aplicaA: AplicaA | ''
  requiereVencimiento: boolean
}

export type ErroresTipoDocumento = Partial<
  Record<'nombre' | 'aplicaA' | 'descripcion', string>
>

export const ETIQUETA_APLICA_A: Record<AplicaA, string> = {
  VEHICULO: 'Vehículo',
  CONDUCTOR: 'Conductor',
}

export function validarTipoDocumento(valores: ValoresFormularioTipoDocumento): ErroresTipoDocumento {
  const errores: ErroresTipoDocumento = {}
  const nombre = valores.nombre.trim()
  if (!nombre) {
    errores.nombre = 'El nombre es obligatorio'
  } else if (nombre.length > LARGO_MAXIMO_NOMBRE) {
    errores.nombre = `El nombre no puede superar ${LARGO_MAXIMO_NOMBRE} caracteres`
  }
  if (valores.aplicaA === '') {
    errores.aplicaA = 'Seleccione a quién aplica el documento'
  }
  return errores
}
