// Chilean RUT helpers. Same modulo 11 algorithm as the backend (backend/src/service/rut.ts).

const MAX_CARACTERES = 9 // up to 8 digits plus the check digit

// Keeps only digits and K; K is only valid as the last (check) character
export function limpiarRut(valor: string): string {
  const limpio = valor.replace(/[^0-9kK]/g, '').toUpperCase()
  const cuerpo = limpio.slice(0, -1).replace(/K/g, '')
  const ultimo = limpio.slice(-1)
  return (cuerpo + ultimo).slice(0, MAX_CARACTERES)
}

// Progressive formatting while typing: "1234" -> "123-4", "123456789" -> "12.345.678-9"
export function formatearRut(valor: string): string {
  const limpio = limpiarRut(valor)
  if (limpio.length <= 1) return limpio
  const cuerpo = limpio.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${cuerpo}-${limpio.slice(-1)}`
}

// "12.345.678-9" -> "12345678-9"
export function normalizarRut(valor: string): string {
  const limpio = limpiarRut(valor)
  return limpio.length < 2 ? limpio : `${limpio.slice(0, -1)}-${limpio.slice(-1)}`
}

function calcularDigitoVerificador(cuerpo: string): string {
  let suma = 0
  let multiplicador = 2
  for (let i = cuerpo.length - 1; i >= 0; i -= 1) {
    suma += Number(cuerpo[i]) * multiplicador
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
  }
  const resto = 11 - (suma % 11)
  if (resto === 11) return '0'
  if (resto === 10) return 'K'
  return String(resto)
}

export function validarRut(valor: string): boolean {
  const normalizado = normalizarRut(valor)
  if (!/^\d{7,8}-[\dK]$/.test(normalizado)) return false
  const [cuerpo, digito] = normalizado.split('-')
  return calcularDigitoVerificador(cuerpo) === digito
}
