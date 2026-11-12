import { Router } from "express";
import * as proyectoTipoDocumentoController from "../controller/proyectoTipoDocumento.controller";
import { autenticar } from "../middleware/autenticacion.middleware";
import { requerirRol } from "../middleware/rol.middleware";

// Mounted at /api/proyectos/:proyectoId/tipos-documento
export const proyectoTipoDocumentoRouter = Router({ mergeParams: true });

proyectoTipoDocumentoRouter.use(autenticar);

proyectoTipoDocumentoRouter.get(
  "/",
  requerirRol("ADMIN", "OPERADOR"),
  proyectoTipoDocumentoController.listar,
);
proyectoTipoDocumentoRouter.post("/", requerirRol("ADMIN"), proyectoTipoDocumentoController.asignar);
proyectoTipoDocumentoRouter.patch(
  "/:tipoDocumentoId",
  requerirRol("ADMIN"),
  proyectoTipoDocumentoController.actualizarObligatorio,
);
proyectoTipoDocumentoRouter.delete(
  "/:tipoDocumentoId",
  requerirRol("ADMIN"),
  proyectoTipoDocumentoController.desasignar,
);
