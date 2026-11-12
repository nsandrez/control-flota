import { ErrorHttp } from "../interface/error.interface";
import type { Proyecto } from "../interface/proyecto.interface";
import type {
  ActualizarVehiculoDatos,
  CrearVehiculoDatos,
  ResultadoListadoVehiculo,
  Vehiculo,
} from "../interface/vehiculo.interface";
import * as proyectoRepository from "../repository/proyecto.repository";
import * as vehiculoRepository from "../repository/vehiculo.repository";

const LARGO_MAXIMO_TEXTO = 80;
const LARGO_MAXIMO_BUSQUEDA = 80;
const LIMITE_POR_DEFECTO = 20;
const LIMITE_MAXIMO = 100;
const ANIO_MINIMO = 1950;
const FORMATO_PATENTE = /^[A-Z0-9-]{5,10}$/;
const MENSAJE_DUPLICADO = "Ya existe un vehículo con esa patente en el proyecto";
const MENSAJE_DUPLICADO_INACTIVO =
  "Ya existe un vehículo inactivo con esa patente en el proyecto: reactívelo en lugar de crear uno nuevo";

function esDuplicado(error: unknown): boolean {
  return (error as { code?: string }).code === "ER_DUP_ENTRY";
}

function validarPatente(valor: unknown): string {
  if (typeof valor !== "string" || !valor.trim()) {
    throw new ErrorHttp(400, "La patente es obligatoria");
  }
  const patente = valor.trim().toUpperCase();
  if (!FORMATO_PATENTE.test(patente)) {
    throw new ErrorHttp(
      400,
      "La patente debe tener entre 5 y 10 caracteres (letras, dígitos y guion)",
    );
  }
  return patente;
}

function validarTextoOpcional(valor: unknown, campo: string): string | null {
  if (valor === null) return null;
  if (typeof valor !== "string") {
    throw new ErrorHttp(400, `${campo} debe ser texto`);
  }
  const texto = valor.trim();
  if (texto.length > LARGO_MAXIMO_TEXTO) {
    throw new ErrorHttp(400, `${campo} no puede superar ${LARGO_MAXIMO_TEXTO} caracteres`);
  }
  return texto || null;
}

function validarAnio(valor: unknown): number | null {
  if (valor === null) return null;
  const maximo = new Date().getFullYear() + 1;
  if (
    typeof valor !== "number" ||
    !Number.isSafeInteger(valor) ||
    valor < ANIO_MINIMO ||
    valor > maximo
  ) {
    throw new ErrorHttp(400, `El año debe ser un entero entre ${ANIO_MINIMO} y ${maximo}`);
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

async function exigirVehiculo(id: number, proyectoId: number): Promise<Vehiculo> {
  const vehiculo = await vehiculoRepository.buscarPorId(id, proyectoId);
  if (!vehiculo) {
    throw new ErrorHttp(404, "Vehículo no encontrado");
  }
  return vehiculo;
}

async function exigirPatenteLibre(
  proyectoId: number,
  patente: string,
  excluirId?: number,
): Promise<void> {
  const existente = await vehiculoRepository.buscarPorPatente(proyectoId, patente, excluirId);
  if (existente) {
    throw new ErrorHttp(409, existente.activo ? MENSAJE_DUPLICADO : MENSAJE_DUPLICADO_INACTIVO);
  }
}

function validarActivo(valor: unknown): boolean {
  if (valor === undefined) return true;
  if (valor === "true") return true;
  if (valor === "false") return false;
  throw new ErrorHttp(400, "El filtro activo debe ser true o false");
}

export async function listar(
  proyectoId: number,
  consulta: { busqueda?: unknown; activo?: unknown; pagina?: unknown; limite?: unknown },
): Promise<ResultadoListadoVehiculo> {
  // Default: only active vehicles; activo=false lists the inactive ones
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
  const { items, total } = await vehiculoRepository.listar(proyectoId, {
    busqueda,
    activo,
    pagina,
    limite,
  });
  return { items, total, pagina, limite };
}

export async function obtener(proyectoId: number, id: number): Promise<Vehiculo> {
  await exigirProyecto(proyectoId);
  return exigirVehiculo(id, proyectoId);
}

export async function crear(
  proyectoId: number,
  entrada: { patente?: unknown; marca?: unknown; modelo?: unknown; anio?: unknown },
): Promise<Vehiculo> {
  const datos: CrearVehiculoDatos = { patente: validarPatente(entrada.patente) };
  if (entrada.marca !== undefined) datos.marca = validarTextoOpcional(entrada.marca, "La marca");
  if (entrada.modelo !== undefined) {
    datos.modelo = validarTextoOpcional(entrada.modelo, "El modelo");
  }
  if (entrada.anio !== undefined) datos.anio = validarAnio(entrada.anio);

  await exigirProyectoModificable(proyectoId);
  await exigirPatenteLibre(proyectoId, datos.patente);
  try {
    return await vehiculoRepository.crear(proyectoId, datos);
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
  entrada: { patente?: unknown; marca?: unknown; modelo?: unknown; anio?: unknown },
): Promise<Vehiculo> {
  const datos: ActualizarVehiculoDatos = {};
  if (entrada.patente !== undefined) datos.patente = validarPatente(entrada.patente);
  if (entrada.marca !== undefined) datos.marca = validarTextoOpcional(entrada.marca, "La marca");
  if (entrada.modelo !== undefined) {
    datos.modelo = validarTextoOpcional(entrada.modelo, "El modelo");
  }
  if (entrada.anio !== undefined) datos.anio = validarAnio(entrada.anio);
  if (Object.keys(datos).length === 0) {
    throw new ErrorHttp(400, "No hay campos para actualizar");
  }

  await exigirProyectoModificable(proyectoId);
  const actual = await exigirVehiculo(id, proyectoId);
  if (!actual.activo) {
    throw new ErrorHttp(409, "El vehículo está inactivo: reactívelo para editarlo");
  }
  if (datos.patente !== undefined) {
    await exigirPatenteLibre(proyectoId, datos.patente, id);
  }
  try {
    const actualizado = await vehiculoRepository.actualizar(id, proyectoId, datos);
    if (!actualizado) throw new ErrorHttp(404, "Vehículo no encontrado");
    return actualizado;
  } catch (error) {
    if (esDuplicado(error)) {
      throw new ErrorHttp(409, MENSAJE_DUPLICADO);
    }
    throw error;
  }
}

async function cambiarActivo(proyectoId: number, id: number, activo: boolean): Promise<Vehiculo> {
  await exigirProyectoModificable(proyectoId);
  await exigirVehiculo(id, proyectoId);
  const actualizado = await vehiculoRepository.cambiarActivo(id, proyectoId, activo);
  if (!actualizado) throw new ErrorHttp(404, "Vehículo no encontrado");
  return actualizado;
}

// Soft delete (idempotent): documents reference vehicles
export function desactivar(proyectoId: number, id: number): Promise<Vehiculo> {
  return cambiarActivo(proyectoId, id, false);
}

export function reactivar(proyectoId: number, id: number): Promise<Vehiculo> {
  return cambiarActivo(proyectoId, id, true);
}
