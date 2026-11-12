import type { NextFunction, Request, Response } from "express";
import { ErrorHttp } from "../interface/error.interface";
import * as proyectoService from "../service/proyecto.service";

function leerId(req: Request): number {
  const crudo = req.params.id;
  if (typeof crudo !== "string" || !/^\d+$/.test(crudo)) {
    throw new ErrorHttp(400, "Id inválido");
  }
  const id = Number(crudo);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new ErrorHttp(400, "Id inválido");
  }
  return id;
}

// Whitelist of accepted body fields (prevents mass assignment)
function leerCuerpo(req: Request) {
  const cuerpo: Record<string, unknown> =
    req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
  return {
    nombre: cuerpo.nombre,
    descripcion: cuerpo.descripcion,
    fechaInicio: cuerpo.fechaInicio,
    fechaFin: cuerpo.fechaFin,
  };
}

export async function listar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { estado, busqueda, pagina, limite } = req.query;
    const resultado = await proyectoService.listar({ estado, busqueda, pagina, limite });
    res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
}

export async function obtener(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const proyecto = await proyectoService.obtener(leerId(req));
    res.status(200).json({ proyecto });
  } catch (error) {
    next(error);
  }
}

export async function crear(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const proyecto = await proyectoService.crear(leerCuerpo(req));
    res.status(201).json({ proyecto });
  } catch (error) {
    next(error);
  }
}

export async function actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const proyecto = await proyectoService.actualizar(leerId(req), leerCuerpo(req));
    res.status(200).json({ proyecto });
  } catch (error) {
    next(error);
  }
}

export async function desactivar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const proyecto = await proyectoService.desactivar(leerId(req));
    res.status(200).json({ proyecto });
  } catch (error) {
    next(error);
  }
}

export async function reactivar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const proyecto = await proyectoService.reactivar(leerId(req));
    res.status(200).json({ proyecto });
  } catch (error) {
    next(error);
  }
}
