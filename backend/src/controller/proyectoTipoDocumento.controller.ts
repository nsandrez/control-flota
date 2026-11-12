import type { NextFunction, Request, Response } from "express";
import { ErrorHttp } from "../interface/error.interface";
import * as proyectoTipoDocumentoService from "../service/proyectoTipoDocumento.service";

function leerIdParametro(req: Request, nombre: string): number {
  const crudo = req.params[nombre];
  if (typeof crudo !== "string" || !/^\d+$/.test(crudo)) {
    throw new ErrorHttp(400, "Id inválido");
  }
  const id = Number(crudo);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new ErrorHttp(400, "Id inválido");
  }
  return id;
}

function leerCuerpoObjeto(req: Request): Record<string, unknown> {
  return req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
}

export async function listar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const items = await proyectoTipoDocumentoService.listar(leerIdParametro(req, "proyectoId"), {
      aplicaA: req.query.aplicaA,
    });
    res.status(200).json({ items });
  } catch (error) {
    next(error);
  }
}

// Whitelist of accepted body fields (prevents mass assignment)
export async function asignar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cuerpo = leerCuerpoObjeto(req);
    const asignacion = await proyectoTipoDocumentoService.asignar(
      leerIdParametro(req, "proyectoId"),
      { tipoDocumentoId: cuerpo.tipoDocumentoId, obligatorio: cuerpo.obligatorio },
    );
    res.status(201).json({ asignacion });
  } catch (error) {
    next(error);
  }
}

export async function actualizarObligatorio(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const cuerpo = leerCuerpoObjeto(req);
    const asignacion = await proyectoTipoDocumentoService.actualizarObligatorio(
      leerIdParametro(req, "proyectoId"),
      leerIdParametro(req, "tipoDocumentoId"),
      { obligatorio: cuerpo.obligatorio },
    );
    res.status(200).json({ asignacion });
  } catch (error) {
    next(error);
  }
}

export async function desasignar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await proyectoTipoDocumentoService.desasignar(
      leerIdParametro(req, "proyectoId"),
      leerIdParametro(req, "tipoDocumentoId"),
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
