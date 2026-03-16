# Módulo SOCIOS — Resumen de implementación (PASO 6)

## Qué se REUTILIZÓ (sin duplicar)

- **Modelo Member** y **MemberAccount**, **MembershipPayment**, **Notification**, **AuditLog** del schema existente. Se extendieron Member y Notification; el resto se usó tal cual.
- **Actions**: `createMember`, `updateMember` en `src/actions/members.ts` — extendidas con nuevos campos y validaciones. `deleteMember` pasó a **baja lógica** (status = inactive, cuenta desactivada).
- **Permisos**: `members_read`, `members_create`, `members_update`, `members_delete` sin cambios.
- **Portal**: Layout `PortalShell`, login en `/portal/socios/[slug]/login`, sesión con `getMemberAndTenantFromSession`, auth provider "member". Se añadieron rutas y contenido nuevo.
- **Backoffice**: Listado en `members/page.tsx`, tabla `MembersTable`, formulario `MemberFormDialog`. Se extendió el formulario y se añadió búsqueda/filtros; la ficha pasó a pestañas.
- **Auditoría**: `createAuditLog` en todas las acciones nuevas (cuenta, notificaciones, saldo) y en las existentes.
- **Estilo**: `Card`, `Badge`, `Button`, `Input`, `getStatusLabel` / `getStatusVariant`, mismo patrón de server actions + revalidatePath.

---

## Qué se AGREGÓ

### Schema (Prisma)

- **Member** (extensiones):
  - Datos: `address`, `city`, `stateOrProvince`, `country`, `emergencyContactName`, `emergencyContactPhone`, `birthDate`, `statusReason`; estados `pending_validation`, `rejected`.
  - Membresía: `membershipType`, `membershipStatus`, `membershipStartDate`, `membershipEndDate`, `membershipRenewalDate`, `membershipNotes`.
  - Config operativa: `memberTier`, `monthlyLimit`, `dailyLimit`, `remainingBalance`, `consumedThisPeriod`, `periodStartDate`, `canReserveProducts`, `canPreorder`, `canAccessEvents`, `canInviteGuest`, `allowedCategories` (Json), `allowedProducts` (Json), `internalNotes`.
- **MemberBalanceAdjustment**: nueva tabla (tenantId, memberId, amount, type, note, createdById, createdAt) para movimientos de saldo auditados.
- **Notification**: campo `readAt` y relación opcional `member` (Member).

### Migración

- `prisma/migrations/20260317000000_add_member_socios_module/migration.sql`: ADD COLUMN en Member, CREATE TABLE MemberBalanceAdjustment, ADD COLUMN read_at en Notification, índice en (tenantId, documentNumber).

### Actions nuevas

- **member-account.ts**: `createMemberAccount`, `setMemberAccountStatus`, `resetMemberPassword` (permiso members_update, tenant y auditoría).
- **member-notifications.ts**: `getMemberNotificationsForAdmin`, `getMemberNotificationsForPortal`, `markMemberNotificationRead`, `createMemberNotification`.
- **member-balance.ts**: `adjustMemberBalance`, `getMemberBalanceAdjustments`, `getMemberBalanceAdjustmentsForPortal`.
- **member-history.ts**: `getMemberHistoryForAdmin`, `getMemberHistoryForPortal` (lectura de AuditLog por Member / MemberAccount).

### Backoffice (tenant)

- **Listado**: `MemberSearchForm` (búsqueda por texto + filtro por estado); `members/page.tsx` con `searchParams` q y status.
- **Detalle del socio**: página `members/[memberId]/page.tsx` con **pestañas** (componente `MemberDetailTabs`):
  1. **Datos** — datos personales + reprocann.
  2. **Membresía** — tipo, estado, fechas, pagos.
  3. **Config operativa** — tier, límites, saldo, flags can_*, notas.
  4. **Historial** — auditoría (AuditLog) del socio.
  5. **Saldo / cupo** — saldo actual + formulario de ajuste + últimos movimientos.
  6. **Notificaciones** — listado + formulario para crear notificación.
  7. **Cuenta de acceso** — crear cuenta (email + contraseña), activar/desactivar, resetear contraseña.
- **Formulario de socio**: nuevos campos (birthDate, address, city, stateOrProvince, country, emergencyContact, statusReason) y estados (pending_validation, rejected).

### Portal del socio

- **Navegación**: enlaces a Mi membresía, Mi saldo, Mi historial, Notificaciones (en `portal-shell.tsx`).
- **Páginas nuevas**:
  - `(portal)/membership/page.tsx` — Mi membresía (tipo, estado, fechas).
  - `(portal)/balance/page.tsx` — Saldo/cupo y últimos movimientos.
  - `(portal)/history/page.tsx` — Historial (auditoría).
  - `(portal)/notifications/page.tsx` — Listado + marcar leída (client `PortalNotificationsList`).
- **Inicio** `(portal)/page.tsx`: resumen con nombre, estado del socio, estado de membresía, saldo restante, últimas notificaciones y actividad reciente.
- **Perfil** `(portal)/profile/page.tsx`: ampliado con documento, fecha de nacimiento, dirección, contacto de emergencia, estado con Badge.

### Otros

