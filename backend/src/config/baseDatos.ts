import mysql from "mysql2/promise";
import { entorno } from "./entorno";

// Shared connection pool. Always use parameterized queries (`?` placeholders).
export const pool = mysql.createPool({
  host: entorno.bd.host,
  port: entorno.bd.puerto,
  user: entorno.bd.usuario,
  password: entorno.bd.contrasena,
  database: entorno.bd.nombre,
  waitForConnections: true,
  connectionLimit: 10,
  charset: "utf8mb4",
});
