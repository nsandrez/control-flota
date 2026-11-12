import { Router } from "express";
import * as vehiculoController from "../controller/vehiculo.controller";
import { autenticar } from "../middleware/autenticacion.middleware";
import { requerirRol } from "../middleware/rol.middleware";

// Mounted at /api/proyectos/:proyectoId/vehiculos
export const vehiculoRouter = Router({ mergeParams: true });

vehiculoRouter.use(autenticar);

vehiculoRouter.get("/", requerirRol("ADMIN", "OPERADOR"), vehiculoController.listar);
vehiculoRouter.get("/:id", requerirRol("ADMIN", "OPERADOR"), vehiculoController.obtener);
vehiculoRouter.post("/", requerirRol("ADMIN", "OPERADOR"), vehiculoController.crear);
vehiculoRouter.put("/:id", requerirRol("ADMIN", "OPERADOR"), vehiculoController.actualizar);
vehiculoRouter.delete("/:id", requerirRol("ADMIN"), vehiculoController.desactivar);
vehiculoRouter.post("/:id/reactivar", requerirRol("ADMIN"), vehiculoController.reactivar);
