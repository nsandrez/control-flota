const dosDigitos = (n: number) => String(n).padStart(2, '0')

// ISO string from the API -> "YYYY-MM-DD" for <input type="date">.
// Local components on purpose: the backend serializes MySQL DATE values as Date objects at
// server-local midnight, so slicing the UTC string could be off by one day.
export function aValorFecha(iso: string | null): string {
  if (!iso) return ''
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return ''
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`
}

// ISO string from the API -> human readable date (es)
export function formatearFecha(iso: string | null): string {
  const valor = aValorFecha(iso)
  if (!valor) return '—'
  const [anio, mes, dia] = valor.split('-')
  return `${dia}/${mes}/${anio}`
}

// Plain date "YYYY-MM-DD" (as sent by the API for fechaVencimiento) -> human readable date (es).
// No Date parsing: a plain date has no time zone, so nothing can shift by a day.
export function formatearFechaPlana(valor: string | null): string {
  if (!valor) return '—'
  const [anio, mes, dia] = valor.split('-')
  return `${dia}/${mes}/${anio}`
}

// Today as a local "YYYY-MM-DD"
export function fechaHoy(): string {
  const ahora = new Date()
  return `${ahora.getFullYear()}-${dosDigitos(ahora.getMonth() + 1)}-${dosDigitos(ahora.getDate())}`
}

// Whole days from `desde` to `hasta` (both "YYYY-MM-DD"); negative when `hasta` is earlier
export function diasEntre(desde: string, hasta: string): number {
  const aUtc = (valor: string) => {
    const [anio, mes, dia] = valor.split('-').map(Number)
    return Date.UTC(anio, mes - 1, dia)
  }
  return Math.round((aUtc(hasta) - aUtc(desde)) / 86_400_000)
}
