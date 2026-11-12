import { Router } from "express";
import * as proyectoController from "../controller/proyecto.controller";
import { autenticar } from "../middleware/autenticacion.middleware";
import { requerirRol } from "../middleware/rol.middleware";

export const proyectoRouter = Router();

proyectoRouter.use(autenticar);

proyectoRouter.get("/", requerirRol("ADMIN", "OPERADOR"), proyectoController.listar);
proyectoRouter.get("/:id", requerirRol("ADMIN", "OPERADOR"), proyectoController.obtener);
proyectoRouter.post("/", requerirRol("ADMIN"), proyectoController.crear);
proyectoRouter.post("/:id/reactivar", requerirRol("ADMIN"), proyectoController.reactivar);
proyectoRouter.put("/:id", requerirRol("ADMIN"), proyectoController.actualizar);
proyectoRouter.delete("/:id", requerirRol("ADMIN"), proyectoController.desactivar);
