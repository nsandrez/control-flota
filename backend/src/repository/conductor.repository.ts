import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/baseDatos";
import type {
  ActualizarConductorDatos,
  Conductor,
  CrearConductorDatos,
  FiltrosListadoConductor,
} from "../interface/conductor.interface";

interface FilaConductor extends RowDataPacket {
  id: number;
  proyecto_id: number;
  nombre: string;
  documento_identidad: string;
  telefono: string | null;
  activo: number;
  creado_en: Date;
  actualizado_en: Date;
}

const COLUMNAS =
  "id, proyecto_id, nombre, documento_identidad, telefono, activo, creado_en, actualizado_en";

// Whitelist: property name -> column name. Only these can appear in a dynamic SET.
const COLUMNAS_ACTUALIZABLES: Record<keyof ActualizarConductorDatos, string> = {
  nombre: "nombre",
  documentoIdentidad: "documento_identidad",
  telefono: "telefono",
};

function aConductor(fila: FilaConductor): Conductor {
  return {
    id: fila.id,
    proyectoId: fila.proyecto_id,
    nombre: fila.nombre,
    documentoIdentidad: fila.documento_identidad,
    telefono: fila.telefono,
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
  filtros: FiltrosListadoConductor,
): Promise<{ items: Conductor[]; total: number }> {
  const condiciones: string[] = ["proyecto_id = ?", "activo = ?"];
  const parametros: Array<string | number> = [proyectoId, filtros.activo ? 1 : 0];

  if (filtros.busqueda) {
    const patron = `%${escaparLike(filtros.busqueda)}%`;
    condiciones.push("(nombre LIKE ? OR documento_identidad LIKE ?)");
    parametros.push(patron, patron);
  }
  const donde = `WHERE ${condiciones.join(" AND ")}`;

  const [filasTotal] = await pool.execute<Array<RowDataPacket & { total: number }>>(
    `SELECT COUNT(*) AS total FROM conductores ${donde}`,
    parametros,
  );
  const total = Number(filasTotal[0]?.total ?? 0);

  // query() (client-side escaping) is used so LIMIT/OFFSET accept numeric params
  const desplazamiento = (filtros.pagina - 1) * filtros.limite;
  const [filas] = await pool.query<FilaConductor[]>(
    `SELECT ${COLUMNAS} FROM conductores ${donde} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...parametros, filtros.limite, desplazamiento],
  );
  return { items: filas.map(aConductor), total };
}

export async function buscarPorId(id: number, proyectoId: number): Promise<Conductor | null> {
  const [filas] = await pool.execute<FilaConductor[]>(
    `SELECT ${COLUMNAS} FROM conductores WHERE id = ? AND proyecto_id = ? LIMIT 1`,
    [id, proyectoId],
  );
  return filas[0] ? aConductor(filas[0]) : null;
}

export async function buscarPorDocumento(
  proyectoId: number,
  documentoIdentidad: string,
  excluirId?: number,
): Promise<Conductor | null> {
  const [filas] =
    excluirId === undefined
      ? await pool.execute<FilaConductor[]>(
          `SELECT ${COLUMNAS} FROM conductores WHERE proyecto_id = ? AND documento_identidad = ? LIMIT 1`,
          [proyectoId, documentoIdentidad],
        )
      : await pool.execute<FilaConductor[]>(
          `SELECT ${COLUMNAS} FROM conductores WHERE proyecto_id = ? AND documento_identidad = ? AND id <> ? LIMIT 1`,
          [proyectoId, documentoIdentidad, excluirId],
        );
  return filas[0] ? aConductor(filas[0]) : null;
}

export async function crear(proyectoId: number, datos: CrearConductorDatos): Promise<Conductor> {
  const [resultado] = await pool.execute<ResultSetHeader>(
    "INSERT INTO conductores (proyecto_id, nombre, documento_identidad, telefono) VALUES (?, ?, ?, ?)",
    [proyectoId, datos.nombre, datos.documentoIdentidad, datos.telefono ?? null],
  );
  const creado = await buscarPorId(resultado.insertId, proyectoId);
  if (!creado) {
    throw new Error("No se pudo leer el conductor recién creado");
  }
  return creado;
}

export async function actualizar(
  id: number,
  proyectoId: number,
  datos: ActualizarConductorDatos,
): Promise<Conductor | null> {
  const asignaciones: string[] = [];
  const parametros: Array<string | number | null> = [];

  for (const [propiedad, columna] of Object.entries(COLUMNAS_ACTUALIZABLES)) {
    const valor = datos[propiedad as keyof ActualizarConductorDatos];
    if (valor !== undefined) {
      asignaciones.push(`${columna} = ?`);
      parametros.push(valor);
    }
  }

  if (asignaciones.length > 0) {
    await pool.execute<ResultSetHeader>(
      `UPDATE conductores SET ${asignaciones.join(", ")} WHERE id = ? AND proyecto_id = ?`,
      [...parametros, id, proyectoId],
    );
  }
  return buscarPorId(id, proyectoId);
}

export async function cambiarActivo(
  id: number,
  proyectoId: number,
  activo: boolean,
): Promise<Conductor | null> {
  await pool.execute<ResultSetHeader>(
    "UPDATE conductores SET activo = ? WHERE id = ? AND proyecto_id = ?",
    [activo ? 1 : 0, id, proyectoId],
  );
  return buscarPorId(id, proyectoId);
}
