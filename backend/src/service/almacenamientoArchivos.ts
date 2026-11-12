import { randomUUID } from "node:crypto";
import { mkdir, open, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { entorno } from "../config/entorno";

export interface TipoArchivo {
  tipoMime: string;
  extension: string;
}

const PDF: TipoArchivo = { tipoMime: "application/pdf", extension: ".pdf" };
const JPEG: TipoArchivo = { tipoMime: "image/jpeg", extension: ".jpg" };
const PNG: TipoArchivo = { tipoMime: "image/png", extension: ".png" };

const TIPOS_POR_EXTENSION: Record<string, string> = {
  ".pdf": PDF.tipoMime,
  ".jpg": JPEG.tipoMime,
  ".png": PNG.tipoMime,
};

// Backend root: src/config (ts) or dist/config (compiled) are both two levels below it
const RAIZ_BACKEND = path.resolve(__dirname, "..", "..");
const RAIZ_ALMACENAMIENTO = path.resolve(RAIZ_BACKEND, entorno.directorioArchivos);

function empieza(buffer: Buffer, firma: number[]): boolean {
  return buffer.length >= firma.length && firma.every((byte, i) => buffer[i] === byte);
}

// Detects the real type from the content (magic bytes); the client mimetype/extension is ignored
export function detectarTipo(buffer: Buffer): TipoArchivo | null {
  if (empieza(buffer, [0x25, 0x50, 0x44, 0x46, 0x2d])) return PDF; // %PDF-
  if (empieza(buffer, [0xff, 0xd8, 0xff])) return JPEG;
  if (empieza(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return PNG;
  return null;
}

export function tipoMimePorRuta(rutaRelativa: string): string {
  return TIPOS_POR_EXTENSION[path.extname(rutaRelativa).toLowerCase()] ?? "application/octet-stream";
}

// Resolves a stored relative path and guarantees it stays inside the storage root
function resolverRuta(rutaRelativa: string): string | null {
  if (!rutaRelativa || rutaRelativa.includes("\0") || path.isAbsolute(rutaRelativa)) return null;
  const absoluta = path.resolve(RAIZ_ALMACENAMIENTO, rutaRelativa);
  return absoluta.startsWith(RAIZ_ALMACENAMIENTO + path.sep) ? absoluta : null;
}

// Saves under <root>/<proyectoId>/<uuid><ext> and returns the relative path (posix separators)
export async function guardar(
  proyectoId: number,
  contenido: Buffer,
  extension: string,
): Promise<string> {
  const rutaRelativa = `${proyectoId}/${randomUUID()}${extension}`;
  const absoluta = resolverRuta(rutaRelativa);
  if (!absoluta) {
    throw new Error("Ruta de almacenamiento inválida");
  }
  await mkdir(path.dirname(absoluta), { recursive: true });
  // "wx": never overwrite an existing file
  await writeFile(absoluta, contenido, { flag: "wx", mode: 0o600 });
  return rutaRelativa;
}

// Best effort: a missing file is fine, other failures are only logged
export async function eliminar(rutaRelativa: string): Promise<void> {
  const absoluta = resolverRuta(rutaRelativa);
  if (!absoluta) {
    console.error("Ruta de archivo fuera del almacenamiento, no se elimina:", rutaRelativa);
    return;
  }
  try {
    await unlink(absoluta);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("No se pudo eliminar el archivo almacenado:", error);
    }
  }
}

// Returns null when the file is missing, unreadable or the path is not safe
export async function abrirLectura(
  rutaRelativa: string,
): Promise<{ flujo: NodeJS.ReadableStream; tamano: number } | null> {
  const absoluta = resolverRuta(rutaRelativa);
  if (!absoluta) return null;
  try {
    const manejador = await open(absoluta, "r");
    const estadisticas = await manejador.stat();
    if (!estadisticas.isFile()) {
      await manejador.close();
      return null;
    }
    // The stream owns the handle and closes it when done
    const flujo = manejador.createReadStream();
    return { flujo, tamano: estadisticas.size };
  } catch {
    return null;
  }
}
