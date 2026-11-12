import { pipeline } from "node:stream/promises";
import type { NextFunction, Request, Response } from "express";
import type { TitularDocumento } from "../interface/documento.interface";
import { ErrorHttp } from "../interface/error.interface";
import * as documentoService from "../service/documento.service";

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

// Header-safe filename: ASCII fallback plus RFC 5987 UTF-8 form
function cabeceraDescarga(nombre: string): string {
  const alternativo = nombre.replace(/[^\x20-\x7e]|["\\%]/g, "_");
  const codificado = encodeURIComponent(nombre).replace(
    /['()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `attachment; filename="${alternativo}"; filename*=UTF-8''${codificado}`;
}

// The route decides which owner kind the upload belongs to
function subirPara(titular: TitularDocumento, parametro: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cuerpo = leerCuerpoObjeto(req);
      const archivo = req.file
        ? { buffer: req.file.buffer, nombreOriginal: req.file.originalname }
        : undefined;
      const documento = await documentoService.subir(
        titular,
        leerIdParametro(req, "proyectoId"),
        leerIdParametro(req, parametro),
        req.usuarioAuth!.usuarioId,
        {
          tipoDocumentoId: cuerpo.tipoDocumentoId,
          fechaVencimiento: cuerpo.fechaVencimiento,
        },
        archivo,
      );
      res.status(201).json({ documento });
    } catch (error) {
      next(error);
    }
  };
}

function listarPara(titular: TitularDocumento, parametro: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resultado = await documentoService.listar(
        titular,
        leerIdParametro(req, "proyectoId"),
        leerIdParametro(req, parametro),
        {
          tipoDocumentoId: req.query.tipoDocumentoId,
          estado: req.query.estado,
          pagina: req.query.pagina,
          limite: req.query.limite,
        },
      );
      res.status(200).json(resultado);
    } catch (error) {
      next(error);
    }
  };
}

export const subirDeVehiculo = subirPara("VEHICULO", "vehiculoId");
export const subirDeConductor = subirPara("CONDUCTOR", "conductorId");
export const listarDeVehiculo = listarPara("VEHICULO", "vehiculoId");
export const listarDeConductor = listarPara("CONDUCTOR", "conductorId");

export async function obtener(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const documento = await documentoService.obtener(
      leerIdParametro(req, "proyectoId"),
      leerIdParametro(req, "id"),
    );
    res.status(200).json({ documento });
  } catch (error) {
    next(error);
  }
}

export async function descargar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const descarga = await documentoService.descargar(
      leerIdParametro(req, "proyectoId"),
      leerIdParametro(req, "id"),
    );
    res.setHeader("Content-Type", descarga.tipoMime);
    res.setHeader("Content-Length", descarga.tamano);
    res.setHeader("Content-Disposition", cabeceraDescarga(descarga.nombreArchivo));
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store");
    try {
      await pipeline(descarga.flujo, res);
    } catch (error) {
      // Headers are already sent: the connection can only be dropped
      console.error("Error al enviar el archivo:", error);
      res.destroy();
    }
  } catch (error) {
    next(error);
  }
}

// Whitelist of accepted body fields: only fechaVencimiento can change
export async function actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cuerpo = leerCuerpoObjeto(req);
    const documento = await documentoService.actualizarVencimiento(
      leerIdParametro(req, "proyectoId"),
      leerIdParametro(req, "id"),
      { fechaVencimiento: cuerpo.fechaVencimiento },
    );
    res.status(200).json({ documento });
  } catch (error) {
    next(error);
  }
}

export async function eliminar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await documentoService.eliminar(
      leerIdParametro(req, "proyectoId"),
      leerIdParametro(req, "id"),
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
