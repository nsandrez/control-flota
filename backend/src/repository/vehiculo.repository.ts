import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/baseDatos";
import type {
  ActualizarVehiculoDatos,
  CrearVehiculoDatos,
  FiltrosListadoVehiculo,
  Vehiculo,
} from "../interface/vehiculo.interface";

interface FilaVehiculo extends RowDataPacket {
  id: number;
  proyecto_id: number;
  patente: string;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  activo: number;
  creado_en: Date;
  actualizado_en: Date;
}

const COLUMNAS = "id, proyecto_id, patente, marca, modelo, anio, activo, creado_en, actualizado_en";

// Whitelist: property name -> column name. Only these can appear in a dynamic SET.
const COLUMNAS_ACTUALIZABLES: Record<keyof ActualizarVehiculoDatos, string> = {
  patente: "patente",
  marca: "marca",
  modelo: "modelo",
  anio: "anio",
};

function aVehiculo(fila: FilaVehiculo): Vehiculo {
  return {
    id: fila.id,
    proyectoId: fila.proyecto_id,
    patente: fila.patente,
    marca: fila.marca,
    modelo: fila.modelo,
    anio: fila.anio,
    activo: fila.activo === 1,
    creadoEn: fila.creado_en,
    actualizadoEn: fila.actualizado_en,
  };
}

function escaparLike(texto: string): string {
  return texto.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function listar(
  proyectoId: number,
  filtros: FiltrosListadoVehiculo,
): Promise<{ items: Vehiculo[]; total: number }> {
  const condiciones: string[] = ["proyecto_id = ?", "activo = ?"];
  const parametros: Array<string | number> = [proyectoId, filtros.activo ? 1 : 0];

  if (filtros.busqueda) {
    const patron = `%${escaparLike(filtros.busqueda)}%`;
    condiciones.push("(patente LIKE ? OR marca LIKE ? OR modelo LIKE ?)");
    parametros.push(patron, patron, patron);
  }
  const donde = `WHERE ${condiciones.join(" AND ")}`;

  const [filasTotal] = await pool.execute<Array<RowDataPacket & { total: number }>>(
    `SELECT COUNT(*) AS total FROM vehiculos ${donde}`,
    parametros,
  );
  const total = Number(filasTotal[0]?.total ?? 0);

  // query() (client-side escaping) is used so LIMIT/OFFSET accept numeric params
  const desplazamiento = (filtros.pagina - 1) * filtros.limite;
  const [filas] = await pool.query<FilaVehiculo[]>(
    `SELECT ${COLUMNAS} FROM vehiculos ${donde} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...parametros, filtros.limite, desplazamiento],
  );
  return { items: filas.map(aVehiculo), total };
}

export async function buscarPorId(id: number, proyectoId: number): Promise<Vehiculo | null> {
  const [filas] = await pool.execute<FilaVehiculo[]>(
    `SELECT ${COLUMNAS} FROM vehiculos WHERE id = ? AND proyecto_id = ? LIMIT 1`,
    [id, proyectoId],
  );
  return filas[0] ? aVehiculo(filas[0]) : null;
}

export async function buscarPorPatente(
  proyectoId: number,
  patente: string,
  excluirId?: number,
): Promise<Vehiculo | null> {
  const [filas] =
    excluirId === undefined
      ? await pool.execute<FilaVehiculo[]>(
          `SELECT ${COLUMNAS} FROM vehiculos WHERE proyecto_id = ? AND patente = ? LIMIT 1`,
          [proyectoId, patente],
        )
      : await pool.execute<FilaVehiculo[]>(
          `SELECT ${COLUMNAS} FROM vehiculos WHERE proyecto_id = ? AND patente = ? AND id <> ? LIMIT 1`,
          [proyectoId, patente, excluirId],
        );
  return filas[0] ? aVehiculo(filas[0]) : null;
}

export async function crear(proyectoId: number, datos: CrearVehiculoDatos): Promise<Vehiculo> {
  const [resultado] = await pool.execute<ResultSetHeader>(
    "INSERT INTO vehiculos (proyecto_id, patente, marca, modelo, anio) VALUES (?, ?, ?, ?, ?)",
    [proyectoId, datos.patente, datos.marca ?? null, datos.modelo ?? null, datos.anio ?? null],
  );
  const creado = await buscarPorId(resultado.insertId, proyectoId);
  if (!creado) {
    throw new Error("No se pudo leer el vehículo recién creado");
  }
  return creado;
}

export async function actualizar(
  id: number,
  proyectoId: number,
  datos: ActualizarVehiculoDatos,
): Promise<Vehiculo | null> {
  const asignaciones: string[] = [];
  const parametros: Array<string | number | null> = [];

  for (const [propiedad, columna] of Object.entries(COLUMNAS_ACTUALIZABLES)) {
    const valor = datos[propiedad as keyof ActualizarVehiculoDatos];
    if (valor !== undefined) {
      asignaciones.push(`${columna} = ?`);
      parametros.push(valor);
    }
  }

  if (asignaciones.length > 0) {
    await pool.execute<ResultSetHeader>(
      `UPDATE vehiculos SET ${asignaciones.join(", ")} WHERE id = ? AND proyecto_id = ?`,
      [...parametros, id, proyectoId],
    );
  }
  return buscarPorId(id, proyectoId);
}

export async function cambiarActivo(
  id: number,
  proyectoId: number,
  activo: boolean,
): Promise<Vehiculo | null> {
  await pool.execute<ResultSetHeader>(
    "UPDATE vehiculos SET activo = ? WHERE id = ? AND proyecto_id = ?",
    [activo ? 1 : 0, id, proyectoId],
  );
  return buscarPorId(id, proyectoId);
}
