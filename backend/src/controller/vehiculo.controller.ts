import type { NextFunction, Request, Response } from "express";
import { ErrorHttp } from "../interface/error.interface";
import * as vehiculoService from "../service/vehiculo.service";

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
    const resultado = await vehiculoService.listar(leerIdParametro(req, "proyectoId"), {
      busqueda: req.query.busqueda,
      activo: req.query.activo,
      pagina: req.query.pagina,
      limite: req.query.limite,
    });
    res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
}

export async function obtener(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const vehiculo = await vehiculoService.obtener(
      leerIdParametro(req, "proyectoId"),
      leerIdParametro(req, "id"),
    );
    res.status(200).json({ vehiculo });
  } catch (error) {
    next(error);
  }
}

// Whitelist of accepted body fields (prevents mass assignment)
export async function crear(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cuerpo = leerCuerpoObjeto(req);
    const vehiculo = await vehiculoService.crear(leerIdParametro(req, "proyectoId"), {
      patente: cuerpo.patente,
      marca: cuerpo.marca,
      modelo: cuerpo.modelo,
      anio: cuerpo.anio,
    });
    res.status(201).json({ vehiculo });
  } catch (error) {
    next(error);
  }
}

export async function actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cuerpo = leerCuerpoObjeto(req);
    const vehiculo = await vehiculoService.actualizar(
      leerIdParametro(req, "proyectoId"),
      leerIdParametro(req, "id"),
      {
        patente: cuerpo.patente,
        marca: cuerpo.marca,
        modelo: cuerpo.modelo,
        anio: cuerpo.anio,
      },
    );
    res.status(200).json({ vehiculo });
  } catch (error) {
    next(error);
  }
}

export async function desactivar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const vehiculo = await vehiculoService.desactivar(
      leerIdParametro(req, "proyectoId"),
      leerIdParametro(req, "id"),
    );
    res.status(200).json({ vehiculo });
  } catch (error) {
    next(error);
  }
}

export async function reactivar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const vehiculo = await vehiculoService.reactivar(
      leerIdParametro(req, "proyectoId"),
      leerIdParametro(req, "id"),
    );
    res.status(200).json({ vehiculo });
  } catch (error) {
    next(error);
  }
}
