import path from "node:path";
import { entorno } from "../config/entorno";
import type {
  ArchivoSubido,
  DescargaDocumento,
  Documento,
  DocumentoInterno,
  EstadoDocumento,
  ResultadoListadoDocumento,
  TitularDocumento,
} from "../interface/documento.interface";
import { ErrorHttp } from "../interface/error.interface";
import type { Proyecto } from "../interface/proyecto.interface";
import type { TipoDocumento } from "../interface/tipoDocumento.interface";
import * as conductorRepository from "../repository/conductor.repository";
import * as documentoRepository from "../repository/documento.repository";
import * as proyectoRepository from "../repository/proyecto.repository";
import * as proyectoTipoDocumentoRepository from "../repository/proyectoTipoDocumento.repository";
import * as tipoDocumentoRepository from "../repository/tipoDocumento.repository";
import * as vehiculoRepository from "../repository/vehiculo.repository";
import * as almacenamiento from "./almacenamientoArchivos";

const LIMITE_POR_DEFECTO = 20;
const LIMITE_MAXIMO = 100;
const LARGO_MAXIMO_NOMBRE_ARCHIVO = 255;
const FORMATO_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;
const ANIO_MINIMO = 1970;
const ANIO_MAXIMO = 2100;
const ESTADOS: EstadoDocumento[] = ["VIGENTE", "VENCIDO"];
// Control chars, bidi overrides and path separators are removed from client file names
const CARACTERES_PROHIBIDOS = /[\u0000-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g;
const CARACTERES_RESERVADOS = /[<>:"|?*]/g;

function enteroPositivoTexto(valor: unknown, mensaje: string): number {
  if (typeof valor !== "string" || !/^\d+$/.test(valor)) {
    throw new ErrorHttp(400, mensaje);
  }
  const numero = Number(valor);
  if (!Number.isSafeInteger(numero) || numero < 1) {
    throw new ErrorHttp(400, mensaje);
  }
  return numero;
}

function enteroPositivo(valor: unknown, porDefecto: number, mensaje: string): number {
  if (valor === undefined) return porDefecto;
  return enteroPositivoTexto(valor, mensaje);
}

// Local calendar date (YYYY-MM-DD); the same value feeds SQL and JS comparisons
function fechaHoy(): string {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

// ISO date strings compare correctly as text
function calcularEstado(fechaVencimiento: string | null, hoy: string): EstadoDocumento {
  return fechaVencimiento === null || fechaVencimiento >= hoy ? "VIGENTE" : "VENCIDO";
}

// Returns a valid YYYY-MM-DD string, or null when the value is absent or empty
function validarFecha(valor: unknown): string | null {
  if (valor === undefined || valor === null || valor === "") return null;
  if (typeof valor !== "string") {
    throw new ErrorHttp(400, "fechaVencimiento debe ser una fecha (YYYY-MM-DD)");
  }
  const texto = valor.trim();
  const coincidencia = FORMATO_FECHA.exec(texto);
  if (!coincidencia) {
    throw new ErrorHttp(400, "fechaVencimiento debe ser una fecha (YYYY-MM-DD)");
  }
  const [anio, mes, dia] = [Number(coincidencia[1]), Number(coincidencia[2]), Number(coincidencia[3])];
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  const valida =
    fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia;
  if (!valida || anio < ANIO_MINIMO || anio > ANIO_MAXIMO) {
    throw new ErrorHttp(400, "fechaVencimiento no es una fecha válida");
  }
  return texto;
}

function sanitizarNombreArchivo(nombreOriginal: string, extension: string): string {
  // Multer decodes names as latin1: recover UTF-8 when that yields valid text
  const recuperado = Buffer.from(nombreOriginal, "latin1").toString("utf8");
  const nombre = recuperado.includes("�") ? nombreOriginal : recuperado;
  // Keep only the last path segment, drop control chars and the original extension
  const ultimo = nombre.split(/[\\/]/).pop() ?? "";
  const limpio = ultimo
    .normalize("NFC")
    .replace(CARACTERES_PROHIBIDOS, "")
    .replace(CARACTERES_RESERVADOS, "_")
    .trim()
    .replace(/^\.+/, "");
  const base = path.parse(limpio).name.trim().slice(0, LARGO_MAXIMO_NOMBRE_ARCHIVO - extension.length);
  // The extension always matches the detected type
  return `${base || "documento"}${extension}`;
}

function aPublico(documento: DocumentoInterno): Documento {
  const { rutaArchivo: _ruta, ...publico } = documento;
  return publico;
}

async function exigirProyecto(id: number): Promise<Proyecto> {
  const proyecto = await proyectoRepository.buscarPorId(id);
  if (!proyecto) {
    throw new ErrorHttp(404, "Proyecto no encontrado");
  }
  return proyecto;
}

// Inactive projects can be read but not modified
async function exigirProyectoModificable(id: number): Promise<Proyecto> {
  const proyecto = await exigirProyecto(id);
  if (proyecto.estado !== "ACTIVO") {
    throw new ErrorHttp(409, "El proyecto está inactivo y no puede modificarse");
  }
  return proyecto;
}

// Owner lookups are scoped by project, so another project's owner is a 404
async function exigirTitular(
  titular: TitularDocumento,
  proyectoId: number,
  titularId: number,
): Promise<{ activo: boolean }> {
  if (titular === "VEHICULO") {
    const vehiculo = await vehiculoRepository.buscarPorId(titularId, proyectoId);
    if (!vehiculo) throw new ErrorHttp(404, "Vehículo no encontrado");
    return vehiculo;
  }
  const conductor = await conductorRepository.buscarPorId(titularId, proyectoId);
  if (!conductor) throw new ErrorHttp(404, "Conductor no encontrado");
  return conductor;
}

async function exigirDocumento(
  id: number,
  proyectoId: number,
  hoy: string,
): Promise<DocumentoInterno> {
  const documento = await documentoRepository.buscarPorId(id, proyectoId, hoy);
  if (!documento) {
    throw new ErrorHttp(404, "Documento no encontrado");
  }
  return documento;
}

// requiere_vencimiento decides whether a due date is mandatory or forbidden
function exigirVencimientoCoherente(tipo: TipoDocumento, fechaVencimiento: string | null): void {
  if (tipo.requiereVencimiento && fechaVencimiento === null) {
    throw new ErrorHttp(400, "Este tipo de documento requiere fechaVencimiento");
  }
  if (!tipo.requiereVencimiento && fechaVencimiento !== null) {
    throw new ErrorHttp(400, "Este tipo de documento no admite fechaVencimiento");
  }
}

export async function listar(
  titular: TitularDocumento,
  proyectoId: number,
  titularId: number,
  consulta: { tipoDocumentoId?: unknown; estado?: unknown; pagina?: unknown; limite?: unknown },
): Promise<ResultadoListadoDocumento> {
  const tipoDocumentoId =
    consulta.tipoDocumentoId === undefined
      ? undefined
      : enteroPositivoTexto(consulta.tipoDocumentoId, "tipoDocumentoId inválido");
  let estado: EstadoDocumento | undefined;
  if (consulta.estado !== undefined) {
    if (typeof consulta.estado !== "string" || !ESTADOS.includes(consulta.estado as EstadoDocumento)) {
      throw new ErrorHttp(400, "El filtro estado debe ser VIGENTE o VENCIDO");
    }
    estado = consulta.estado as EstadoDocumento;
  }
  const pagina = enteroPositivo(consulta.pagina, 1, "Página inválida");
  const limite = Math.min(
    enteroPositivo(consulta.limite, LIMITE_POR_DEFECTO, "Límite inválido"),
    LIMITE_MAXIMO,
  );

  await exigirProyecto(proyectoId);
  await exigirTitular(titular, proyectoId, titularId);
  const { items, total } = await documentoRepository.listar(titular, proyectoId, titularId, {
    tipoDocumentoId,
    estado,
    hoy: fechaHoy(),
    pagina,
    limite,
  });
  return { items: items.map(aPublico), total, pagina, limite };
}

export async function obtener(proyectoId: number, id: number): Promise<Documento> {
  await exigirProyecto(proyectoId);
  return aPublico(await exigirDocumento(id, proyectoId, fechaHoy()));
}

export async function descargar(proyectoId: number, id: number): Promise<DescargaDocumento> {
  await exigirProyecto(proyectoId);
  const documento = await exigirDocumento(id, proyectoId, fechaHoy());
  const lectura = await almacenamiento.abrirLectura(documento.rutaArchivo);
  if (!lectura) {
    throw new ErrorHttp(404, "El archivo del documento no está disponible");
  }
  return {
    flujo: lectura.flujo,
    tamano: lectura.tamano,
    nombreArchivo: documento.nombreArchivo,
    tipoMime: almacenamiento.tipoMimePorRuta(documento.rutaArchivo),
  };
}

// Uploading the same tipo again for the same owner is allowed (renewal/history):
// the most recent document by id is the current one.
export async function subir(
  titular: TitularDocumento,
  proyectoId: number,
  titularId: number,
  usuarioId: number,
  entrada: { tipoDocumentoId?: unknown; fechaVencimiento?: unknown },
  archivo: ArchivoSubido | undefined,
): Promise<Documento> {
  // Input validation first (no DB access)
  const tipoDocumentoId = enteroPositivoTexto(entrada.tipoDocumentoId, "tipoDocumentoId inválido");
  const fechaVencimiento = validarFecha(entrada.fechaVencimiento);
  if (!archivo) {
    throw new ErrorHttp(400, 'El archivo es obligatorio (campo "archivo")');
  }
  if (archivo.buffer.length === 0) {
    throw new ErrorHttp(400, "El archivo está vacío");
  }
  const maximoBytes = entorno.tamanoMaximoArchivoMb * 1024 * 1024;
  if (archivo.buffer.length > maximoBytes) {
    throw new ErrorHttp(413, `El archivo supera el máximo de ${entorno.tamanoMaximoArchivoMb} MB`);
  }
  const tipoArchivo = almacenamiento.detectarTipo(archivo.buffer);
  if (!tipoArchivo) {
    throw new ErrorHttp(415, "Tipo de archivo no permitido: solo PDF, JPEG o PNG");
  }

  // Business rules
  await exigirProyectoModificable(proyectoId);
  const dueno = await exigirTitular(titular, proyectoId, titularId);
  if (!dueno.activo) {
    throw new ErrorHttp(
      409,
      titular === "VEHICULO" ? "El vehículo está inactivo" : "El conductor está inactivo",
    );
  }
  const tipo = await tipoDocumentoRepository.buscarPorId(tipoDocumentoId);
  if (!tipo) {
    throw new ErrorHttp(404, "Tipo de documento no encontrado");
  }
  if (!tipo.activo) {
    throw new ErrorHttp(409, "El tipo de documento está desactivado");
  }
  if (tipo.aplicaA !== titular) {
    throw new ErrorHttp(
      400,
      titular === "VEHICULO"
        ? "El tipo de documento no aplica a vehículos"
        : "El tipo de documento no aplica a conductores",
    );
  }
  const asignacion = await proyectoTipoDocumentoRepository.buscar(proyectoId, tipoDocumentoId);
  if (!asignacion) {
    throw new ErrorHttp(409, "El tipo de documento no está asignado al proyecto");
  }
  exigirVencimientoCoherente(tipo, fechaVencimiento);

  const hoy = fechaHoy();
  const rutaArchivo = await almacenamiento.guardar(
    proyectoId,
    archivo.buffer,
    tipoArchivo.extension,
  );
  try {
    // Never trust a client-sent estado: it is derived from fechaVencimiento
    const creado = await documentoRepository.crear(
      proyectoId,
      {
        tipoDocumentoId,
        // Exactly one owner column is set (also enforced by the DB CHECK)
        vehiculoId: titular === "VEHICULO" ? titularId : null,
        conductorId: titular === "CONDUCTOR" ? titularId : null,
        nombreArchivo: sanitizarNombreArchivo(archivo.nombreOriginal, tipoArchivo.extension),
        rutaArchivo,
        fechaVencimiento,
        estado: calcularEstado(fechaVencimiento, hoy),
        subidoPorId: usuarioId,
      },
      hoy,
    );
    return aPublico(creado);
  } catch (error) {
    // Do not leave an orphan file behind
    await almacenamiento.eliminar(rutaArchivo);
    throw error;
  }
}

// Only fechaVencimiento can be changed; the stored file and the rest stay untouched
export async function actualizarVencimiento(
  proyectoId: number,
  id: number,
  entrada: { fechaVencimiento?: unknown },
): Promise<Documento> {
  if (entrada.fechaVencimiento === undefined) {
    throw new ErrorHttp(400, "fechaVencimiento es obligatoria");
  }
  const fechaVencimiento = validarFecha(entrada.fechaVencimiento);

  await exigirProyectoModificable(proyectoId);
  const hoy = fechaHoy();
  const actual = await exigirDocumento(id, proyectoId, hoy);
  const tipo = await tipoDocumentoRepository.buscarPorId(actual.tipoDocumentoId);
  if (!tipo) {
    throw new ErrorHttp(404, "Tipo de documento no encontrado");
  }
  exigirVencimientoCoherente(tipo, fechaVencimiento);

  const actualizado = await documentoRepository.actualizarVencimiento(
    id,
    proyectoId,
    fechaVencimiento,
    calcularEstado(fechaVencimiento, hoy),
    hoy,
  );
  if (!actualizado) throw new ErrorHttp(404, "Documento no encontrado");
  return aPublico(actualizado);
}

// Hard delete: the row goes first so a failed file removal never leaves a dangling row
export async function eliminar(proyectoId: number, id: number): Promise<void> {
  await exigirProyectoModificable(proyectoId);
  const documento = await exigirDocumento(id, proyectoId, fechaHoy());
  const eliminado = await documentoRepository.eliminar(id, proyectoId);
  if (!eliminado) throw new ErrorHttp(404, "Documento no encontrado");
  await almacenamiento.eliminar(documento.rutaArchivo);
}
