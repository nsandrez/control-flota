import { ErrorHttp } from "../interface/error.interface";
import type {
  ActualizarTipoDocumentoDatos,
  AplicaA,
  CrearTipoDocumentoDatos,
  ResultadoListadoTipoDocumento,
  TipoDocumento,
} from "../interface/tipoDocumento.interface";
import * as tipoDocumentoRepository from "../repository/tipoDocumento.repository";

const LARGO_MAXIMO_NOMBRE = 150;
const LARGO_MAXIMO_DESCRIPCION = 65535;
const LIMITE_POR_DEFECTO = 20;
const LIMITE_MAXIMO = 100;
const APLICA_A: AplicaA[] = ["VEHICULO", "CONDUCTOR"];
const MENSAJE_DUPLICADO = "Ya existe un tipo de documento con ese nombre para ese tipo de titular";

interface EntradaTipoDocumento {
  nombre?: unknown;
  descripcion?: unknown;
  aplicaA?: unknown;
  requiereVencimiento?: unknown;
  activo?: unknown;
}

function esDuplicado(error: unknown): boolean {
  return (error as { code?: string }).code === "ER_DUP_ENTRY";
}

function validarNombre(valor: unknown): string {
  if (typeof valor !== "string" || !valor.trim()) {
    throw new ErrorHttp(400, "El nombre es obligatorio");
  }
  const nombre = valor.trim();
  if (nombre.length > LARGO_MAXIMO_NOMBRE) {
    throw new ErrorHttp(400, `El nombre no puede superar ${LARGO_MAXIMO_NOMBRE} caracteres`);
  }
  return nombre;
}

function validarDescripcion(valor: unknown): string | null {
  if (valor === null) return null;
  if (typeof valor !== "string") {
    throw new ErrorHttp(400, "La descripción debe ser texto");
  }
  const descripcion = valor.trim();
  if (descripcion.length > LARGO_MAXIMO_DESCRIPCION) {
    throw new ErrorHttp(400, "La descripción es demasiado larga");
  }
  return descripcion || null;
}

function validarAplicaA(valor: unknown): AplicaA {
  if (typeof valor !== "string" || !APLICA_A.includes(valor as AplicaA)) {
    throw new ErrorHttp(400, "aplicaA debe ser VEHICULO o CONDUCTOR");
  }
  return valor as AplicaA;
}

function validarBooleano(valor: unknown, campo: string): boolean {
  if (typeof valor !== "boolean") {
    throw new ErrorHttp(400, `${campo} debe ser booleano`);
  }
  return valor;
}

function enteroPositivo(valor: unknown, porDefecto: number, mensaje: string): number {
  if (valor === undefined) return porDefecto;
  if (typeof valor !== "string" || !/^\d+$/.test(valor)) {
    throw new ErrorHttp(400, mensaje);
  }
  const numero = Number(valor);
  if (!Number.isSafeInteger(numero) || numero < 1) {
    throw new ErrorHttp(400, mensaje);
  }
  return numero;
}

async function exigirTipo(id: number): Promise<TipoDocumento> {
  const tipo = await tipoDocumentoRepository.buscarPorId(id);
  if (!tipo) {
    throw new ErrorHttp(404, "Tipo de documento no encontrado");
  }
  return tipo;
}

async function exigirNombreLibre(
  nombre: string,
  aplicaA: AplicaA,
  excluirId?: number,
): Promise<void> {
  const existente = await tipoDocumentoRepository.buscarPorNombreYAplicaA(
    nombre,
    aplicaA,
    excluirId,
  );
  if (existente) {
    throw new ErrorHttp(409, MENSAJE_DUPLICADO);
  }
}

export async function listar(consulta: {
  aplicaA?: unknown;
  activo?: unknown;
  busqueda?: unknown;
  pagina?: unknown;
  limite?: unknown;
}): Promise<ResultadoListadoTipoDocumento> {
  let aplicaA: AplicaA | undefined;
  if (consulta.aplicaA !== undefined) {
    if (typeof consulta.aplicaA !== "string" || !APLICA_A.includes(consulta.aplicaA as AplicaA)) {
      throw new ErrorHttp(400, "aplicaA inválido");
    }
    aplicaA = consulta.aplicaA as AplicaA;
  }

  let activo: boolean | undefined;
  if (consulta.activo !== undefined) {
    if (consulta.activo !== "true" && consulta.activo !== "false") {
      throw new ErrorHttp(400, "activo inválido");
    }
    activo = consulta.activo === "true";
  }

  let busqueda: string | undefined;
  if (consulta.busqueda !== undefined) {
    if (typeof consulta.busqueda !== "string") {
      throw new ErrorHttp(400, "Búsqueda inválida");
    }
    busqueda = consulta.busqueda.trim().slice(0, LARGO_MAXIMO_NOMBRE) || undefined;
  }

  const pagina = enteroPositivo(consulta.pagina, 1, "Página inválida");
  const limite = Math.min(
    enteroPositivo(consulta.limite, LIMITE_POR_DEFECTO, "Límite inválido"),
    LIMITE_MAXIMO,
  );

  const { items, total } = await tipoDocumentoRepository.listar({
    aplicaA,
    activo,
    busqueda,
    pagina,
    limite,
  });
  return { items, total, pagina, limite };
}

