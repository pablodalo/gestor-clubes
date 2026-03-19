# Auditoría técnica, funcional, visual y de arquitectura — cultiOS

**Fecha:** 2025-03  
**Alcance:** SaaS multi-tenant white-label, calidad enterprise y revendible.

---

# A. Resumen ejecutivo

| Métrica | Valor |
|--------|--------|
| **Completitud estimada** | ~25–30% |
| **Estado general** | MVP funcional con base sólida; falta la mayor parte de ABM, RBAC y pulido enterprise |
| **Madurez SaaS** | Baja–media: multi-tenant y auth correctos; sin permisos granulares ni módulos completos |
| **Madurez multi-tenant** | Alta: modelo claro, resolución por slug, filtrado por `tenantId` en lecturas |
| **Calidad visual** | Media: shells y login mejorados; tablas y formularios básicos, sin sistema de diseño de tablas |
| **Calidad enterprise** | Baja: sin RBAC aplicado, ABM mayormente listados, sin confirmaciones ni flujos completos |

**Principales riesgos**
- RBAC no aplicado: cualquier usuario tenant puede acceder a todo lo que el layout permita.
- ABM incompletos: solo platform (tenants, branding) tiene create/update; panel y portal sin CRUD real.
- Sin enforcement por permisos en server actions ni en UI.
- Tablas sin búsqueda, filtros ni paginación; sensación de producto incompleto.

---

# B. Matriz funcional por módulo

| Módulo | Existe | ABM completo | Multi-tenant correcto | Permisos correctos | UI conectada | Calidad visual | Estado final | Observaciones |
|--------|--------|--------------|------------------------|--------------------|--------------|-----------------|-------------|---------------|
| **Platform – Tenants** | Sí | Parcial | N/A (global) | Sí (solo platform) | Sí | Aceptable | Parcial | CREATE + READ list/detail; UPDATE existe en action pero sin formulario en detalle; DELETE no existe. |
| **Platform – Branding** | Sí | Parcial | N/A | Sí (solo platform) | Sí | Aceptable | Parcial | Solo UPDATE (form en página); CREATE implícito al crear tenant. |
| **Platform – Features por tenant** | Schema | No | Sí | No | No | — | No implementado | Modelo `TenantFeature` existe; sin pantallas ni acciones. |
| **Platform – Platform users** | Schema | No | N/A | No | No | — | No implementado | Solo link “Próximamente” en dashboard. |
| **Platform – Auditoría global** | Schema | No | N/A | No | No | — | No implementado | Solo link “Próximamente”. |
| **Tenant panel – Usuarios** | Schema | No | Sí | No | No | — | No implementado | Modelo User por tenant; sin listado ni ABM. |
| **Tenant panel – Roles** | Schema | No | Sí | No | No | — | No implementado | Seed crea roles; sin UI. |
| **Tenant panel – Permisos** | Config | No | N/A | No | No | — | No implementado | `config/permissions.ts` no usado en server ni UI. |
| **Tenant panel – Socios** | Sí | Solo READ | Sí | No | Sí | Básica | Defectuoso | Lista con `tenantId`; sin create/edit/delete, búsqueda, paginación. |
| **Tenant panel – Ubicaciones** | Sí | Solo READ | Sí | No | Sí | Básica | Defectuoso | Idem. |
| **Tenant panel – Lotes** | Sí | Solo READ | Sí | No | Sí | Básica | Defectuoso | Idem. |
| **Tenant panel – Inventario** | Sí | Solo READ | Sí | No | Sí | Básica | Defectuoso | Idem. |
| **Tenant panel – Movimientos** | Schema | No | Sí | No | No | — | No implementado | Sin listado ni ABM. |
| **Tenant panel – Balanzas/Pesajes/Dispositivos/Alertas** | Schema | No | Sí | No | No | — | No implementado | Solo modelo. |
| **Tenant panel – Tickets** | Schema | No | Sí | No | No | — | No implementado | Seed crea uno; sin listado ni ABM. |
| **Tenant panel – Branding** | N/A | — | — | — | — | — | — | Lo gestiona platform. |
| **Tenant panel – Reportes** | No | No | — | No | No | — | No implementado | — |
| **Tenant panel – Auditoría** | Schema | No | Sí | No | No | — | No implementado | `createAuditLog` usado en tenants/branding; sin vista. |
| **Portal socio – Perfil** | Sí | No | Sí (layout) | N/A | Sí | Básica | Placeholder | Solo título “Mi perfil”; sin datos del socio. |
| **Portal socio – Movimientos** | Sí | No | Sí | N/A | Sí | Básica | Placeholder | Solo título; sin datos. |
| **Portal socio – Tickets** | Sí | No | Sí | N/A | Sí | Básica | Placeholder | Solo título; sin datos. |
| **Portal socio – Notificaciones** | Schema | No | Sí | No | No | — | No implementado | Sin UI. |

