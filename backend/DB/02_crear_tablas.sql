-- Creates all tables in dependency order. Safe to re-run (IF NOT EXISTS).
-- Compatible with MariaDB 10.4 and MySQL 8.
USE `control_flota`;

CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(150) NOT NULL,
  `rut` VARCHAR(12) NULL,
  `correo` VARCHAR(190) NULL,
  `contrasena_hash` VARCHAR(255) NOT NULL,
  `rol` ENUM('ADMIN','OPERADOR') NOT NULL DEFAULT 'OPERADOR',
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `creado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_usuarios_rut` (`rut`),
  UNIQUE KEY `uq_usuarios_correo` (`correo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `proyectos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(150) NOT NULL,
  `descripcion` TEXT NULL,
  `estado` ENUM('ACTIVO','INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  `fecha_inicio` DATETIME NULL,
  `fecha_fin` DATETIME NULL,
  `creado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_proyectos_nombre` (`nombre`),
  KEY `idx_proyectos_estado` (`estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tipos_documento` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(150) NOT NULL,
  `descripcion` TEXT NULL,
  `aplica_a` ENUM('VEHICULO','CONDUCTOR') NOT NULL,
  `requiere_vencimiento` TINYINT(1) NOT NULL DEFAULT 0,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `creado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tipos_documento_nombre_aplica_a` (`nombre`, `aplica_a`),
  KEY `idx_tipos_documento_aplica_a_activo` (`aplica_a`, `activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `proyecto_tipos_documento` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `proyecto_id` INT NOT NULL,
  `tipo_documento_id` INT NOT NULL,
  `obligatorio` TINYINT(1) NOT NULL DEFAULT 1,
  `creado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_proyecto_tipo_documento` (`proyecto_id`, `tipo_documento_id`),
  KEY `idx_ptd_tipo_documento_id` (`tipo_documento_id`),
  CONSTRAINT `fk_ptd_proyecto` FOREIGN KEY (`proyecto_id`)
    REFERENCES `proyectos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ptd_tipo_documento` FOREIGN KEY (`tipo_documento_id`)
    REFERENCES `tipos_documento` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `vehiculos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `proyecto_id` INT NOT NULL,
  `patente` VARCHAR(20) NOT NULL,
  `marca` VARCHAR(80) NULL,
  `modelo` VARCHAR(80) NULL,
  `anio` INT NULL,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `creado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_vehiculos_proyecto_patente` (`proyecto_id`, `patente`),
  CONSTRAINT `fk_vehiculos_proyecto` FOREIGN KEY (`proyecto_id`)
    REFERENCES `proyectos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `conductores` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `proyecto_id` INT NOT NULL,
  `nombre` VARCHAR(150) NOT NULL,
  `documento_identidad` VARCHAR(30) NOT NULL,
  `telefono` VARCHAR(30) NULL,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `creado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_conductores_proyecto_documento` (`proyecto_id`, `documento_identidad`),
  CONSTRAINT `fk_conductores_proyecto` FOREIGN KEY (`proyecto_id`)
    REFERENCES `proyectos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invariant: exactly one of vehiculo_id / conductor_id must be set.
-- It is enforced in the service layer. The CHECK below is a second line of
-- defense (supported by MariaDB 10.4 and MySQL 8.0.16+; older MySQL ignores it).
CREATE TABLE IF NOT EXISTS `documentos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tipo_documento_id` INT NOT NULL,
  `vehiculo_id` INT NULL,
  `conductor_id` INT NULL,
  `nombre_archivo` VARCHAR(255) NOT NULL,
  `ruta_archivo` VARCHAR(500) NOT NULL,
  `fecha_vencimiento` DATETIME NULL,
  `estado` ENUM('PENDIENTE','VIGENTE','VENCIDO') NOT NULL DEFAULT 'PENDIENTE',
  `subido_por_id` INT NOT NULL,
  `creado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_documentos_tipo_documento_id` (`tipo_documento_id`),
  KEY `idx_documentos_vehiculo_id` (`vehiculo_id`),
  KEY `idx_documentos_conductor_id` (`conductor_id`),
  KEY `idx_documentos_subido_por_id` (`subido_por_id`),
  KEY `idx_documentos_estado_vencimiento` (`estado`, `fecha_vencimiento`),
  CONSTRAINT `fk_documentos_tipo_documento` FOREIGN KEY (`tipo_documento_id`)
    REFERENCES `tipos_documento` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_documentos_vehiculo` FOREIGN KEY (`vehiculo_id`)
    REFERENCES `vehiculos` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_documentos_conductor` FOREIGN KEY (`conductor_id`)
    REFERENCES `conductores` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_documentos_subido_por` FOREIGN KEY (`subido_por_id`)
    REFERENCES `usuarios` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_documentos_un_solo_titular` CHECK (
    (`vehiculo_id` IS NOT NULL AND `conductor_id` IS NULL)
    OR (`vehiculo_id` IS NULL AND `conductor_id` IS NOT NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
