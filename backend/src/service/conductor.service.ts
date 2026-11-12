import type {
  ActualizarConductorDatos,
  Conductor,
  CrearConductorDatos,
  ResultadoListadoConductor,
} from "../interface/conductor.interface";
import { ErrorHttp } from "../interface/error.interface";
import type { Proyecto } from "../interface/proyecto.interface";
import * as conductorRepository from "../repository/conductor.repository";
import * as proyectoRepository from "../repository/proyecto.repository";

const LARGO_MAXIMO_NOMBRE = 150;
const LARGO_MAXIMO_TELEFONO = 30;
const LARGO_MAXIMO_BUSQUEDA = 150;
const LIMITE_POR_DEFECTO = 20;
const LIMITE_MAXIMO = 100;
const FORMATO_DOCUMENTO = /^[A-Z0-9-]{5,20}$/;
const FORMATO_TELEFONO = /^[0-9 +\-()]+$/;
const MENSAJE_DUPLICADO = "Ya existe un conductor con ese documento en el proyecto";
const MENSAJE_DUPLICADO_INACTIVO =
  "Ya existe un conductor inactivo con ese documento en el proyecto: reactívelo en lugar de crear uno nuevo";

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

function validarDocumento(valor: unknown): string {
  if (typeof valor !== "string" || !valor.trim()) {
    throw new ErrorHttp(400, "El documento de identidad es obligatorio");
  }
  const documento = valor.trim().toUpperCase().replace(/[.\s]/g, "");
  if (!FORMATO_DOCUMENTO.test(documento)) {
    throw new ErrorHttp(
      400,
      "El documento de identidad debe tener entre 5 y 20 caracteres (letras, dígitos y guion)",
    );
  }
  return documento;
}

function validarTelefono(valor: unknown): string | null {
  if (valor === null) return null;
  if (typeof valor !== "string") {
    throw new ErrorHttp(400, "El teléfono debe ser texto");
  }
  const telefono = valor.trim();
  if (telefono.length > LARGO_MAXIMO_TELEFONO) {
    throw new ErrorHttp(400, `El teléfono no puede superar ${LARGO_MAXIMO_TELEFONO} caracteres`);
  }
  if (telefono && !FORMATO_TELEFONO.test(telefono)) {
    throw new ErrorHttp(400, "El teléfono solo admite dígitos, espacios, +, - y paréntesis");
  }
  return telefono || null;
}

function validarActivo(valor: unknown): boolean {
  if (valor === undefined) return true;
  if (valor === "true") return true;
  if (valor === "false") return false;
  throw new ErrorHttp(400, "El filtro activo debe ser true o false");
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

async function exigirConductor(id: number, proyectoId: number): Promise<Conductor> {
  const conductor = await conductorRepository.buscarPorId(id, proyectoId);
  if (!conductor) {
    throw new ErrorHttp(404, "Conductor no encontrado");
  }
  return conductor;
}

// Pre-check for a friendly 409; uq_conductores_proyecto_documento is the final guard
async function exigirDocumentoLibre(
  proyectoId: number,
  documento: string,
  excluirId?: number,
): Promise<void> {
  const existente = await conductorRepository.buscarPorDocumento(proyectoId, documento, excluirId);
  if (existente) {
    throw new ErrorHttp(409, existente.activo ? MENSAJE_DUPLICADO : MENSAJE_DUPLICADO_INACTIVO);
  }
}

export async function listar(
  proyectoId: number,
  consulta: { busqueda?: unknown; activo?: unknown; pagina?: unknown; limite?: unknown },
): Promise<ResultadoListadoConductor> {
  // Default: only active drivers; activo=false lists the inactive ones
  const activo = validarActivo(consulta.activo);
  let busqueda: string | undefined;
  if (consulta.busqueda !== undefined) {
    if (typeof consulta.busqueda !== "string") {
      throw new ErrorHttp(400, "Búsqueda inválida");
    }
    busqueda = consulta.busqueda.trim().slice(0, LARGO_MAXIMO_BUSQUEDA) || undefined;
  }
  const pagina = enteroPositivo(consulta.pagina, 1, "Página inválida");
  const limite = Math.min(
    enteroPositivo(consulta.limite, LIMITE_POR_DEFECTO, "Límite inválido"),
    LIMITE_MAXIMO,
  );

  await exigirProyecto(proyectoId);
  const { items, total } = await conductorRepository.listar(proyectoId, {
    busqueda,
    activo,
    pagina,
    limite,
  });
  return { items, total, pagina, limite };
}

export async function obtener(proyectoId: number, id: number): Promise<Conductor> {
  await exigirProyecto(proyectoId);
  return exigirConductor(id, proyectoId);
}

export async function crear(
  proyectoId: number,
  entrada: { nombre?: unknown; documentoIdentidad?: unknown; telefono?: unknown },
): Promise<Conductor> {
  const datos: CrearConductorDatos = {
    nombre: validarNombre(entrada.nombre),
    documentoIdentidad: validarDocumento(entrada.documentoIdentidad),
  };
  if (entrada.telefono !== undefined) datos.telefono = validarTelefono(entrada.telefono);

  await exigirProyectoModificable(proyectoId);
  await exigirDocumentoLibre(proyectoId, datos.documentoIdentidad);
  try {
    return await conductorRepository.crear(proyectoId, datos);
  } catch (error) {
    if (esDuplicado(error)) {
      throw new ErrorHttp(409, MENSAJE_DUPLICADO);
    }
    throw error;
  }
}

export async function actualizar(
  proyectoId: number,
  id: number,
  entrada: { nombre?: unknown; documentoIdentidad?: unknown; telefono?: unknown },
): Promise<Conductor> {
  const datos: ActualizarConductorDatos = {};
  if (entrada.nombre !== undefined) datos.nombre = validarNombre(entrada.nombre);
  if (entrada.documentoIdentidad !== undefined) {
    datos.documentoIdentidad = validarDocumento(entrada.documentoIdentidad);
  }
  if (entrada.telefono !== undefined) datos.telefono = validarTelefono(entrada.telefono);
  if (Object.keys(datos).length === 0) {
    throw new ErrorHttp(400, "No hay campos para actualizar");
  }

  await exigirProyectoModificable(proyectoId);
  const actual = await exigirConductor(id, proyectoId);
  if (!actual.activo) {
    throw new ErrorHttp(409, "El conductor está inactivo: reactívelo para editarlo");
  }
  if (datos.documentoIdentidad !== undefined) {
    await exigirDocumentoLibre(proyectoId, datos.documentoIdentidad, id);
  }
  try {
    const actualizado = await conductorRepository.actualizar(id, proyectoId, datos);
    if (!actualizado) throw new ErrorHttp(404, "Conductor no encontrado");
    return actualizado;
  } catch (error) {
    if (esDuplicado(error)) {
      throw new ErrorHttp(409, MENSAJE_DUPLICADO);
    }
    throw error;
  }
}

async function cambiarActivo(proyectoId: number, id: number, activo: boolean): Promise<Conductor> {
  await exigirProyectoModificable(proyectoId);
  await exigirConductor(id, proyectoId);
  const actualizado = await conductorRepository.cambiarActivo(id, proyectoId, activo);
  if (!actualizado) throw new ErrorHttp(404, "Conductor no encontrado");
  return actualizado;
}

// Soft delete (idempotent): documents reference drivers
export function desactivar(proyectoId: number, id: number): Promise<Conductor> {
  return cambiarActivo(proyectoId, id, false);
}

export function reactivar(proyectoId: number, id: number): Promise<Conductor> {
  return cambiarActivo(proyectoId, id, true);
}