---

# C. Matriz visual por módulo

| Módulo | Grilla profesional | Formulario profesional | Modal/Drawer/Página correcto | Branding consistente | UX general | Estado visual | Observaciones |
|--------|--------------------|------------------------|------------------------------|----------------------|------------|---------------|---------------|
| **Login único** | N/A | Sí | N/A (página) | N/A | Buena | OK | Card con isologo, gradiente, inputs claros. |
| **Platform – Tenants list** | No | — | N/A | N/A | Aceptable | Mejorable | Tabla HTML básica; sin DataTable, filtros, búsqueda, badges consistentes. |
| **Platform – Tenants new** | — | Aceptable | Página | N/A | Aceptable | OK | Card + form; sin validación en tiempo real. |
| **Platform – Tenants [slug]** | — | No (falta form edición) | Página | N/A | Aceptable | Incompleto | Detalle solo lectura; no hay modal/drawer para editar. |
| **Platform – Branding** | — | Aceptable | Página | N/A | Aceptable | OK | Form largo en card; inputs color/select; usable. |
| **Tenant panel – Members** | No | — | — | Sí (theme) | Básica | Mejorable | Tabla simple; sin acciones por fila, sin empty/loading premium. |
| **Tenant panel – Locations/Lots/Inventory** | No | — | — | Sí | Básica | Mejorable | Mismo patrón que members. |
| **Tenant panel – Dashboard** | N/A | — | N/A | Sí | Aceptable | Mejorable | Cards de enlaces; sin KPIs ni gráficos. |
| **Portal – Home/Profile/Movements/Tickets** | N/A | — | N/A | Sí | Básica | Placeholder | Solo títulos y texto; sin contenido real. |
| **Shells (platform / app / portal)** | N/A | — | N/A | Sí | Buena | OK | Header sticky, nav activo, marca; consistente. |

---

# D. Issues críticos

1. **RBAC no aplicado (server ni UI)**  
   - `src/config/permissions.ts` define permisos y roles pero **nunca se importa** en layouts, páginas ni server actions.  
   - Cualquier usuario con contexto `tenant` puede acceder a todas las rutas del panel del club (members, locations, lots, inventory) porque el layout solo comprueba `context === "tenant"` y `tenantSlug` coincidente.  
   - No hay comprobación de permisos antes de ejecutar acciones (no hay otras acciones tenant aún, pero cuando se agreguen quedarían sin proteger).

2. **Posible confusión de tenant en branding (mitigado)**  
   - `updateTenantBranding(tenantId, input)` recibe `tenantId` desde el cliente; la acción restringe a `context === "platform"`, por lo que solo superadmin puede llamarla. No hay fuga entre tenants; el riesgo es bajo pero el patrón “recibir id de recurso del cliente” sin re-validar que ese tenant sea accesible para el rol podría ser peligroso si en el futuro se permite editar branding desde otro contexto. Recomendación: en acciones platform que reciban `tenantId`, opcionalmente validar que el tenant exista (ya se hace implícitamente con upsert).

3. **Portal: datos del socio no filtrados por sesión**  
   - Las páginas de portal (profile, movements, tickets) no reciben ni usan el `memberId` / cuenta de la sesión; son placeholders. Cuando se implementen, **debe** usarse `session.userId` (que para member es el `MemberAccount.id`) y filtrar siempre por ese member/tenant para evitar ver datos de otros socios.

