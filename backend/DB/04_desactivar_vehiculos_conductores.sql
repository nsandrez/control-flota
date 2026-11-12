-- Run this ONCE, only if the tables were created BEFORE vehicles and drivers became soft-deleted
-- (i.e. from an older 02_crear_tablas.sql). New databases do not need it.
-- 1) Adds the `activo` column (idempotent: IF NOT EXISTS, MariaDB 10.4+).
-- 2) Replaces the two documentos FKs with ON DELETE RESTRICT.
--    DROP FOREIGN KEY fails if run twice (the constraint is already recreated), so do not re-run it.
USE `control_flota`;

ALTER TABLE `vehiculos`
  ADD COLUMN IF NOT EXISTS `activo` TINYINT(1) NOT NULL DEFAULT 1 AFTER `anio`;

ALTER TABLE `conductores`
  ADD COLUMN IF NOT EXISTS `activo` TINYINT(1) NOT NULL DEFAULT 1 AFTER `telefono`;

ALTER TABLE `documentos`
  DROP FOREIGN KEY `fk_documentos_vehiculo`,
  DROP FOREIGN KEY `fk_documentos_conductor`;

ALTER TABLE `documentos`
  ADD CONSTRAINT `fk_documentos_vehiculo` FOREIGN KEY (`vehiculo_id`)
    REFERENCES `vehiculos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_documentos_conductor` FOREIGN KEY (`conductor_id`)
    REFERENCES `conductores` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
