import cors from "cors";
import express from "express";
import helmet from "helmet";
import { entorno } from "./config/entorno";
import { manejarErrores, rutaNoEncontrada } from "./middleware/error.middleware";

export const app = express();

app.use(helmet());
app.use(cors({ origin: entorno.corsOrigen }));
app.use(express.json());

app.use(rutaNoEncontrada);
app.use(manejarErrores);