4. **APIs públicas de escritura**  
   - `/api/health` y `/api/test-db` escriben en `AuditLog` sin autenticación. Son endpoints de diagnóstico; en producción conviene protegerlos o limitarlos por IP/env para no dejar escritura abierta.

5. **Sin validación de tenant en parámetros de URL para datos**  
   - En panel tenant, el `tenantSlug` viene de la URL; el layout valida sesión y que `session.tenantSlug === params.tenantSlug` (o platform). Las páginas usan `getTenantBySlug(tenantSlug)` y consultas con `tenant.id`. No se encontraron queries que usen un `tenantId` llegado del cliente sin derivarlo del slug; **aislamiento por tenant en lecturas actuales: correcto**.

---

# E. Issues importantes

1. **ABM incompletos en panel del club**  
   - Socios, ubicaciones, lotes, inventario: solo listado (READ). Sin CREATE/UPDATE/DELETE, sin formularios ni modales/drawers.

2. **Platform: edición de tenant**  
   - Existe `updateTenant(tenantId, input)` en `src/actions/tenants.ts` pero la página `platform/tenants/[slug]/page.tsx` no tiene formulario para editar nombre, estado, timezone, etc. No hay forma de editar un tenant desde la UI.

3. **Platform: no hay DELETE tenant**  
   - No existe acción ni UI para dar de baja o eliminar un tenant.

4. **Dashboards sin datos reales**  
   - Platform y tenant dashboards son solo enlaces a secciones; no hay KPIs, gráficos ni resúmenes (recharts está en deps pero no se usa).

5. **Tablas sin estándar enterprise**  
   - Todas las tablas son `<table>` con clases Tailwind básicas; sin componente reutilizable, sin búsqueda, filtros, orden, paginación, loading skeleton ni empty state rico.

6. **Portal: perfil, movimientos y tickets sin implementar**  
   - Páginas con título y texto “próximamente”; no consumen sesión del socio ni datos de Member/Ticket/InventoryMovement.

7. **Formularios sin librería de validación en UI**  
   - Forms usan FormData y validación en server (Zod en actions); no hay react-hook-form + zod en formularios (aunque están en package.json), lo que limita feedback en tiempo real y consistencia.

8. **Branding: select nativo en lugar de componente UI**  
   - En `branding-form.tsx` se usa `<select>` y `<input type="checkbox">` en lugar de componentes shadcn (Select, Checkbox), lo que rompe consistencia con el resto del sistema.

---

# F. Issues menores

1. **Espaciado inconsistente**  
   - Algunas páginas usan `p-6` dentro del shell y otras dependen solo del padding del main; conviene unificar (p. ej. solo padding del main o solo del contenido).

2. **Tenants list: estado como texto en lugar de badge**  
   - Estado se muestra con `text-green-600` / `text-red-600`; sería más consistente un componente Badge reutilizable.

3. **Naming**  
   - `getTenantBySlug` existe en `lib/tenant.ts` y en `actions/tenants.ts` con comportamientos distintos (uno público para layout/pages, otro que solo devuelve si session es platform). Puede confundir; considerar renombrar el de actions a `getTenantBySlugForPlatform` o similar.

4. **Microcopy**  
   - “Socios (base)”, “Listado de socios (base)” en members; unificar tono y mensajes vacíos.

5. **Responsive en tablas**  
   - Tablas no tienen scroll horizontal ni variante móvil (cards); en pantallas chicas pueden quedar apretadas.

6. **Middleware**  
   - Solo hace `NextResponse.next()`; no agrega valor. Podría usarse para redirecciones tempranas o headers de seguridad, o dejarse mínimo como está.

---

# G. Score enterprise (1–10)

