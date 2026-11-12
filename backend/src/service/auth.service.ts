import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { entorno } from "../config/entorno";
import type {
  Credenciales,
  DatosRegistro,
  PayloadAuth,
  RespuestaLogin,
} from "../interface/auth.interface";
import { ErrorHttp } from "../interface/error.interface";
import type { Usuario, UsuarioPublico } from "../interface/usuario.interface";
import * as usuarioRepository from "../repository/usuario.repository";
import { normalizarRut, validarRut } from "./rut";

const RONDAS_HASH = 12;
// Valid bcrypt hash used to keep response time similar for unknown users
const HASH_FALSO = bcrypt.hashSync("contrasena-falsa", RONDAS_HASH);

function aUsuarioPublico(usuario: Usuario): UsuarioPublico {
  const { contrasenaHash: _omitido, ...publico } = usuario;
  return publico;
}

export async function iniciarSesion(
  credenciales: Credenciales,
): Promise<RespuestaLogin> {
  const rut = normalizarRut(credenciales.rut);
  if (!validarRut(rut)) {
    throw new ErrorHttp(400, "RUT inválido");
  }

  const usuario = await usuarioRepository.buscarPorRut(rut);
  const coincide = await bcrypt.compare(
    credenciales.contrasena,
    usuario?.contrasenaHash ?? HASH_FALSO,
  );

  if (!usuario || !usuario.activo || !coincide) {
    throw new ErrorHttp(401, "Credenciales inválidas");
  }

  const payload: PayloadAuth = {
    usuarioId: usuario.id,
    rut: usuario.rut,
    rol: usuario.rol,
  };
  const opciones: SignOptions = {
    expiresIn: entorno.jwtExpiraEn as SignOptions["expiresIn"],
  };
  const token = jwt.sign(payload, entorno.jwtSecret, opciones);

  return { token, usuario: aUsuarioPublico(usuario) };
}

export async function registrarUsuario(
  datos: DatosRegistro,
): Promise<UsuarioPublico> {
  const rut = normalizarRut(datos.rut);
  if (!validarRut(rut)) {
    throw new ErrorHttp(400, "RUT inválido");
  }

  const existente = await usuarioRepository.buscarPorRut(rut);
  if (existente) {
    throw new ErrorHttp(409, "El RUT ya está registrado");
  }

  const contrasenaHash = await bcrypt.hash(datos.contrasena, RONDAS_HASH);
  try {
    const usuario = await usuarioRepository.crear({
      nombre: datos.nombre,
      rut,
      correo: datos.correo ?? null,
      contrasenaHash,
      rol: datos.rol,
    });
    return aUsuarioPublico(usuario);
  } catch (error) {
    // Race condition, or a duplicate email: a unique key rejected the insert
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") {
      throw new ErrorHttp(409, "El RUT o el correo ya está registrado");
    }
    throw error;
  }
}

export async function obtenerUsuarioActual(
  usuarioId: number,
): Promise<UsuarioPublico> {
  const usuario = await usuarioRepository.buscarPorId(usuarioId);
  if (!usuario || !usuario.activo) {
    throw new ErrorHttp(401, "No autenticado");
  }
  return aUsuarioPublico(usuario);
}

export function verificarToken(token: string): PayloadAuth {
  try {
    const decodificado = jwt.verify(token, entorno.jwtSecret);
    if (typeof decodificado === "string") {
      throw new Error("Payload inválido");
    }
    return {
      usuarioId: Number(decodificado.usuarioId),
      rut: typeof decodificado.rut === "string" ? decodificado.rut : null,
      rol: decodificado.rol,
    };
  } catch {
    throw new ErrorHttp(401, "Token inválido o expirado");
  }
}
