import { Router } from "express";
import * as tipoDocumentoController from "../controller/tipoDocumento.controller";
import { autenticar } from "../middleware/autenticacion.middleware";
import { requerirRol } from "../middleware/rol.middleware";

export const tipoDocumentoRouter = Router();

tipoDocumentoRouter.use(autenticar);

tipoDocumentoRouter.get("/", requerirRol("ADMIN", "OPERADOR"), tipoDocumentoController.listar);
tipoDocumentoRouter.get("/:id", requerirRol("ADMIN", "OPERADOR"), tipoDocumentoController.obtener);
tipoDocumentoRouter.post("/", requerirRol("ADMIN"), tipoDocumentoController.crear);
tipoDocumentoRouter.post("/:id/reactivar", requerirRol("ADMIN"), tipoDocumentoController.reactivar);
tipoDocumentoRouter.put("/:id", requerirRol("ADMIN"), tipoDocumentoController.actualizar);
tipoDocumentoRouter.delete("/:id", requerirRol("ADMIN"), tipoDocumentoController.desactivar);
