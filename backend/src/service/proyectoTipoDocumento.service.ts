import { ErrorHttp } from "../interface/error.interface";
import type { Proyecto } from "../interface/proyecto.interface";
import type { ProyectoTipoDocumento } from "../interface/proyectoTipoDocumento.interface";
import type { AplicaA, TipoDocumento } from "../interface/tipoDocumento.interface";
import * as proyectoRepository from "../repository/proyecto.repository";
import * as proyectoTipoDocumentoRepository from "../repository/proyectoTipoDocumento.repository";
import * as tipoDocumentoRepository from "../repository/tipoDocumento.repository";

const APLICA_A: AplicaA[] = ["VEHICULO", "CONDUCTOR"];
const MENSAJE_DUPLICADO = "El tipo de documento ya está asignado al proyecto";

function esDuplicado(error: unknown): boolean {
  return (error as { code?: string }).code === "ER_DUP_ENTRY";
}

function validarObligatorio(valor: unknown): boolean {
  if (typeof valor !== "boolean") {
    throw new ErrorHttp(400, "obligatorio debe ser booleano");
  }
  return valor;
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

async function exigirTipo(id: number): Promise<TipoDocumento> {
  const tipo = await tipoDocumentoRepository.buscarPorId(id);
  if (!tipo) {
    throw new ErrorHttp(404, "Tipo de documento no encontrado");
  }
  return tipo;
}

async function exigirAsignacion(
  proyectoId: number,
  tipoDocumentoId: number,
): Promise<ProyectoTipoDocumento> {
  const asignacion = await proyectoTipoDocumentoRepository.buscar(proyectoId, tipoDocumentoId);
  if (!asignacion) {
    throw new ErrorHttp(404, "El tipo de documento no está asignado al proyecto");
  }
  return asignacion;
}

export async function listar(
  proyectoId: number,
  consulta: { aplicaA?: unknown },
): Promise<ProyectoTipoDocumento[]> {
  let aplicaA: AplicaA | undefined;
  if (consulta.aplicaA !== undefined) {
    if (typeof consulta.aplicaA !== "string" || !APLICA_A.includes(consulta.aplicaA as AplicaA)) {
      throw new ErrorHttp(400, "aplicaA inválido");
    }
    aplicaA = consulta.aplicaA as AplicaA;
  }
  await exigirProyecto(proyectoId);
  return proyectoTipoDocumentoRepository.listar(proyectoId, aplicaA);
}

export async function asignar(
  proyectoId: number,
  entrada: { tipoDocumentoId?: unknown; obligatorio?: unknown },
): Promise<ProyectoTipoDocumento> {
  const tipoDocumentoId = entrada.tipoDocumentoId;
  if (
    typeof tipoDocumentoId !== "number" ||
    !Number.isSafeInteger(tipoDocumentoId) ||
    tipoDocumentoId < 1
  ) {
    throw new ErrorHttp(400, "tipoDocumentoId inválido");
  }
  const obligatorio =
    entrada.obligatorio === undefined ? true : validarObligatorio(entrada.obligatorio);

  await exigirProyectoModificable(proyectoId);
  const tipo = await exigirTipo(tipoDocumentoId);
  if (!tipo.activo) {
    throw new ErrorHttp(409, "El tipo de documento está desactivado");
  }
  if (await proyectoTipoDocumentoRepository.buscar(proyectoId, tipoDocumentoId)) {
    throw new ErrorHttp(409, MENSAJE_DUPLICADO);
  }

  try {
    return await proyectoTipoDocumentoRepository.asignar(proyectoId, tipoDocumentoId, obligatorio);
  } catch (error) {
    if (esDuplicado(error)) {
      throw new ErrorHttp(409, MENSAJE_DUPLICADO);
    }
    throw error;
  }
}

export async function actualizarObligatorio(
  proyectoId: number,
  tipoDocumentoId: number,
  entrada: { obligatorio?: unknown },
): Promise<ProyectoTipoDocumento> {
  if (entrada.obligatorio === undefined) {
    throw new ErrorHttp(400, "obligatorio es obligatorio");
  }
  const obligatorio = validarObligatorio(entrada.obligatorio);

  await exigirProyectoModificable(proyectoId);
  await exigirAsignacion(proyectoId, tipoDocumentoId);
  const actualizada = await proyectoTipoDocumentoRepository.actualizarObligatorio(
    proyectoId,
    tipoDocumentoId,
    obligatorio,
  );
  if (!actualizada) throw new ErrorHttp(404, "El tipo de documento no está asignado al proyecto");
  return actualizada;
}

export async function desasignar(proyectoId: number, tipoDocumentoId: number): Promise<void> {
  await exigirProyectoModificable(proyectoId);
  await exigirAsignacion(proyectoId, tipoDocumentoId);
  const documentos = await proyectoTipoDocumentoRepository.contarDocumentosDelProyecto(
    proyectoId,
    tipoDocumentoId,
  );
  if (documentos > 0) {
    throw new ErrorHttp(
      409,
      "No se puede desasignar: ya existen documentos de este tipo en el proyecto",
    );
  }
  await proyectoTipoDocumentoRepository.desasignar(proyectoId, tipoDocumentoId);
}
