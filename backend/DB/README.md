# Database scripts

Target: MariaDB 10.4 (XAMPP) or MySQL 8. Scripts are re-runnable.

Run in order:

1. `01_crear_base_datos.sql` creates the `control_flota` database.
2. `02_crear_tablas.sql` creates all tables.

Only for databases that already existed before these changes (new databases skip them):

- `03_indice_unico_proyectos.sql`: adds the unique index on `proyectos.nombre`.
- `04_desactivar_vehiculos_conductores.sql`: adds `activo` to `vehiculos`/`conductores` and
  switches the `documentos` FKs to `ON DELETE RESTRICT`. Run it once.
- `05_usuarios_rut.sql`: adds `usuarios.rut` (unique) and makes `correo` optional, because login now
  uses RUT. Run it once, then assign a RUT to each existing user
  (`UPDATE usuarios SET rut = '12345678-9' WHERE id = 1;`). Users without a RUT cannot log in.

## phpMyAdmin

Open the **SQL** tab (or **Import**), paste/choose each file and run it, in order.

## mysql CLI

```
mysql -u root -p < DB/01_crear_base_datos.sql
mysql -u root -p < DB/02_crear_tablas.sql
```

XAMPP's `root` has no password by default (omit `-p`; set `DB_CONTRASENA=` empty in `.env`).

Then create the first admin with `npm run semilla`. It reads `SEMILLA_ADMIN_RUT` (e.g. `12345678-5`),
`SEMILLA_ADMIN_CONTRASENA` and, optionally, `SEMILLA_ADMIN_CORREO` from `.env`. If a user with that
correo exists and has no RUT, the seed assigns the RUT to it (the password is never changed).
