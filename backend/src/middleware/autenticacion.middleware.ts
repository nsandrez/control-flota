import type { NextFunction, Request, Response } from "express";
import { ErrorHttp } from "../interface/error.interface";
import * as authService from "../service/auth.service";

export function autenticar(req: Request, _res: Response, next: NextFunction): void {
  const cabecera = req.headers.authorization;
  if (!cabecera || !cabecera.startsWith("Bearer ")) {
    next(new ErrorHttp(401, "No autenticado"));
    return;
  }
  try {
    req.usuarioAuth = authService.verificarToken(cabecera.slice(7));
    next();
  } catch (error) {
    next(error);
  }
}
