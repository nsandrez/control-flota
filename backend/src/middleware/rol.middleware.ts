import type { NextFunction, Request, Response } from "express";
import { ErrorHttp } from "../interface/error.interface";
import type { RolUsuario } from "../interface/usuario.interface";

export function requerirRol(...rolesPermitidos: RolUsuario[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.usuarioAuth) {
      next(new ErrorHttp(401, "No autenticado"));
      return;
    }
    if (!rolesPermitidos.includes(req.usuarioAuth.rol)) {
      next(new ErrorHttp(403, "Acceso denegado"));
      return;
    }
    next();
  };
}
