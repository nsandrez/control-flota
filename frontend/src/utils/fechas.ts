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