- **status-badges.ts**: etiquetas para `pending_validation`, `rejected`, `pending`, `expired`, `cancelled`.
- **docs/SOCIOS-AUDIT.md**: auditoría de lo existente y qué se reutiliza/agrega.

---

## Tablas / modelos tocados

| Modelo              | Cambio                                      |
|---------------------|---------------------------------------------|
| Member              | Muchos campos nuevos (datos, membresía, operativa, saldo). |
| MemberBalanceAdjustment | Nueva tabla.                            |
| Notification        | `readAt`, relación `member`.                |
| Tenant              | Relación `memberBalanceAdjustments`.        |

MemberAccount, MembershipPayment, AuditLog: **sin cambios de estructura**; solo uso desde nuevas acciones.

---

## Endpoints / server actions

- **Existentes modificados**: `createMember`, `updateMember` (más campos y validaciones), `deleteMember` (baja lógica).
- **Nuevos**:  
  `createMemberAccount`, `setMemberAccountStatus`, `resetMemberPassword`;  
  `getMemberNotificationsForAdmin`, `getMemberNotificationsForPortal`, `markMemberNotificationRead`, `createMemberNotification`;  
  `adjustMemberBalance`, `getMemberBalanceAdjustments`, `getMemberBalanceAdjustmentsForPortal`;  
  `getMemberHistoryForAdmin`, `getMemberHistoryForPortal`.

No se añadieron rutas API REST nuevas; todo mediante server actions y datos en las páginas del app router.

---

## Pantallas agregadas o modificadas

- **Backoffice**:  
  - `members/page.tsx`: búsqueda y filtro por estado.  
  - `members/[memberId]/page.tsx`: reemplazada por vista con pestañas (Datos, Membresía, Config, Historial, Saldo, Notificaciones, Cuenta).  
  - `MemberSearchForm`, `MemberDetailTabs` (y lógica de formularios dentro de las pestañas).
- **Portal**:  
  - `(portal)/page.tsx`: resumen (estado, membresía, saldo, notificaciones, historial).  
  - `(portal)/profile/page.tsx`: más campos.  
  - `(portal)/membership/page.tsx`, `(portal)/balance/page.tsx`, `(portal)/history/page.tsx`, `(portal)/notifications/page.tsx` (nuevas).  
  - `portal-shell.tsx`: nuevos ítems de menú.

---

## Qué quedó completo vs parcial

- **Completo**: datos del socio (incl. dirección, emergencia, estados), membresía (campos y vista), configuración operativa (campos y vista), cuenta de acceso (crear, activar/desactivar, reset), notificaciones (listar, crear, marcar leída), saldo/cupo (visualización y ajustes auditados), historial (auditoría), portal (inicio, perfil, membresía, saldo, historial, notificaciones), backoffice con pestañas y búsqueda/filtros, baja lógica del socio, validación de document_number y member_number por tenant.
- **Parcial / preparado para extender**:  
  - **allowed_categories / allowed_products**: campos Json en Member; en el backoffice no hay UI específica para editarlos (se pueden enviar vía updateMember si se expone).  
  - **Consumo automático de cupo**: no hay integración con dispensations/sales para descontar `consumedThisPeriod` o `remainingBalance` automáticamente; la estructura (límites, saldo, ajustes) está lista para conectar con esa lógica.  
  - **Paginación** en listado de socios: se limita a 200 con filtros; no hay paginación con offset/limit en UI.

---

## Detección de algo existente que solo se extendió

- **Member**: ya existía con memberNumber, nombre, email, phone, documento, status (active/suspended/inactive), reprocann, membershipPlan y fechas de último pago. Se **extendió** con dirección, emergencia, statusReason, estados pending_validation/rejected, membresía (type, status, start/end/renewal, notes), configuración operativa (tier, límites, flags, internal_notes) y saldo (remainingBalance, consumedThisPeriod, periodStartDate).  
- **Notification**: ya tenía tenantId, memberId, title, body, type, read. Se **extendió** con `readAt` y relación a Member.  
- **Portal**: ya tenía login, inicio, perfil, movimientos, tickets. Se **extendió** con páginas de membresía, saldo, historial y notificaciones, y el inicio con resumen.  
- **Ficha del socio**: ya era una sola página con datos, reprocann, membresía y pagos. Se **extendió** a pestañas y se añadieron Historial, Saldo, Notificaciones y Cuenta de acceso.

---

## Cómo validar (PASO 5)

1. **Admin del club**: crear socio, editar socio, configurar membresía y límites desde la ficha (pestañas), activar/desactivar cuenta y resetear contraseña, ver historial y notificaciones, aplicar ajuste de saldo.  
2. **Socio**: iniciar sesión en `/portal/socios/[slug]/login`, ver inicio (resumen), perfil, membresía, saldo, historial y notificaciones; marcar notificación como leída.  
3. **Tenant**: todas las queries y acciones usan `tenantId` del contexto; no se toca la resolución multi-tenant ni el auth global.  
4. **No romper lo existente**: listado, alta, edición y eliminación (ahora baja lógica) de socios; pagos de membresía; login de socio y portal existente siguen funcionando.

Antes de probar en local, ejecutar:

- `npm run db:generate`
- `npm run db:migrate:dev` (o `db:push` si no usás migraciones)

para aplicar el schema y la migración del módulo de socios.
