# Auditoría del sistema multi-tenant — Gestor Clubes

**Fecha:** 2025-03  
**Objetivo:** Validar si el tenant de gestión de clubes está funcionalmente completo y correctamente aislado por `tenant_id`.

---

## PASO 1–2 — Auditoría funcional y validación multi-tenant

### Resumen por área

| Módulo | Estado | UI | Backend | DB | Tenant isolation | Observaciones |
|--------|--------|-----|---------|-----|------------------|---------------|
| **CONFIGURACIÓN DEL CLUB** |
| Perfil institucional / datos del club | Parcial | — | — | Tenant (name, slug, timezone, locale, currency) | ✅ | Edición en platform/tenants/[slug]; no “perfil institucional” ampliado en panel. |
| Logo / branding | Completo | ✅ platform/tenants/[slug]/branding | ✅ actions/branding.ts | TenantBranding (tenantId) | ✅ | updateTenantBranding valida tenantId; solo platform. |
| Parámetros generales | Parcial | — | — | TenantFeature (tenantId) | ✅ | Modelo existe; sin UI ni acciones en panel. |
| **GESTIÓN INTERNA** |
| Usuarios internos | Completo | ✅ app/[slug]/users | ✅ actions/users.ts | User, Role (tenantId) | ✅ | getTenantContext en todas las acciones; roles con tenantId. |
| Roles | Completo | Implícito en usuarios | ensureTenantPanelRoles, seed, createTenant | Role, RolePermission (tenantId) | ✅ | Roles por tenant; permisos globales (Permission sin tenantId). |
| Permisos | Completo | — | RBAC por rol | Permission (global), RolePermission | ✅ | Asignación por rol por tenant. |
| Ubicaciones / sedes | Completo | ✅ app/[slug]/locations | ✅ actions/locations.ts | Location (tenantId) | ✅ | CRUD con getTenantContext; filtro por tenantId. |
| **GESTIÓN DE SOCIOS** |
| Alta de socio | Completo | ✅ members (form) | ✅ actions/members.ts | Member (tenantId) | ✅ | createMember con ctx.tenantId. |
| Edición | Completo | ✅ | updateMember | ✅ | findFirst con id + tenantId antes de update. |
| Suspensión / baja lógica | Completo | ✅ (status) | updateMember (status) | ✅ | Status active/suspended/inactive. |
| Historial del socio | Parcial | — | — | — | — | Sin tabla/UI de historial; AuditLog por entidad. |
| Búsqueda y filtros | Parcial | Listado con take 100 | findMany tenantId | ✅ | Sin filtros por estado/búsqueda en UI. |
| **PORTAL DEL SOCIO** |
| Login | Completo | ✅ portal/socios/[slug]/login | NextAuth + MemberAccount | MemberAccount | ✅ | Sesión por tenant + member. |
| Perfil | Completo | ✅ portal/socios/[slug]/profile | getMemberAndTenantFromSession | Member | ✅ | Solo datos del socio logueado. |
| Historial | Parcial | ✅ movements (placeholder) | — | — | — | Página existe; texto “no hay movimientos”; sin modelo de movimientos de socio. |
| Saldo/cupo | Ausente | — | — | — | — | Sin modelo ni UI de cupo/saldo del socio. |
| Notificaciones | Ausente | — | — | Notification (tenantId) | ✅ | Tabla existe; sin UI ni acciones. |
| **INVENTARIO** |
| Ítems inventariables | Parcial | ✅ inventory (listado) | — | InventoryItem (tenantId) | ✅ | Solo lectura en página; sin crear/editar ítems. |
| Stock actual | Parcial | ✅ (quantityCurrent) | — | ✅ | ✅ | Mostrado en inventario; sin ajustes desde UI. |
| Categorías | Ausente | — | — | — | — | Sin modelo de categorías. |
| Ubicaciones | Completo | ✅ locations | ✅ | Location | ✅ | CRUD completo. |
| Ajustes / movimientos | Ausente | — | — | InventoryMovement (tenantId) | ✅ | Tabla existe; sin acciones ni UI. |
| **LOTES Y TRAZABILIDAD** |
| Creación de lote | Completo | ✅ lots | ✅ actions/lots.ts | InventoryLot (tenantId) | ✅ | CRUD con assertTenantSession. |
| Estado / historial | Parcial | Estado en UI | — | — | — | Sin historial de eventos de lote. |
| Relación con inventario | Completo | ✅ (ítems por lote) | — | InventoryItem.lotId | ✅ | Listado inventario incluye lot. |
| **MOVIMIENTOS OPERATIVOS** |
| Ingreso / egreso / transferencia / ajuste / merma | Ausente | — | — | InventoryMovement (movementType) | ✅ | Modelo listo; sin acciones ni UI. |
| Usuario responsable | — | — | — | performedByUserId | ✅ | Campo en modelo. |
| **QR** |
| Generación / asociación | Ausente | — | — | InventoryItem.qrUuid | ✅ | Campo existe; sin acción generate. |
| Lectura / resolución | Ausente | — | — | QrScanLog (tenantId) | ✅ | Tabla log; sin endpoint resolve. |
| **BALANZAS** |
| Alta de balanza | Ausente | — | — | Scale (tenantId) | ✅ | Sin acciones ni UI. |
| Configuración / captura / pesaje / historial | Ausente | — | — | Weighing (tenantId) | ✅ | Tablas existen; sin UI ni acciones. |
| **DISPOSITIVOS** |
| Alta / tipo / ubicación / estado | Ausente | — | — | Device (tenantId) | ✅ | Sin acciones ni UI. |
| **TELEMETRÍA** |
| Recepción / almacenamiento / consulta | Ausente | — | — | Telemetry (tenantId, deviceId) | ✅ | Sin API ni UI. |
| **ALERTAS** |
| Creación / severidad / estado / resolución | Ausente | — | — | Alert (tenantId) | ✅ | Sin acciones ni UI. |
| **EVENTOS OPERATIVOS** |
| Incidencias / eventos / responsable | Parcial | — | — | AuditLog, Ticket | ✅ | Tickets como “eventos”; sin modelo genérico de incidencias. |
| **CUPOS / SALDO DEL SOCIO** |
| Cálculo / histórico / impacto | Ausente | — | — | — | — | Sin modelo de cupo/saldo. |
| **REPORTES** |
| Socios / inventario / movimientos / trazabilidad / auditoría | Parcial | — | — | — | — | Permiso reports.read; sin página Reportes ni export unificado. |
| **AUDITORÍA** |
| Registro de acciones / usuario / entidad / fecha / cambios | Completo | ✅ platform/audit | createAuditLog en acciones | AuditLog (tenantId nullable) | ✅ | Platform filtra por tenantId; acciones llaman createAuditLog. |
| **NOTIFICACIONES** |
| Internas / al socio / historial | Ausente | — | — | Notification (tenantId) | ✅ | Sin UI ni acciones. |

