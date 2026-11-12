import cors from "cors";
import express from "express";
import helmet from "helmet";
import { entorno } from "./config/entorno";
import { manejarErrores, rutaNoEncontrada } from "./middleware/error.middleware";
import { authRouter } from "./route/auth.route";
import { conductorRouter } from "./route/conductor.route";
import { proyectoRouter } from "./route/proyecto.route";
import { proyectoTipoDocumentoRouter } from "./route/proyectoTipoDocumento.route";
import { tipoDocumentoRouter } from "./route/tipoDocumento.route";
import { vehiculoRouter } from "./route/vehiculo.route";

export const app = express();

app.use(helmet());
app.use(cors({ origin: entorno.corsOrigen }));
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/proyectos/:proyectoId/tipos-documento", proyectoTipoDocumentoRouter);
app.use("/api/proyectos/:proyectoId/vehiculos", vehiculoRouter);
app.use("/api/proyectos/:proyectoId/conductores", conductorRouter);
app.use("/api/proyectos",proyectoRouter);
app.use("/api/tipos-documento", tipoDocumentoRouter);

app.use(rutaNoEncontrada);
app.use(manejarErrores);
