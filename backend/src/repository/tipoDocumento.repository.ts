import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/baseDatos";
import type {
  ActualizarTipoDocumentoDatos,
  AplicaA,
  CrearTipoDocumentoDatos,
  FiltrosListadoTipoDocumento,
  TipoDocumento,
} from "../interface/tipoDocumento.interface";

export interface FilaTipoDocumento extends RowDataPacket {
  id: number;
  nombre: string;
  descripcion: string | null;
  aplica_a: AplicaA;
  requiere_vencimiento: number;
  activo: number;
  creado_en: Date;
  actualizado_en: Date;
}

export const COLUMNAS =
  "id, nombre, descripcion, aplica_a, requiere_vencimiento, activo, creado_en, actualizado_en";

// Whitelist: property name -> column name. Only these can appear in a dynamic SET.
const COLUMNAS_ACTUALIZABLES: Record<keyof ActualizarTipoDocumentoDatos, string> = {
  nombre: "nombre",
  descripcion: "descripcion",
  aplicaA: "aplica_a",
  requiereVencimiento: "requiere_vencimiento",
  activo: "activo",
};

export function aTipoDocumento(fila: FilaTipoDocumento): TipoDocumento {
  return {
    id: fila.id,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    aplicaA: fila.aplica_a,
    requiereVencimiento: fila.requiere_vencimiento === 1,
    activo: fila.activo === 1,
    creadoEn: fila.creado_en,
    actualizadoEn: fila.actualizado_en,
  };
}

function escaparLike(texto: string): string {
  return texto.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function listar(
  filtros: FiltrosListadoTipoDocumento,
): Promise<{ items: TipoDocumento[]; total: number }> {
  const condiciones: string[] = [];
  const parametros: Array<string | number> = [];

  if (filtros.aplicaA) {
    condiciones.push("aplica_a = ?");
    parametros.push(filtros.aplicaA);
  }
  if (filtros.activo !== undefined) {
    condiciones.push("activo = ?");
    parametros.push(filtros.activo ? 1 : 0);
  }
  if (filtros.busqueda) {
    condiciones.push("nombre LIKE ?");
    parametros.push(`%${escaparLike(filtros.busqueda)}%`);
  }
  const donde = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";

  const [filasTotal] = await pool.execute<Array<RowDataPacket & { total: number }>>(
    `SELECT COUNT(*) AS total FROM tipos_documento ${donde}`,
    parametros,
  );
  const total = Number(filasTotal[0]?.total ?? 0);

  // query() (client-side escaping) is used so LIMIT/OFFSET accept numeric params
  const desplazamiento = (filtros.pagina - 1) * filtros.limite;
  const [filas] = await pool.query<FilaTipoDocumento[]>(
    `SELECT ${COLUMNAS} FROM tipos_documento ${donde} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...parametros, filtros.limite, desplazamiento],
  );
  return { items: filas.map(aTipoDocumento), total };
}

export async function buscarPorId(id: number): Promise<TipoDocumento | null> {
  const [filas] = await pool.execute<FilaTipoDocumento[]>(
    `SELECT ${COLUMNAS} FROM tipos_documento WHERE id = ? LIMIT 1`,
    [id],
  );
  return filas[0] ? aTipoDocumento(filas[0]) : null;
}

export async function buscarPorNombreYAplicaA(
  nombre: string,
  aplicaA: AplicaA,
  excluirId?: number,
): Promise<TipoDocumento | null> {
  const [filas] =
    excluirId === undefined
      ? await pool.execute<FilaTipoDocumento[]>(
          `SELECT ${COLUMNAS} FROM tipos_documento WHERE nombre = ? AND aplica_a = ? LIMIT 1`,
          [nombre, aplicaA],
        )
      : await pool.execute<FilaTipoDocumento[]>(
          `SELECT ${COLUMNAS} FROM tipos_documento WHERE nombre = ? AND aplica_a = ? AND id <> ? LIMIT 1`,
          [nombre, aplicaA, excluirId],
        );
  return filas[0] ? aTipoDocumento(filas[0]) : null;
}

export async function contarDocumentos(id: number): Promise<number> {
  const [filas] = await pool.execute<Array<RowDataPacket & { total: number }>>(
    "SELECT COUNT(*) AS total FROM documentos WHERE tipo_documento_id = ?",
    [id],
  );
  return Number(filas[0]?.total ?? 0);
}

export async function contarAsignaciones(id: number): Promise<number> {
  const [filas] = await pool.execute<Array<RowDataPacket & { total: number }>>(
    "SELECT COUNT(*) AS total FROM proyecto_tipos_documento WHERE tipo_documento_id = ?",
    [id],
  );
  return Number(filas[0]?.total ?? 0);
}

export async function crear(datos: CrearTipoDocumentoDatos): Promise<TipoDocumento> {
  const [resultado] = await pool.execute<ResultSetHeader>(
    "INSERT INTO tipos_documento (nombre, descripcion, aplica_a, requiere_vencimiento, activo) VALUES (?, ?, ?, ?, ?)",
    [
      datos.nombre,
      datos.descripcion ?? null,
      datos.aplicaA,
      datos.requiereVencimiento ? 1 : 0,
      datos.activo === false ? 0 : 1,
    ],
  );
  const creado = await buscarPorId(resultado.insertId);
  if (!creado) {
    throw new Error("No se pudo leer el tipo de documento recién creado");
  }
  return creado;
}

export async function actualizar(
  id: number,
  datos: ActualizarTipoDocumentoDatos,
): Promise<TipoDocumento | null> {
  const asignaciones: string[] = [];
  const parametros: Array<string | number | null> = [];

  for (const [propiedad, columna] of Object.entries(COLUMNAS_ACTUALIZABLES)) {
    const valor = datos[propiedad as keyof ActualizarTipoDocumentoDatos];
    if (valor !== undefined) {
      asignaciones.push(`${columna} = ?`);
      parametros.push(typeof valor === "boolean" ? (valor ? 1 : 0) : valor);
    }
  }

  if (asignaciones.length > 0) {
    await pool.execute<ResultSetHeader>(
      `UPDATE tipos_documento SET ${asignaciones.join(", ")} WHERE id = ?`,
      [...parametros, id],
    );
  }
  return buscarPorId(id);
}

export async function cambiarActivo(id: number, activo: boolean): Promise<TipoDocumento | null> {
  await pool.execute<ResultSetHeader>("UPDATE tipos_documento SET activo = ? WHERE id = ?", [
    activo ? 1 : 0,
    id,
  ]);
  return buscarPorId(id);
}