export async function obtener(id: number): Promise<TipoDocumento> {
  return exigirTipo(id);
}

export async function crear(entrada: EntradaTipoDocumento): Promise<TipoDocumento> {
  const datos: CrearTipoDocumentoDatos = {
    nombre: validarNombre(entrada.nombre),
    aplicaA: validarAplicaA(entrada.aplicaA),
  };
  if (entrada.descripcion !== undefined) {
    datos.descripcion = validarDescripcion(entrada.descripcion);
  }
  if (entrada.requiereVencimiento !== undefined) {
    datos.requiereVencimiento = validarBooleano(entrada.requiereVencimiento, "requiereVencimiento");
  }
  if (entrada.activo !== undefined) {
    datos.activo = validarBooleano(entrada.activo, "activo");
  }

  await exigirNombreLibre(datos.nombre, datos.aplicaA);
  try {
    return await tipoDocumentoRepository.crear(datos);
  } catch (error) {
    if (esDuplicado(error)) {
      throw new ErrorHttp(409, MENSAJE_DUPLICADO);
    }
    throw error;
  }
}

export async function actualizar(
  id: number,
  entrada: EntradaTipoDocumento,
): Promise<TipoDocumento> {
  const actual = await exigirTipo(id);

  const datos: ActualizarTipoDocumentoDatos = {};
  if (entrada.nombre !== undefined) datos.nombre = validarNombre(entrada.nombre);
  if (entrada.descripcion !== undefined) {
    datos.descripcion = validarDescripcion(entrada.descripcion);
  }
  if (entrada.aplicaA !== undefined) datos.aplicaA = validarAplicaA(entrada.aplicaA);
  if (entrada.requiereVencimiento !== undefined) {
    datos.requiereVencimiento = validarBooleano(entrada.requiereVencimiento, "requiereVencimiento");
  }
  if (entrada.activo !== undefined) datos.activo = validarBooleano(entrada.activo, "activo");
  if (Object.keys(datos).length === 0) {
    throw new ErrorHttp(400, "No hay campos para actualizar");
  }

  // aplicaA is locked once the type is in use
  if (datos.aplicaA !== undefined && datos.aplicaA !== actual.aplicaA) {
    if ((await tipoDocumentoRepository.contarDocumentos(id)) > 0) {
      throw new ErrorHttp(409, "No se puede cambiar aplicaA: el tipo ya tiene documentos");
    }
    if ((await tipoDocumentoRepository.contarAsignaciones(id)) > 0) {
      throw new ErrorHttp(409, "No se puede cambiar aplicaA: el tipo está asignado a proyectos");
    }
  }

  const nombreFinal = datos.nombre ?? actual.nombre;
  const aplicaAFinal = datos.aplicaA ?? actual.aplicaA;
  if (nombreFinal !== actual.nombre || aplicaAFinal !== actual.aplicaA) {
    await exigirNombreLibre(nombreFinal, aplicaAFinal, id);
  }

  try {
    const actualizado = await tipoDocumentoRepository.actualizar(id, datos);
    if (!actualizado) throw new ErrorHttp(404, "Tipo de documento no encontrado");
    return actualizado;
  } catch (error) {
    if (esDuplicado(error)) {
      throw new ErrorHttp(409, MENSAJE_DUPLICADO);
    }
    throw error;
  }
}

async function cambiarActivo(id: number, activo: boolean): Promise<TipoDocumento> {
  await exigirTipo(id);
  const actualizado = await tipoDocumentoRepository.cambiarActivo(id, activo);
  if (!actualizado) throw new ErrorHttp(404, "Tipo de documento no encontrado");
  return actualizado;
}

// Soft delete: documents and project assignments reference types
export function desactivar(id: number): Promise<TipoDocumento> {
  return cambiarActivo(id, false);
}

export function reactivar(id: number): Promise<TipoDocumento> {
  return cambiarActivo(id, true);
}
