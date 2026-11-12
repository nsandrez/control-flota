import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/baseDatos";
import type { AplicaA } from "../interface/tipoDocumento.interface";
import type { ProyectoTipoDocumento } from "../interface/proyectoTipoDocumento.interface";
import { aTipoDocumento, type FilaTipoDocumento } from "./tipoDocumento.repository";

interface FilaAsignacion extends FilaTipoDocumento {
  proyecto_id: number;
  obligatorio: number;
  asignado_en: Date;
}

const SELECCION = `SELECT ptd.proyecto_id, ptd.obligatorio, ptd.creado_en AS asignado_en,
  t.id, t.nombre, t.descripcion, t.aplica_a, t.requiere_vencimiento, t.activo,
  t.creado_en, t.actualizado_en
  FROM proyecto_tipos_documento ptd
  INNER JOIN tipos_documento t ON t.id = ptd.tipo_documento_id`;

function aAsignacion(fila: FilaAsignacion): ProyectoTipoDocumento {
  return {
    proyectoId: fila.proyecto_id,
    tipoDocumentoId: fila.id,
    obligatorio: fila.obligatorio === 1,
    asignadoEn: fila.asignado_en,
    tipoDocumento: aTipoDocumento(fila),
  };
}

export async function listar(
  proyectoId: number,
  aplicaA?: AplicaA,
): Promise<ProyectoTipoDocumento[]> {
  const [filas] =
    aplicaA === undefined
      ? await pool.execute<FilaAsignacion[]>(
          `${SELECCION} WHERE ptd.proyecto_id = ? ORDER BY t.nombre ASC, t.id ASC`,
          [proyectoId],
        )
      : await pool.execute<FilaAsignacion[]>(
          `${SELECCION} WHERE ptd.proyecto_id = ? AND t.aplica_a = ? ORDER BY t.nombre ASC, t.id ASC`,
          [proyectoId, aplicaA],
        );
  return filas.map(aAsignacion);
}

export async function buscar(
  proyectoId: number,
  tipoDocumentoId: number,
): Promise<ProyectoTipoDocumento | null> {
  const [filas] = await pool.execute<FilaAsignacion[]>(
    `${SELECCION} WHERE ptd.proyecto_id = ? AND ptd.tipo_documento_id = ? LIMIT 1`,
    [proyectoId, tipoDocumentoId],
  );
  return filas[0] ? aAsignacion(filas[0]) : null;
}

export async function asignar(
  proyectoId: number,
  tipoDocumentoId: number,
  obligatorio: boolean,
): Promise<ProyectoTipoDocumento> {
  await pool.execute<ResultSetHeader>(
    "INSERT INTO proyecto_tipos_documento (proyecto_id, tipo_documento_id, obligatorio) VALUES (?, ?, ?)",
    [proyectoId, tipoDocumentoId, obligatorio ? 1 : 0],
  );
  const creada = await buscar(proyectoId, tipoDocumentoId);
  if (!creada) {
    throw new Error("No se pudo leer la asignación recién creada");
  }
  return creada;
}

export async function actualizarObligatorio(
  proyectoId: number,
  tipoDocumentoId: number,
  obligatorio: boolean,
): Promise<ProyectoTipoDocumento | null> {
  await pool.execute<ResultSetHeader>(
    "UPDATE proyecto_tipos_documento SET obligatorio = ? WHERE proyecto_id = ? AND tipo_documento_id = ?",
    [obligatorio ? 1 : 0, proyectoId, tipoDocumentoId],
  );
  return buscar(proyectoId, tipoDocumentoId);
}

export async function desasignar(proyectoId: number, tipoDocumentoId: number): Promise<boolean> {
  const [resultado] = await pool.execute<ResultSetHeader>(
    "DELETE FROM proyecto_tipos_documento WHERE proyecto_id = ? AND tipo_documento_id = ?",
    [proyectoId, tipoDocumentoId],
  );
  return resultado.affectedRows > 0;
}

// Documents of this type owned by any vehicle or driver of the project
export async function contarDocumentosDelProyecto(
  proyectoId: number,
  tipoDocumentoId: number,
): Promise<number> {
  const [filas] = await pool.execute<Array<RowDataPacket & { total: number }>>(
    `SELECT COUNT(*) AS total FROM documentos d
     LEFT JOIN vehiculos v ON v.id = d.vehiculo_id
     LEFT JOIN conductores c ON c.id = d.conductor_id
     WHERE d.tipo_documento_id = ? AND (v.proyecto_id = ? OR c.proyecto_id = ?)`,
    [tipoDocumentoId, proyectoId, proyectoId],
  );
  return Number(filas[0]?.total ?? 0);
}
