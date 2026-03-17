# Migraciones en producción (baseline + deploy)

Si la base de producción se creó con `db push` o sin historial de migraciones, Prisma da **P3005** al hacer `migrate deploy`. Hay que hacer un **baseline** una sola vez: marcar las migraciones ya reflejadas en la DB como aplicadas y luego ejecutar la nueva.

## Una sola vez (con DATABASE_URL de producción)

Desde la raíz del proyecto, con `DATABASE_URL` apuntando a la base de producción (ej. la que usa Vercel):

**Opción rápida (una sola vez):**
```bash
# Definí DATABASE_URL y luego:
npm run db:baseline
```

**Opción manual:** ejecutá estos comandos en orden (reemplazá la URL por la de producción):

```bash
# Windows (PowerShell)
$env:DATABASE_URL = "postgresql://..."   # pegá la URL de Vercel
npx prisma migrate resolve --applied "20260314063200_add_platform_user_permissions"
npx prisma migrate resolve --applied "20260314100000_add_navigation_layout_tenant_branding"
npx prisma migrate resolve --applied "20260316000000_add_audit_actor_name"
npx prisma migrate deploy
```

```bash
# Linux / macOS
export DATABASE_URL="postgresql://..."
npx prisma migrate resolve --applied "20260314063200_add_platform_user_permissions"
npx prisma migrate resolve --applied "20260314100000_add_navigation_layout_tenant_branding"
npx prisma migrate resolve --applied "20260316000000_add_audit_actor_name"
npx prisma migrate deploy
```

Después de esto, la tabla `Member` y el resto tendrán las columnas del módulo de socios y los próximos deploys no deberían fallar por esquema.

## Próximas migraciones

Cuando agregues nuevas migraciones, ejecutá contra producción antes o después del deploy:

```bash
DATABASE_URL="<url-prod>" npx prisma migrate deploy
```

O con el script: `npm run db:migrate` (con `DATABASE_URL` en el entorno).
