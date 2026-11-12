import { Router } from "express";
import * as documentoController from "../controller/documento.controller";
import { autenticar } from "../middleware/autenticacion.middleware";
import { requerirRol } from "../middleware/rol.middleware";
import { recibirArchivoDocumento } from "../middleware/subida.middleware";

// Mounted at /api/proyectos/:proyectoId, before /api/proyectos.
// No router-level auth: only these exact paths are handled, everything else falls through.
export const documentoRouter = Router({ mergeParams: true });

const lectura = [autenticar, requerirRol("ADMIN", "OPERADOR")];

// Auth and role run before multer so unauthorized requests never get parsed
documentoRouter.post(
  "/vehiculos/:vehiculoId/documentos",
  ...lectura,
  recibirArchivoDocumento,
  documentoController.subirDeVehiculo,
);
documentoRouter.post(
  "/conductores/:conductorId/documentos",
  ...lectura,
  recibirArchivoDocumento,
  documentoController.subirDeConductor,
);
documentoRouter.get(
  "/vehiculos/:vehiculoId/documentos",
  ...lectura,
  documentoController.listarDeVehiculo,
);
documentoRouter.get(
  "/conductores/:conductorId/documentos",
  ...lectura,
  documentoController.listarDeConductor,
);
documentoRouter.get("/documentos/:id", ...lectura, documentoController.obtener);
documentoRouter.get("/documentos/:id/descargar", ...lectura, documentoController.descargar);
documentoRouter.put("/documentos/:id", ...lectura, documentoController.actualizar);
documentoRouter.delete(
  "/documentos/:id",
  autenticar,
  requerirRol("ADMIN"),
  documentoController.eliminar,
);
