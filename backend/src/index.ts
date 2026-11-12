import { app } from "./app";
import { entorno } from "./config/entorno";

app.listen(entorno.puerto, () => {
  console.log(`Servidor escuchando en el puerto ${entorno.puerto}`);
});
