import { Router } from "express";
import * as conductorController from "../controller/conductor.controller";
import { autenticar } from "../middleware/autenticacion.middleware";
import { requerirRol } from "../middleware/rol.middleware";

// Mounted at /api/proyectos/:proyectoId/conductores
export const conductorRouter = Router({ mergeParams: true });

conductorRouter.use(autenticar);

conductorRouter.get("/", requerirRol("ADMIN", "OPERADOR"), conductorController.listar);
conductorRouter.get("/:id", requerirRol("ADMIN", "OPERADOR"), conductorController.obtener);
conductorRouter.post("/", requerirRol("ADMIN", "OPERADOR"), conductorController.crear);
conductorRouter.put("/:id", requerirRol("ADMIN", "OPERADOR"), conductorController.actualizar);
conductorRouter.delete("/:id", requerirRol("ADMIN"), conductorController.desactivar);
conductorRouter.post("/:id/reactivar", requerirRol("ADMIN"), conductorController.reactivar);
