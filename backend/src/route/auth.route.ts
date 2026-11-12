import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as authController from "../controller/auth.controller";
import { autenticar } from "../middleware/autenticacion.middleware";

const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { mensaje: "Demasiados intentos, intente más tarde" },
});

export const authRouter = Router();

authRouter.post("/login", limitadorLogin, authController.iniciarSesion);
authRouter.get("/yo", autenticar, authController.obtenerPerfil);
