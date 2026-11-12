import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/baseDatos";
import type {
  CrearDocumentoDatos,
  DocumentoInterno,
  EstadoDocumento,
  FiltrosListadoDocumento,
  TitularDocumento,
} from "../interface/documento.interface";

interface FilaDocumento extends RowDataPacket {
  id: number;
  tipo_documento_id: number;
  tipo_documento_nombre: string;
  vehiculo_id: number | null;
  conductor_id: number | null;
  nombre_archivo: string;
  ruta_archivo: string;
  fecha_vencimiento: string | null;
  estado_efectivo: EstadoDocumento;
  subido_por_id: number;
  creado_en: Date;
  actualizado_en: Date;
}

// Effective state from the due date; the single `?` is today's date (YYYY-MM-DD)
const EXPRESION_ESTADO =
  "CASE WHEN d.fecha_vencimiento IS NULL OR DATE(d.fecha_vencimiento) >= ? THEN 'VIGENTE' ELSE 'VENCIDO' END";

const SELECCION = `SELECT d.id, d.tipo_documento_id, t.nombre AS tipo_documento_nombre,
  d.vehiculo_id, d.conductor_id, d.nombre_archivo, d.ruta_archivo,
  DATE_FORMAT(d.fecha_vencimiento, '%Y-%m-%d') AS fecha_vencimiento,
  ${EXPRESION_ESTADO} AS estado_efectivo,
  d.subido_por_id, d.creado_en, d.actualizado_en
  FROM documentos d
  INNER JOIN tipos_documento t ON t.id = d.tipo_documento_id`;

// Constant map: only these identifiers are ever interpolated into SQL
const TITULARES: Record<TitularDocumento, { tabla: string; columna: string }> = {
  VEHICULO: { tabla: "vehiculos", columna: "vehiculo_id" },
  CONDUCTOR: { tabla: "conductores", columna: "conductor_id" },
};

// A document belongs to the project through its owning vehicle or driver
const ALCANCE_PROYECTO = `(d.vehiculo_id IN (SELECT id FROM vehiculos WHERE proyecto_id = ?)
  OR d.conductor_id IN (SELECT id FROM conductores WHERE proyecto_id = ?))`;

function aDocumento(fila: FilaDocumento): DocumentoInterno {
  return {
    id: fila.id,
    tipoDocumentoId: fila.tipo_documento_id,
    tipoDocumentoNombre: fila.tipo_documento_nombre,
    titular: fila.vehiculo_id !== null ? "VEHICULO" : "CONDUCTOR",
    vehiculoId: fila.vehiculo_id,
    conductorId: fila.conductor_id,
    nombreArchivo: fila.nombre_archivo,
    rutaArchivo: fila.ruta_archivo,
    fechaVencimiento: fila.fecha_vencimiento,
    estado: fila.estado_efectivo,
    subidoPorId: fila.subido_por_id,
    creadoEn: fila.creado_en,
    actualizadoEn: fila.actualizado_en,
  };
}

export async function listar(
  titular: TitularDocumento,
  proyectoId: number,
  titularId: number,
  filtros: FiltrosListadoDocumento,
): Promise<{ items: DocumentoInterno[]; total: number }> {
  const { tabla, columna } = TITULARES[titular];
  const condiciones: string[] = [`d.${columna} = ?`];
  const parametros: Array<string | number> = [titularId];

  if (filtros.tipoDocumentoId !== undefined) {
    condiciones.push("d.tipo_documento_id = ?");
    parametros.push(filtros.tipoDocumentoId);
  }
  if (filtros.estado !== undefined) {
    condiciones.push(`${EXPRESION_ESTADO} = ?`);
    parametros.push(filtros.hoy, filtros.estado);
  }
  const union = `INNER JOIN ${tabla} o ON o.id = d.${columna} AND o.proyecto_id = ?`;
  const donde = `WHERE ${condiciones.join(" AND ")}`;

  const [filasTotal] = await pool.execute<Array<RowDataPacket & { total: number }>>(
    `SELECT COUNT(*) AS total FROM documentos d ${union} ${donde}`,
    [proyectoId, ...parametros],
  );
  const total = Number(filasTotal[0]?.total ?? 0);

  // query() (client-side escaping) is used so LIMIT/OFFSET accept numeric params
  const desplazamiento = (filtros.pagina - 1) * filtros.limite;
  const [filas] = await pool.query<FilaDocumento[]>(
    `${SELECCION} ${union} ${donde} ORDER BY d.id DESC LIMIT ? OFFSET ?`,
    [filtros.hoy, proyectoId, ...parametros, filtros.limite, desplazamiento],
  );
  return { items: filas.map(aDocumento), total };
}

export async function buscarPorId(
  id: number,
  proyectoId: number,
  hoy: string,
): Promise<DocumentoInterno | null> {
  const [filas] = await pool.execute<FilaDocumento[]>(
    `${SELECCION} WHERE d.id = ? AND ${ALCANCE_PROYECTO} LIMIT 1`,
    [hoy, id, proyectoId, proyectoId],
  );
  return filas[0] ? aDocumento(filas[0]) : null;
}

export async function crear(
  proyectoId: number,
  datos: CrearDocumentoDatos,
  hoy: string,
): Promise<DocumentoInterno> {
  const [resultado] = await pool.execute<ResultSetHeader>(
    `INSERT INTO documentos
      (tipo_documento_id, vehiculo_id, conductor_id, nombre_archivo, ruta_archivo,
       fecha_vencimiento, estado, subido_por_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      datos.tipoDocumentoId,
      datos.vehiculoId,
      datos.conductorId,
      datos.nombreArchivo,
      datos.rutaArchivo,
      datos.fechaVencimiento,
      datos.estado,
      datos.subidoPorId,
    ],
  );
  const creado = await buscarPorId(resultado.insertId, proyectoId, hoy);
  if (!creado) {
    throw new Error("No se pudo leer el documento recién creado");
  }
  return creado;
}

export async function actualizarVencimiento(
  id: number,
  proyectoId: number,
  fechaVencimiento: string | null,
  estado: EstadoDocumento,
  hoy: string,
): Promise<DocumentoInterno | null> {
  await pool.execute<ResultSetHeader>(
    `UPDATE documentos d SET d.fecha_vencimiento = ?, d.estado = ?
     WHERE d.id = ? AND ${ALCANCE_PROYECTO}`,
    [fechaVencimiento, estado, id, proyectoId, proyectoId],
  );
  return buscarPorId(id, proyectoId, hoy);
}

export async function eliminar(id: number, proyectoId: number): Promise<boolean> {
  const [resultado] = await pool.execute<ResultSetHeader>(
    `DELETE FROM documentos WHERE id = ? AND (
       vehiculo_id IN (SELECT id FROM vehiculos WHERE proyecto_id = ?)
       OR conductor_id IN (SELECT id FROM conductores WHERE proyecto_id = ?))`,
    [id, proyectoId, proyectoId],
  );
  return resultado.affectedRows > 0;
}
