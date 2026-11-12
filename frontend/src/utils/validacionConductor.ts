import { formatearRut, limpiarRut } from './rut'

// Mirrors backend rules (conductor.service.ts); the backend remains the source of truth.
export const LARGO_MAXIMO_NOMBRE = 150
export const LARGO_MAXIMO_DOCUMENTO = 20
export const LARGO_MAXIMO_TELEFONO = 30
const FORMATO_DOCUMENTO = /^[A-Z0-9-]{5,20}$/
const FORMATO_TELEFONO = /^[0-9 +\-()]+$/

export interface ValoresFormularioConductor {
  nombre: string
  documentoIdentidad: string
  telefono: string
}

export type ErroresConductor = Partial<Record<keyof ValoresFormularioConductor, string>>

// Same normalization as the backend: trim, uppercase, strip dots and whitespace
export function normalizarDocumento(valor: string): string {
  return valor.trim().toUpperCase().replace(/[.\s]/g, '')
}

// Formats only values that look like a RUT; any other document is left untouched
export function formatearSiEsRut(valor: string): string {
  const compacto = valor.replace(/[.\s-]/g, '').toUpperCase()
  if (!/^\d+K?$/.test(compacto) || compacto.length < 7 || compacto.length > 9) return valor
  if (limpiarRut(compacto) !== compacto) return valor
  return formatearRut(compacto)
}

export function validarConductor(valores: ValoresFormularioConductor): ErroresConductor {
  const errores: ErroresConductor = {}

  const nombre = valores.nombre.trim()
  if (!nombre) {
    errores.nombre = 'El nombre es obligatorio'
  } else if (nombre.length > LARGO_MAXIMO_NOMBRE) {
    errores.nombre = `El nombre no puede superar ${LARGO_MAXIMO_NOMBRE} caracteres`
  }

  const documento = normalizarDocumento(valores.documentoIdentidad)
  if (!documento) {
    errores.documentoIdentidad = 'El documento de identidad es obligatorio'
  } else if (!FORMATO_DOCUMENTO.test(documento)) {
    errores.documentoIdentidad =
      'El documento de identidad debe tener entre 5 y 20 caracteres (letras, dígitos y guion)'
  }

  const telefono = valores.telefono.trim()
  if (telefono.length > LARGO_MAXIMO_TELEFONO) {
    errores.telefono = `El teléfono no puede superar ${LARGO_MAXIMO_TELEFONO} caracteres`
  } else if (telefono && !FORMATO_TELEFONO.test(telefono)) {
    errores.telefono = 'El teléfono solo admite dígitos, espacios, +, - y paréntesis'
  }
  return errores
}
