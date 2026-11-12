import type { NextFunction, Request, Response } from "express";
import { ErrorHttp } from "../interface/error.interface";
import * as authService from "../service/auth.service";

export async function iniciarSesion(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { rut, contrasena } = req.body ?? {};
    if (typeof rut !== "string" || typeof contrasena !== "string" || !rut || !contrasena) {
      throw new ErrorHttp(400, "RUT y contraseña son obligatorios");
    }
    const resultado = await authService.iniciarSesion({
      rut: rut.trim(),
      contrasena,
    });
    res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
}

export async function obtenerPerfil(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.usuarioAuth) {
      throw new ErrorHttp(401, "No autenticado");
    }
    const usuario = await authService.obtenerUsuarioActual(req.usuarioAuth.usuarioId);
    res.status(200).json({ usuario });
  } catch (error) {
    next(error);
  }
}
