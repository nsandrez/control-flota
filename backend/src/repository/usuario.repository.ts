import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/baseDatos";
import type {
  NuevoUsuario,
  RolUsuario,
  Usuario,
} from "../interface/usuario.interface";

interface FilaUsuario extends RowDataPacket {
  id: number;
  nombre: string;
  rut: string | null;
  correo: string | null;
  contrasena_hash: string;
  rol: RolUsuario;
  activo: number;
  creado_en: Date;
  actualizado_en: Date;
}

const COLUMNAS =
  "id, nombre, rut, correo, contrasena_hash, rol, activo, creado_en, actualizado_en";

function aUsuario(fila: FilaUsuario): Usuario {
  return {
    id: fila.id,
    nombre: fila.nombre,
    rut: fila.rut,
    correo: fila.correo,
    contrasenaHash: fila.contrasena_hash,
    rol: fila.rol,
    activo: Boolean(fila.activo),
    creadoEn: fila.creado_en,
    actualizadoEn: fila.actualizado_en,
  };
}

export async function buscarPorRut(rut: string): Promise<Usuario | null> {
  const [filas] = await pool.execute<FilaUsuario[]>(
    `SELECT ${COLUMNAS} FROM usuarios WHERE rut = ? LIMIT 1`,
    [rut],
  );
  return filas[0] ? aUsuario(filas[0]) : null;
}

export async function buscarPorId(id: number): Promise<Usuario | null> {
  const [filas] = await pool.execute<FilaUsuario[]>(
    `SELECT ${COLUMNAS} FROM usuarios WHERE id = ? LIMIT 1`,
    [id],
  );
  return filas[0] ? aUsuario(filas[0]) : null;
}

export async function crear(datos: NuevoUsuario): Promise<Usuario> {
  const [resultado] = await pool.execute<ResultSetHeader>(
    "INSERT INTO usuarios (nombre, rut, correo, contrasena_hash, rol) VALUES (?, ?, ?, ?, ?)",
    [
      datos.nombre,
      datos.rut,
      datos.correo ?? null,
      datos.contrasenaHash,
      datos.rol ?? "OPERADOR",
    ],
  );
  const creado = await buscarPorId(resultado.insertId);
  if (!creado) {
    throw new Error("No se pudo leer el usuario recién creado");
  }
  return creado;
}
