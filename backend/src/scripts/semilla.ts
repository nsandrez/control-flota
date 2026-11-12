import "dotenv/config";
import bcrypt from "bcryptjs";
import type { ResultSetHeader } from "mysql2";
import { pool } from "../config/baseDatos";
import * as usuarioRepository from "../repository/usuario.repository";
import { normalizarRut, validarRut } from "../service/rut";

async function sembrarAdministrador(): Promise<void> {
  const rutCrudo = process.env.SEMILLA_ADMIN_RUT;
  const contrasena = process.env.SEMILLA_ADMIN_CONTRASENA;
  const correo = process.env.SEMILLA_ADMIN_CORREO?.trim().toLowerCase() || null;
  if (!rutCrudo || !contrasena) {
    throw new Error("Define SEMILLA_ADMIN_RUT y SEMILLA_ADMIN_CONTRASENA");
  }

  const rut = normalizarRut(rutCrudo);
  if (!validarRut(rut)) {
    throw new Error("SEMILLA_ADMIN_RUT no es un RUT válido");
  }

  // Idempotent: an existing user with this RUT is left untouched (password included)
  if (await usuarioRepository.buscarPorRut(rut)) {
    console.log(`Administrador ya existía: ${rut}`);
    return;
  }

  // Legacy user created with only an email: assign the RUT, never touch the password
  if (correo) {
    const [resultado] = await pool.execute<ResultSetHeader>(
      "UPDATE usuarios SET rut = ? WHERE correo = ? AND rut IS NULL",
      [rut, correo],
    );
    if (resultado.affectedRows > 0) {
      console.log(`RUT asignado al usuario existente con correo ${correo}: ${rut}`);
      return;
    }
  }

  const contrasenaHash = await bcrypt.hash(contrasena, 12);
  await usuarioRepository.crear({
    nombre: "Administrador",
    rut,
    correo,
    contrasenaHash,
    rol: "ADMIN",
  });
  console.log(`Administrador creado: ${rut}`);
}

sembrarAdministrador()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