---

## PASO 3 — Resultado de auditoría detallado

### Endpoints / rutas

- **API routes:** `/api/auth`, `/api/health`, `/api/test-db`, `/api/env-check`, `/api/error-log`. Ninguno expone datos por tenant sin sesión; error-log y audit son platform.
- **Server Actions:** Todas las que modifican datos de tenant usan `getTenantContext()` o `assertTenantSession()` y filtran por `ctx.tenantId`. No hay acciones “huérfanas” sin validación de tenant.

### Tablas no utilizadas desde UI/acciones

- **Scale:** sin acciones ni páginas.
- **Weighing:** sin acciones ni páginas.
- **Device:** sin acciones ni páginas.
- **Telemetry:** sin acciones ni páginas.
- **Alert:** sin acciones ni páginas.
- **Notification:** sin acciones ni páginas.
- **InventoryMovement:** sin acciones ni páginas.
- **QrScanLog:** sin uso desde app (solo modelo).
- **TenantFeature:** sin uso en panel.

### Pantallas sin backend completo

- **Inventario:** solo listado; no hay alta/edición de ítems ni movimientos.
- **Portal movimientos:** placeholder sin datos (no hay modelo “movimientos del socio”).
- **Reportes:** no existe página; permiso `reports.read` sin uso.

### Backend sin UI

- Ningún action de tenant está sin página asociada para su flujo principal (usuarios, socios, ubicaciones, lotes, tickets, branding tienen UI). Los modelos Scale, Weighing, Device, Alert, Telemetry, Notification, InventoryMovement no tienen acciones ni UI.

### Aislamiento tenant

- **Queries:** En `src/actions` (members, users, locations, lots, tickets) todas las lecturas/escrituras de datos de negocio usan `tenantId` de sesión (getTenantContext/assertTenantSession). update/delete se hacen tras un findFirst con `id + tenantId`.
- **Páginas:** Las páginas bajo `app/[tenantSlug]` obtienen tenant por slug y pasan `tenant.id` a prisma (where: { tenantId: tenant.id }).
- **Branding:** Solo platform; `validateTenantIdExists(tenantId)` antes de upsert.
- **Resolve-login:** `user.findFirst` por email (sin tenantId) es intencional para decidir contexto; luego la sesión lleva el tenantId correcto.
- **Riesgo bajo:** No se detectaron reportes globales ni joins entre tenants. AuditLog en platform filtra por tenantId en UI.

### Resumen de estado por módulo

- **Completos:** Branding, usuarios internos, roles/permisos, ubicaciones, socios (CRUD), portal login/perfil, lotes, tickets, auditoría (platform), dashboard tenant.
- **Parciales:** Configuración (sin “perfil institucional” en panel), parámetros (TenantFeature sin UI), historial socio (solo placeholder), inventario (solo lectura), movimientos (modelo sin UI), reportes (permiso sin página), eventos (tickets).
- **Ausentes (modelo existe, sin UI/acciones):** Movimientos de inventario, QR generate/resolve, balanzas/pesajes, dispositivos, telemetría, alertas, notificaciones.
- **Ausentes (sin modelo):** Categorías de inventario, cupo/saldo del socio, historial estructurado del socio.

