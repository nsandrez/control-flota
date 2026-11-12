-- Run this only if you created the tables BEFORE the unique index existed in 02_crear_tablas.sql.
-- It fails if two projects already share the same nombre: rename or delete the duplicates first.
USE `control_flota`;

ALTER TABLE `proyectos`
  ADD UNIQUE KEY `uq_proyectos_nombre` (`nombre`);
