// Chilean RUT helpers. The canonical stored form is "12345678-9" (no dots, uppercase K).

const FORMATO_RUT = /^\d{7,8}-[\dK]$/;

function calcularDigitoVerificador(cuerpo: string): string {
  let suma = 0;
  let multiplicador = 2;
  for (let i = cuerpo.length - 1; i >= 0; i -= 1) {
    suma += Number(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  const resto = 11 - (suma % 11);
  if (resto === 11) return "0";
  if (resto === 10) return "K";
  return String(resto);
}

// Strips dots, spaces and dashes, uppercases, and re-inserts the dash before the check digit
export function normalizarRut(rut: string): string {
  const limpio = rut.replace(/[.\s-]/g, "").toUpperCase();
  if (limpio.length < 2) return limpio;
  return `${limpio.slice(0, -1)}-${limpio.slice(-1)}`;
}

// Expects a normalized RUT; checks the format and the modulo 11 check digit
export function validarRut(rutNormalizado: string): boolean {
  if (!FORMATO_RUT.test(rutNormalizado)) return false;
  const [cuerpo, digito] = rutNormalizado.split("-");
  return calcularDigitoVerificador(cuerpo) === digito;
}
