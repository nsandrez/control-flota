import "dotenv/config";

function requerirVariable(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(`Falta la variable de entorno obligatoria: ${nombre}`);
  }
  return valor;
}

// Only checks the variable is defined: an empty value is valid (XAMPP root has no password)
function requerirDefinida(nombre: string): string {
  const valor = process.env[nombre];
  if (valor === undefined) {
    throw new Error(`Falta la variable de entorno obligatoria: ${nombre}`);
  }
  return valor;
}

function leerNumeroPositivo(nombre: string, porDefecto: number): number {
  const crudo = process.env[nombre];
  if (crudo === undefined || crudo === "") return porDefecto;
  const valor = Number(crudo);
  if (!Number.isFinite(valor) || valor <= 0) {
    throw new Error(`La variable de entorno ${nombre} debe ser un número positivo`);
  }
  return valor;
}

// Fail fast at startup if required variables are missing
export const entorno = {
  bd: {
    host: requerirVariable("DB_HOST"),
    puerto: Number(process.env.DB_PORT ?? 3306),
    usuario: requerirVariable("DB_USUARIO"),
    contrasena: requerirDefinida("DB_CONTRASENA"),
    nombre: requerirVariable("DB_NOMBRE"),
  },
  jwtSecret: requerirVariable("JWT_SECRET"),
  jwtExpiraEn: process.env.JWT_EXPIRA_EN ?? "8h",
  puerto: Number(process.env.PORT ?? 3000),
  // Relative paths resolve against the backend root; must stay outside any static directory
  directorioArchivos: process.env.DIRECTORIO_ARCHIVOS || "storage",
  tamanoMaximoArchivoMb: leerNumeroPositivo("TAMANO_MAXIMO_ARCHIVO_MB", 10),
  corsOrigen: (process.env.CORS_ORIGEN ?? "")
    .split(",")
    .map((origen) => origen.trim())
    .filter(Boolean),
};
