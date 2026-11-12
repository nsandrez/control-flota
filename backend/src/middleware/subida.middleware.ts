import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { entorno } from "../config/entorno";
import { ErrorHttp } from "../interface/error.interface";

// Memory storage: nothing touches disk until the content passed magic-byte validation
const subida = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Math.floor(entorno.tamanoMaximoArchivoMb * 1024 * 1024),
    files: 1,
    fields: 10,
    parts: 11,
  },
});

const recibirArchivo = subida.single("archivo");

function traducirError(error: unknown): ErrorHttp {
  if (error instanceof ErrorHttp) return error;
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return new ErrorHttp(413, `El archivo supera el máximo de ${entorno.tamanoMaximoArchivoMb} MB`);
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return new ErrorHttp(400, 'Campo de archivo inesperado: use el campo "archivo"');
    }
    return new ErrorHttp(400, "Solicitud multipart inválida");
  }
  // Malformed multipart bodies surface as plain errors from the parser
  return new ErrorHttp(400, "Solicitud multipart inválida");
}

// Accepts a single file in the "archivo" field; failures go through the error middleware
export function recibirArchivoDocumento(req: Request, res: Response, next: NextFunction): void {
  recibirArchivo(req, res, (error?: unknown) => {
    if (error) {
      next(traducirError(error));
      return;
    }
    next();
  });
}
