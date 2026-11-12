import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/baseDatos";
import type {
  ActualizarProyectoDatos,
  CrearProyectoDatos,
  EstadoProyecto,
  FiltrosListadoProyecto,
  Proyecto,
} from "../interface/proyecto.interface";

interface FilaProyecto extends RowDataPacket {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: EstadoProyecto;
  fecha_inicio: Date | null;
  fecha_fin: Date | null;
  creado_en: Date;
  actualizado_en: Date;
}

const COLUMNAS =
  "id, nombre, descripcion, estado, fecha_inicio, fecha_fin, creado_en, actualizado_en";

// Whitelist: property name -> column name. Only these can appear in a dynamic SET.
const COLUMNAS_ACTUALIZABLES: Record<keyof ActualizarProyectoDatos, string> = {
  nombre: "nombre",
  descripcion: "descripcion",
  fechaInicio: "fecha_inicio",
  fechaFin: "fecha_fin",
};

function aProyecto(fila: FilaProyecto): Proyecto {
  return {
    id: fila.id,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    estado: fila.estado,
    fechaInicio: fila.fecha_inicio,
    fechaFin: fila.fecha_fin,
    creadoEn: fila.creado_en,
    actualizadoEn: fila.actualizado_en,
  };
}

function escaparLike(texto: string): string {
  return texto.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function listar(
  filtros: FiltrosListadoProyecto,
): Promise<{ items: Proyecto[]; total: number }> {
  const condiciones: string[] = [];
  const parametros: Array<string | number> = [];

  if (filtros.estado) {
    condiciones.push("estado = ?");
    parametros.push(filtros.estado);
  }
  if (filtros.busqueda) {
    condiciones.push("nombre LIKE ?");
    parametros.push(`%${escaparLike(filtros.busqueda)}%`);
  }
  const donde = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";

  const [filasTotal] = await pool.execute<Array<RowDataPacket & { total: number }>>(
    `SELECT COUNT(*) AS total FROM proyectos ${donde}`,
    parametros,
  );
  const total = Number(filasTotal[0]?.total ?? 0);

  // query() (client-side escaping) is used so LIMIT/OFFSET accept numeric params
  const desplazamiento = (filtros.pagina - 1) * filtros.limite;
  const [filas] = await pool.query<FilaProyecto[]>(
    `SELECT ${COLUMNAS} FROM proyectos ${donde} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...parametros, filtros.limite, desplazamiento],
  );
  return { items: filas.map(aProyecto), total };
}

export async function buscarPorId(id: number): Promise<Proyecto | null> {
  const [filas] = await pool.execute<FilaProyecto[]>(
    `SELECT ${COLUMNAS} FROM proyectos WHERE id = ? LIMIT 1`,
    [id],
  );
  return filas[0] ? aProyecto(filas[0]) : null;
}

export async function buscarPorNombre(
  nombre: string,
  excluirId?: number,
): Promise<Proyecto | null> {
  const [filas] =
    excluirId === undefined
      ? await pool.execute<FilaProyecto[]>(
          `SELECT ${COLUMNAS} FROM proyectos WHERE nombre = ? LIMIT 1`,
          [nombre],
        )
      : await pool.execute<FilaProyecto[]>(
          `SELECT ${COLUMNAS} FROM proyectos WHERE nombre = ? AND id <> ? LIMIT 1`,
          [nombre, excluirId],
        );
  return filas[0] ? aProyecto(filas[0]) : null;
}

export async function crear(datos: CrearProyectoDatos): Promise<Proyecto> {
  const [resultado] = await pool.execute<ResultSetHeader>(
    "INSERT INTO proyectos (nombre, descripcion, fecha_inicio, fecha_fin) VALUES (?, ?, ?, ?)",
    [
      datos.nombre,
      datos.descripcion ?? null,
      datos.fechaInicio ?? null,
      datos.fechaFin ?? null,
    ],
  );
  const creado = await buscarPorId(resultado.insertId);
  if (!creado) {
    throw new Error("No se pudo leer el proyecto recién creado");
  }
  return creado;
}

export async function actualizar(
  id: number,
  datos: ActualizarProyectoDatos,
): Promise<Proyecto | null> {
  const asignaciones: string[] = [];
  const parametros: Array<string | number | Date | null> = [];

  for (const [propiedad, columna] of Object.entries(COLUMNAS_ACTUALIZABLES)) {
    const valor = datos[propiedad as keyof ActualizarProyectoDatos];
    if (valor !== undefined) {
      asignaciones.push(`${columna} = ?`);
      parametros.push(valor);
    }
  }

  if (asignaciones.length > 0) {
    await pool.execute<ResultSetHeader>(
      `UPDATE proyectos SET ${asignaciones.join(", ")} WHERE id = ?`,
      [...parametros, id],
    );
  }
  return buscarPorId(id);
}

export async function cambiarEstado(
  id: number,
  estado: EstadoProyecto,
): Promise<Proyecto | null> {
  await pool.execute<ResultSetHeader>(
    "UPDATE proyectos SET estado = ? WHERE id = ?",
    [estado, id],
  );
  return buscarPorId(id);
}
