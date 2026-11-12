// Mirrors backend rules (vehiculo.service.ts); the backend remains the source of truth.
export const LARGO_MAXIMO_TEXTO = 80
export const LARGO_MAXIMO_PATENTE = 10
export const ANIO_MINIMO = 1950
const FORMATO_PATENTE = /^[A-Z0-9-]{5,10}$/

export function anioMaximo(): number {
  return new Date().getFullYear() + 1
}

export interface ValoresFormularioVehiculo {
  patente: string
  marca: string
  modelo: string
  anio: string
}

export type ErroresVehiculo = Partial<Record<keyof ValoresFormularioVehiculo, string>>

export function normalizarPatente(valor: string): string {
  return valor.trim().toUpperCase()
}

export function validarVehiculo(valores: ValoresFormularioVehiculo): ErroresVehiculo {
  const errores: ErroresVehiculo = {}
  const patente = normalizarPatente(valores.patente)

  if (!patente) {
    errores.patente = 'La patente es obligatoria'
  } else if (!FORMATO_PATENTE.test(patente)) {
    errores.patente = 'La patente debe tener entre 5 y 10 caracteres (letras, dígitos y guion)'
  }

  if (valores.marca.trim().length > LARGO_MAXIMO_TEXTO) {
    errores.marca = `La marca no puede superar ${LARGO_MAXIMO_TEXTO} caracteres`
  }
  if (valores.modelo.trim().length > LARGO_MAXIMO_TEXTO) {
    errores.modelo = `El modelo no puede superar ${LARGO_MAXIMO_TEXTO} caracteres`
  }

  const anio = valores.anio.trim()
  if (anio) {
    const numero = Number(anio)
    if (!/^\d+$/.test(anio) || numero < ANIO_MINIMO || numero > anioMaximo()) {
      errores.anio = `El año debe ser un entero entre ${ANIO_MINIMO} y ${anioMaximo()}`
    }
  }
  return errores
}
