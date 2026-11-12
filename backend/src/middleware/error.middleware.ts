import type { NextFunction, Request, Response } from "express";
import { ErrorHttp } from "../interface/error.interface";

export function rutaNoEncontrada(_req: Request, res: Response): void {
  res.status(404).json({ mensaje: "Recurso no encontrado" });
}

export function manejarErrores(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof ErrorHttp) {
    res.status(error.codigoEstado).json({ mensaje: error.message });
    return;
  }
  // Log server-side only; never expose internals to the client
  console.error(error);
  res.status(500).json({ mensaje: "Error interno del servidor" });
}
