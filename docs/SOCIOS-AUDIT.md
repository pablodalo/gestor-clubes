# Auditoría: módulo SOCIOS (PASO 1)

## Lo que YA EXISTE

### Modelo Member (prisma)
- **Existe**, **parcial**.
- Tiene: memberNumber, firstName, lastName, email, phone, documentType, documentNumber, birthDate, status (active|suspended|inactive), category, notes, avatarUrl.
- Tiene: reprocann*, membershipPlan, membershipRecurring, membershipRecurrenceDay, membershipLastPaidAt, membershipLastAmount, membershipCurrency.
- **Falta:** address, city, state_or_province, country, emergency_contact_*, status_reason, status values (pending_validation, rejected). photo_url → ya existe como avatarUrl.

### MemberAccount
- **Existe**, **completo**: email, passwordHash, status, lastLoginAt. Cuenta para login del socio.

### MembershipPayment
- **Existe**: pagos de membresía por tenant/member.

### Notification
- **Existe**: tenantId, userId?, memberId?, title, body, type, read, createdAt. Listo para notificaciones al socio.

### AuditLog
- **Existe**: actorType (platform_user|user|**member**), actorId, action, entityName, entityId, beforeJson, afterJson. Sirve para historial.

### Portal del socio
- **Existe**, **parcial**: /portal/socios/[slug]/login, (portal)/page (inicio), profile, movements, tickets.
- **Falta:** pantallas Mi membresía, Mi saldo/cupo, Mi historial, Mis notificaciones; inicio con resumen (saldo, últimas notificaciones, últimos movimientos).

### Backoffice socios
- **Existe**: listado, alta, edición, eliminación, detalle (members/[memberId]) con datos y pagos.
- **Falta:** secciones Membresía, Config operativa, Historial, Saldo/cupo, Notificaciones, Cuenta de acceso (crear cuenta, activar/desactivar, reset password).

### Dispensations, SalesOrder
- **Existen** y están vinculados a Member. Operaciones del socio ya registradas.

---

## Qué se REUTILIZA (sin duplicar)

- Modelo `Member` y `MemberAccount`, `MembershipPayment`, `Notification`, `AuditLog`.
- Actions: `createMember`, `updateMember`, `deleteMember` en `src/actions/members.ts`.
- Páginas: `members/page.tsx`, `members/[memberId]/page.tsx`, formularios en `features/members`.
- Portal: layout, login, profile, movements, tickets; `getMemberAndTenantFromSession`, auth "member".
- Permisos: members_read, members_create, members_update, members_delete.
- Estilo y patrones: ListPageLayout, DataTable, Card, formularios con zod, server actions.

## Qué se AGREGA o COMPLETA

- **Schema:** campos nuevos en Member (datos personales, membresía, config operativa, saldo); tabla opcional para ajustes de saldo auditados.
- **Actions:** notificaciones (listar, marcar leída, crear); cuenta socio (crear, activar/desactivar, reset); ajuste de saldo.
- **Backoffice:** formulario extendido; detalle con pestañas (Membresía, Config, Historial, Saldo, Notificaciones, Cuenta).
- **Portal:** páginas membresía, saldo, historial, notificaciones; inicio con resumen.
