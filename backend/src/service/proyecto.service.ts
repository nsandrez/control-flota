import { ErrorHttp } from "../interface/error.interface";
import type {
  ActualizarProyectoDatos,
  CrearProyectoDatos,
  EstadoProyecto,
  Proyecto,
  ResultadoListadoProyecto,
} from "../interface/proyecto.interface";
import * as proyectoRepository from "../repository/proyecto.repository";

const LARGO_MAXIMO_NOMBRE = 150;
const LARGO_MAXIMO_DESCRIPCION = 65535;
const LIMITE_POR_DEFECTO = 20;
const LIMITE_MAXIMO = 100;
const ESTADOS: EstadoProyecto[] = ["ACTIVO", "INACTIVO"];
const FORMATO_ISO = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})?)?$/;

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

function validarFecha(valor: unknown, campo: string): Date | null {
  if (valor === null) return null;
  if (typeof valor !== "string" || !FORMATO_ISO.test(valor)) {
    throw new ErrorHttp(400, `${campo} debe ser una fecha ISO válida`);
  }
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) {
    throw new ErrorHttp(400, `${campo} debe ser una fecha ISO válida`);
  }
  // Reject rollovers such as 2025-02-31
  if (valor.length === 10 && fecha.toISOString().slice(0, 10) !== valor) {
    throw new ErrorHttp(400, `${campo} debe ser una fecha ISO válida`);
  }
  return fecha;
}

function validarRangoFechas(inicio: Date | null, fin: Date | null): void {
  if (inicio && fin && fin.getTime() < inicio.getTime()) {
    throw new ErrorHttp(400, "La fecha de fin no puede ser anterior a la fecha de inicio");
  }
}

async function exigirProyecto(id: number): Promise<Proyecto> {
  const proyecto = await proyectoRepository.buscarPorId(id);
  if (!proyecto) {
    throw new ErrorHttp(404, "Proyecto no encontrado");
  }
  return proyecto;
}

// Pre-check for a friendly 409; uq_proyectos_nombre is the final guard (ER_DUP_ENTRY handled by callers)
async function exigirNombreLibre(nombre: string, excluirId?: number): Promise<void> {
  const existente = await proyectoRepository.buscarPorNombre(nombre, excluirId);
  if (existente) {
    throw new ErrorHttp(409, "Ya existe un proyecto con ese nombre");
  }
}

export async function listar(consulta: {
  estado?: unknown;
  busqueda?: unknown;
  pagina?: unknown;
  limite?: unknown;
}): Promise<ResultadoListadoProyecto> {
  let estado: EstadoProyecto | undefined;
  if (consulta.estado !== undefined) {
    if (typeof consulta.estado !== "string" || !ESTADOS.includes(consulta.estado as EstadoProyecto)) {
      throw new ErrorHttp(400, "Estado inválido");
    }
    estado = consulta.estado as EstadoProyecto;
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

  const { items, total } = await proyectoRepository.listar({ estado, busqueda, pagina, limite });
  return { items, total, pagina, limite };
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

export async function obtener(id: number): Promise<Proyecto> {
  return exigirProyecto(id);
}

export async function crear(entrada: {
  nombre?: unknown;
  descripcion?: unknown;
  fechaInicio?: unknown;
  fechaFin?: unknown;
}): Promise<Proyecto> {
  const datos: CrearProyectoDatos = { nombre: validarNombre(entrada.nombre) };
  if (entrada.descripcion !== undefined) {
    datos.descripcion = validarDescripcion(entrada.descripcion);
  }
  if (entrada.fechaInicio !== undefined) {
    datos.fechaInicio = validarFecha(entrada.fechaInicio, "La fecha de inicio");
  }
  if (entrada.fechaFin !== undefined) {
    datos.fechaFin = validarFecha(entrada.fechaFin, "La fecha de fin");
  }
  validarRangoFechas(datos.fechaInicio ?? null, datos.fechaFin ?? null);

  await exigirNombreLibre(datos.nombre);
  try {
    return await proyectoRepository.crear(datos);
  } catch (error) {
    if (esDuplicado(error)) {
      throw new ErrorHttp(409, "Ya existe un proyecto con ese nombre");
    }
    throw error;
  }
}

export async function actualizar(
  id: number,
  entrada: {
    nombre?: unknown;
    descripcion?: unknown;
    fechaInicio?: unknown;
    fechaFin?: unknown;
  },
): Promise<Proyecto> {
  const actual = await exigirProyecto(id);

  const datos: ActualizarProyectoDatos = {};
  if (entrada.nombre !== undefined) datos.nombre = validarNombre(entrada.nombre);
  if (entrada.descripcion !== undefined) {
    datos.descripcion = validarDescripcion(entrada.descripcion);
  }
  if (entrada.fechaInicio !== undefined) {
    datos.fechaInicio = validarFecha(entrada.fechaInicio, "La fecha de inicio");
  }
  if (entrada.fechaFin !== undefined) {
    datos.fechaFin = validarFecha(entrada.fechaFin, "La fecha de fin");
  }
  if (Object.keys(datos).length === 0) {
    throw new ErrorHttp(400, "No hay campos para actualizar");
  }

  const inicio = datos.fechaInicio !== undefined ? datos.fechaInicio : actual.fechaInicio;
  const fin = datos.fechaFin !== undefined ? datos.fechaFin : actual.fechaFin;
  validarRangoFechas(inicio, fin);

  if (datos.nombre !== undefined) {
    await exigirNombreLibre(datos.nombre, id);
  }
  try {
    const actualizado = await proyectoRepository.actualizar(id, datos);
    if (!actualizado) throw new ErrorHttp(404, "Proyecto no encontrado");
    return actualizado;
  } catch (error) {
    if (esDuplicado(error)) {
      throw new ErrorHttp(409, "Ya existe un proyecto con ese nombre");
    }
    throw error;
  }
}

async function cambiarEstado(id: number, estado: EstadoProyecto): Promise<Proyecto> {
  await exigirProyecto(id);
  const actualizado = await proyectoRepository.cambiarEstado(id, estado);
  if (!actualizado) throw new ErrorHttp(404, "Proyecto no encontrado");
  return actualizado;
}

// Soft delete: vehicles, drivers and documents reference projects
export function desactivar(id: number): Promise<Proyecto> {
  return cambiarEstado(id, "INACTIVO");
}

export function reactivar(id: number): Promise<Proyecto> {
  return cambiarEstado(id, "ACTIVO");
}