---

## PASO 4 — Implementación automática (módulos críticos)

Se implementan los siguientes módulos respetando la arquitectura existente:

1. **Reportes (tenant):** Página `/app/[tenantSlug]/reports` con permiso `reports.read`, enlaces a exportaciones y auditoría del tenant.
2. **Dispositivos (tenant):** CRUD en `/app/[tenantSlug]/devices` con acciones que usan `assertTenantSession` y filtro por `tenantId`.
3. **Inventario — alta/edición de ítems:** Acciones para crear/actualizar ítems de inventario asociados a lote y tenant, con permisos existentes.

El resto de módulos (balanzas, pesajes, telemetría, alertas, notificaciones, movimientos de inventario, QR, cupo socio) quedan documentados para una siguiente fase.

---

## PASO 5 — Validación final

- Tras las implementaciones:
  - Reportes y Dispositivos tendrán todas las queries filtradas por `tenantId` desde sesión.
  - Nuevas acciones usarán `assertTenantSession` y permisos existentes.
  - Auditoría: se llamará a `createAuditLog` en create/update/delete de dispositivos e ítems de inventario.
- No se cambia la arquitectura: mismo patrón de Server Actions + páginas server component + getTenantBySlug en layout/pages.

---

## PASO 6 — Resultado final

### Lista de módulos implementados en esta fase

- **Reportes (tenant):** Página `/app/[tenantSlug]/reports` con permiso `reports.read`; tarjetas de acceso a Socios, Inventario, Lotes y Tickets (cada uno con export en su sección). Enlace a auditoría en Platform.
- **Dispositivos (tenant):** CRUD completo en `/app/[tenantSlug]/devices`: listado, alta, edición y baja con `assertTenantSession`, filtro por `tenantId`, permisos `devices.read` y `devices.manage`, auditoría en create/update/delete. Nav actualizado en `AppShell`.
- **Inventario — ítems:** Acciones `createInventoryItem` y `updateInventoryItem` en `src/actions/inventory.ts` con permisos `inventory.create` e `inventory.adjust`, validación de lote y ubicación del tenant, y auditoría. La UI de inventario actual sigue en solo lectura; se puede agregar botón «Nuevo ítem» y formulario que consuman estas acciones.

### Mejoras realizadas

- Documento único de auditoría (este archivo).
- Nuevas rutas y acciones con aislamiento por tenant y permisos.
- Nav del panel del club: enlaces a Reportes y Dispositivos.

### Migraciones

- No se agregan nuevas tablas; se usan las existentes (Device, InventoryItem, etc.).

### Nuevos archivos / rutas

- `src/app/app/[tenantSlug]/(dashboard)/reports/page.tsx` — página Reportes.
- `src/app/app/[tenantSlug]/(dashboard)/devices/page.tsx` — página Dispositivos.
- `src/actions/devices.ts` — create, update, delete dispositivo.
- `src/actions/inventory.ts` — create, update ítem de inventario.
- `src/features/devices/devices-table.tsx` — tabla y menú de acciones.
- `src/features/devices/device-form.tsx` — formulario alta/edición dispositivo.
- `src/components/app-shell.tsx` — actualizado con links a Reportes y Dispositivos.

### Riesgos detectados

- **Inventario:** Hoy no hay UI para crear ítems; los ítems pueden venir de seed o de integraciones. Alta desde UI puede requerir flujo de “crear ítem en lote” con validación de lote del tenant.
- **Cupo/saldo socio:** Sin modelo, cualquier implementación futura requerirá migración y definición de reglas de negocio.

### Validación final (PASO 5)

- **Queries:** Todas las nuevas acciones (devices, inventory) usan `assertTenantSession()` y filtran por `ctx.tenantId`. Las páginas usan `getTenantBySlug` y `where: { tenantId: tenant.id }`.
- **Permisos:** Reportes usa `reports.read`; Dispositivos usa `devices.read` y `devices.manage`; Inventario usa `inventory.create` e `inventory.adjust`.
- **Auditoría:** create/update/delete en devices e inventory llaman a `createAuditLog` con tenantId, actorType "user", entityName y entityId.
- **Arquitectura:** Sin cambios; mismo patrón Server Actions + páginas server component + componentes cliente para tablas/formularios.

### Estado final del tenant

- **PARCIAL — REQUIERE MEJORAS**
- **Funcional:** Configuración (branding), usuarios, roles, ubicaciones, socios (CRUD), lotes (CRUD), inventario (consulta + acciones create/update ítem), **dispositivos (CRUD)**, tickets, **reportes (página de acceso)**, auditoría (platform), portal (login, perfil, movimientos placeholder).
- **Pendiente:** UI para alta/edición de ítems de inventario (acciones ya listas), movimientos de inventario (ingreso/egreso/transferencia/ajuste), balanzas y pesajes, telemetría, alertas, notificaciones, QR (generar/resolver), cupo/saldo socio, categorías de inventario.