| Criterio | Puntuación | Comentario |
|----------|------------|------------|
| **Tenant model** | 8 | Modelo claro, slug, tenantId en entidades, resolución y layout correctos. |
| **Seguridad (aislamiento)** | 7 | Lecturas filtradas por tenant; acciones platform protegidas; APIs de diagnóstico abiertas. |
| **Auth** | 8 | Tres contextos, sesión y callbacks bien definidos; login único y redirección correcta. |
| **Permisos (RBAC)** | 2 | Modelo y config existen; sin enforcement en server ni UI. |
| **CRUD completeness** | 3 | Solo tenants (+ branding) con create/update; resto listados o no implementados. |
| **Data integrity** | 7 | Prisma + tenantId; auditoría en tenants/branding; sin transacciones explícitas en flujos complejos. |
| **Visual polish** | 5 | Login y shells bien; tablas y listados básicos. |
| **Table quality** | 3 | Tablas HTML simples; sin componente DataTable ni patrones enterprise. |
| **Form quality** | 5 | Forms útiles pero sin sistema unificado (validación cliente, componentes shadcn en todos). |
| **Dashboard quality** | 3 | Solo enlaces; sin KPIs ni gráficos. |
| **White-label quality** | 6 | Branding por tenant, ThemeProvider, CSS vars; aplicado en app y portal. |
| **Readiness for resale** | 4 | Base técnica sólida; falta completar ABM, RBAC y pulido para producto vendible. |

**Promedio ponderado (orientativo):** ~5,2/10.

---

# H. Plan de mejora

## Prioridad 1 — Crítico
1. Implementar **RBAC server-side**: helper que, dado `session` (tenant) + permission key, consulte RolePermission y devuelva si puede; usarlo en layout (ocultar nav) y en todas las server actions que modifiquen datos por tenant.
2. **Proteger APIs** `/api/health` y `/api/test-db` (solo en dev o con API key / IP).
3. Al implementar portal (perfil, movimientos, tickets): **filtrar siempre por `session.userId`** (member account id) y por tenant de sesión; nunca confiar en IDs del cliente.

## Prioridad 2 — Importante
4. **ABM panel tenant:** implementar al menos Socios y Ubicaciones completos (list + create/edit/delete con server actions y validación por tenantId de sesión).
5. **Platform:** formulario de edición de tenant en `platform/tenants/[slug]` (nombre, estado, timezone, etc.) usando `updateTenant`.
6. **Dashboard tenant:** al menos 2–3 KPIs reales (ej. cantidad de socios, ubicaciones, ítems) y un gráfico simple (recharts).
7. **Auditoría:** vista de lectura de AuditLog para platform (filtro por tenant opcional, paginación).

## Prioridad 3 — Visual / Polish
8. **Componente DataTable reutilizable:** headers, orden, búsqueda, paginación, empty/loading, badges, acciones por fila; usarlo en tenants, members, locations, lots, inventory.
9. **ABM con modales o drawers:** crear/editar socio y ubicación en modal/drawer con formulario completo y validación.
10. **Formularios:** react-hook-form + zod en cliente donde aplique; usar Select/Checkbox de shadcn en branding y en nuevos forms.
11. **Consistencia:** unificar padding de páginas, Badge para estados, y mensajes vacíos.
12. **Portal:** implementar perfil (lectura/edición de datos del socio desde sesión), listado de movimientos y tickets del socio.

---

# Referencia de archivos clave

| Área | Archivos |
|------|----------|
| Auth | `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts` |
| Tenant | `src/lib/tenant.ts`, `src/actions/tenants.ts` (getTenantsList, getTenantBySlug, createTenant, updateTenant) |
| Branding | `src/lib/branding.ts`, `src/actions/branding.ts`, `src/features/branding/branding-form.tsx` |
| Permisos | `src/config/permissions.ts` (no usado aún) |
| Layouts auth | `src/app/platform/*` (redirect si !platform), `src/app/app/[tenantSlug]/(dashboard)/layout.tsx`, `src/app/portal/socios/[tenantSlug]/(portal)/layout.tsx` |
| Listados tenant | `src/app/app/[tenantSlug]/(dashboard)/members/page.tsx`, `locations/page.tsx`, `lots/page.tsx`, `inventory/page.tsx` |
| Server audit | `src/server/audit.ts` |
