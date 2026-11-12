// Mirrors backend rules (proyecto.service.ts); the backend remains the source of truth.
export const LARGO_MAXIMO_NOMBRE = 150
export const LARGO_MAXIMO_DESCRIPCION = 65535

export interface ValoresFormularioProyecto {
  nombre: string
  descripcion: string
  fechaInicio: string
  fechaFin: string
}

export type ErroresProyecto = Partial<Record<keyof ValoresFormularioProyecto, string>>

export function validarProyecto(valores: ValoresFormularioProyecto): ErroresProyecto {
  const errores: ErroresProyecto = {}
  const nombre = valores.nombre.trim()

  if (!nombre) {
    errores.nombre = 'El nombre es obligatorio'
  } else if (nombre.length > LARGO_MAXIMO_NOMBRE) {
    errores.nombre = `El nombre no puede superar ${LARGO_MAXIMO_NOMBRE} caracteres`
  }

  if (valores.descripcion.trim().length > LARGO_MAXIMO_DESCRIPCION) {
    errores.descripcion = 'La descripción es demasiado larga'
  }

  // YYYY-MM-DD strings compare correctly as text
  if (valores.fechaInicio && valores.fechaFin && valores.fechaFin < valores.fechaInicio) {
    errores.fechaFin = 'La fecha de fin no puede ser anterior a la fecha de inicio'
  }
  return errores
}
