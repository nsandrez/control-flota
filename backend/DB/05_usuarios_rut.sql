-- Login by RUT: adds `usuarios.rut` and makes `correo` optional.
-- Only for databases created before this change (new databases already get it from 02_crear_tablas.sql).
-- Compatible with MariaDB 10.4 and MySQL 8 (MySQL 8 does not support ADD COLUMN IF NOT EXISTS;
-- skip that statement there if the column already exists).
USE `control_flota`;

ALTER TABLE `usuarios` ADD COLUMN IF NOT EXISTS `rut` VARCHAR(12) NULL AFTER `nombre`;

-- NOT re-runnable: run this statement only once (a second run fails with a duplicate key name).
ALTER TABLE `usuarios` ADD UNIQUE KEY `uq_usuarios_rut` (`rut`);

-- The unique index on `correo` stays; multiple NULL values are allowed.
ALTER TABLE `usuarios` MODIFY `correo` VARCHAR(190) NULL;

-- Existing users have no RUT and cannot log in until one is assigned, for example:
--   UPDATE usuarios SET rut = '12345678-9' WHERE id = 1;
-- Use the canonical format: no dots, dash before the check digit, uppercase K.
