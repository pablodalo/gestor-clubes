# Validación final del tenant de gestión de clubes

**Fecha:** 2025-03  
**Alcance:** Auditoría real de funcionamiento, completitud, consistencia, cobertura funcional y usabilidad por rol.

---

# RESUMEN GENERAL

- **Estado general del tenant:** PARCIAL
- **Riesgo general:** BAJO (aislamiento multi-tenant correcto; funcionalidades ausentes no generan fuga de datos)

El tenant permite operar de forma autónoma en: configuración (vía platform), usuarios internos, socios, ubicaciones, lotes, inventario (consulta + acciones backend para ítems), dispositivos, tickets y reportes. Faltan módulos operativos avanzados (movimientos de inventario con UI, QR, balanzas/pesajes, telemetría, alertas, notificaciones, cupo/saldo socio) y configuración del club desde el panel del tenant.

---

# TABLA DE MÓDULOS

| Módulo | Estado | UI | Backend | DB | Permisos | Tenant isolation | Observaciones |
|--------|--------|-----|---------|-----|----------|------------------|---------------|
| Configuración del club | PARCIAL | Platform branding | actions/branding | TenantBranding | Platform | ✅ | Solo desde platform/tenants/[slug]/branding; no "perfil institucional" en panel tenant. |
| Perfil institucional | PARCIAL | — | — | Tenant | — | ✅ | Datos en Tenant; edición solo en platform. |
| Branding / logo | Completo | Platform | branding.ts | TenantBranding | Platform | ✅ | Persiste; impacta login/portal. |
| Parámetros generales | AUSENTE | — | — | TenantFeature | — | ✅ | Modelo existe; sin UI ni uso. |
| Usuarios internos | Completo | ✅ users | users.ts | User, Role | users.* | ✅ | ABM; roles; permisos por rol; tenantId en todo. |
| Roles y permisos | Completo | Implícito en usuarios | RBAC, seed | Role, RolePermission | — | ✅ | Validación en backend y ocultamiento en nav por permiso. |
| Ubicaciones | Completo | ✅ locations | locations.ts | Location | inventory.read (create) | ✅ | ABM; filtro tenantId. |
| Gestión de socios | Completo | ✅ members | members.ts | Member | members.* | ✅ | Alta, edición, suspensión; búsqueda take 100 sin filtros UI. |
| Portal del socio | PARCIAL | ✅ login, profile, movements | NextAuth, portal-session | MemberAccount, Member | — | ✅ | Login y perfil OK; movimientos es placeholder sin datos; sin saldo/cupo ni notificaciones. |
| Inventario | Completo | ✅ listado + Nuevo ítem + Editar | inventory.ts | InventoryItem | inventory.* | ✅ | Listado, export, alta y edición de ítems con selector de lote y ubicación. |
| Lotes | Completo | ✅ lots | lots.ts | InventoryLot | lots.* | ✅ | CRUD; relación con ítems; tenantId. |
| Trazabilidad | PARCIAL | — | — | — | — | — | Sin historial de eventos de lote ni UI de trazabilidad. |
| Movimientos operativos | AUSENTE | — | — | InventoryMovement | — | ✅ | Tabla existe; sin acciones ni UI (ingreso/egreso/transferencia/ajuste). |
| QR | AUSENTE | — | — | qrUuid, QrScanLog | qr.* | ✅ | Sin generación, lectura ni resolución. |
| Balanzas | AUSENTE | — | — | Scale | scales.manage | ✅ | Sin UI ni acciones. |
| Pesajes | AUSENTE | — | — | Weighing | weighings.* | ✅ | Sin UI ni acciones. |
| Dispositivos | Completo | ✅ devices | devices.ts | Device | devices.* | ✅ | CRUD; auditoría; tenantId. |
| Telemetría | AUSENTE | — | — | Telemetry | — | ✅ | Sin API ni UI. |
| Alertas | AUSENTE | — | — | Alert | — | ✅ | Sin UI ni acciones. |
| Eventos operativos / incidencias | PARCIAL | Tickets | tickets.ts | Ticket | tickets.* | ✅ | Tickets como incidencias; sin modelo genérico de eventos. |
| Cupos / saldo del socio | AUSENTE | — | — | — | — | — | Sin modelo ni UI. |
| Reportes | PARCIAL | ✅ reports | — | — | reports.read | ✅ | Página con enlaces a Socios, Inventario, Lotes, Tickets; no reportes agregados. |
| Auditoría | Completo | Platform audit | createAuditLog | AuditLog | audit (platform) | ✅ | Acciones críticas auditadas; vista en platform. |
| Notificaciones | AUSENTE | — | — | Notification | — | ✅ | Sin UI ni acciones. |
| Menú / header por rol | Completo | ✅ app-shell | — | — | Por permiso | ✅ | Nav agrupada (Operaciones, Monitoreo, Gestión del club, Control); ítems ocultos por permiso; Cultivador no ve Gestión (Usuarios, Socios) ni Tickets. |
| Layout navegación (horizontal/vertical) | Completo | Branding form + AppShell | branding.ts, actions/branding | TenantBranding.navigationLayout | Platform (branding) | ✅ | Configuración por tenant en Platform > Tenants > [slug] > Branding; persistente; aplicada en dashboard (header vs sidebar + drawer móvil). |

---

# VALIDACIÓN DE NAVEGACIÓN / HEADER

## Estructura actual encontrada

- **Antes:** Lista plana de enlaces (Dashboard, Usuarios, Socios, Ubicaciones, Lotes, Inventario, Dispositivos, Tickets, Reportes) filtrada por permiso. Todos los roles con los mismos permisos veían el mismo menú plano.
- **Problemas detectados:** Sin agrupación operativa vs administrativa; Cultivador veía las mismas etiquetas que Admin (aunque sin Usuarios, Socios, Tickets por falta de permiso); menú poco escalable y sin diferenciación clara por rol.

## Mejoras aplicadas

- **Navegación agrupada** en `src/components/app-shell.tsx`:
  - **Dashboard** (siempre visible).
  - **Operaciones:** Ubicaciones, Lotes, Inventario (permiso inventory.read, lots.read).
  - **Monitoreo:** Dispositivos (devices.read).
  - **Gestión del club:** Usuarios, Socios (users.read, members.read).
  - **Control:** Tickets, Reportes (tickets.read, reports.read).
- Cada ítem se muestra solo si el usuario tiene el permiso correspondiente. Los grupos sin ítems visibles no se renderizan.
- Grupos con un solo ítem visible se muestran como link directo; grupos con varios ítems como dropdown (Operaciones, Gestión del club, Control).

## Estructura final del menú para Admin Club

- Dashboard  
- Operaciones ▼ → Ubicaciones, Lotes, Inventario  
- Monitoreo → Dispositivos  
- Gestión del club ▼ → Usuarios, Socios  
- Control ▼ → Tickets, Reportes  

## Estructura final del menú para Cultivador

- Dashboard  
- Operaciones ▼ → Ubicaciones, Lotes, Inventario  
- Monitoreo → Dispositivos  
- Control → Reportes  

(No ve Gestión del club ni Tickets por falta de users.read, members.read y tickets.read.)

## Validación de render por rol

- **tenant_admin:** Tiene todos los permisos; ve todos los grupos e ítems.
- **operador:** Tiene members.*, inventory.*, lots.*, devices.*, tickets.*, reports.read; ve Operaciones, Monitoreo, Gestión del club (Usuarios, Socios), Control (Tickets, Reportes).
- **cultivador:** Tiene lots.*, inventory.read, devices.read, reports.read (sin members, users, tickets); ve Operaciones, Monitoreo, Control (solo Reportes). Correcto.

---

# PROBLEMAS DETECTADOS

1. **Inventario:** Corregido: se añadió UI para crear y editar ítems (Nuevo ítem, Editar por fila) usando las acciones existentes.
2. **Portal del socio:** Movimientos es placeholder; no hay modelo de "movimientos del socio" ni saldo/cupo; no hay notificaciones.
3. **Configuración del club:** No hay pantalla en el panel del tenant para editar datos del club (nombre, etc.); solo branding desde platform.
4. **Ubicaciones:** Se usa el permiso `inventory.read`/`inventory.create` para crear ubicaciones; no hay permiso específico "locations".
5. **Reportes:** Solo enlaces a listados con export; no hay reportes agregados ni filtros por fecha.
6. **Menú:** Estaba plano y sin agrupación; corregido con grupos y dropdowns.
7. **Trazabilidad, movimientos, QR, balanzas, pesajes, telemetría, alertas, notificaciones, cupo:** Ausentes o solo con modelo en DB.

---

# CORRECCIONES REALIZADAS

| Archivo / ámbito | Qué se corrigió |
|------------------|------------------|
| `src/components/app-shell.tsx` | Navegación por grupos y por permiso. **Layout horizontal/vertical:** recibe `navigationLayout`; en desktop horizontal muestra header con nav; en desktop vertical muestra sidebar fijo con nav y pie (ThemeToggle + Salir). **Mobile:** header compacto + drawer (Dialog) desde la izquierda con la misma nav; `showClose={false}` y botón X propio; animación slide-out al cerrar. |
| `src/features/inventory/inventory-table.tsx` | Nuevo: tabla de inventario con botón «Nuevo ítem» y acción «Editar» por fila cuando el usuario tiene inventory.create / inventory_adjust. |
| `src/features/inventory/inventory-item-form.tsx` | Nuevo: formulario de alta y edición de ítem (lote, código, tipo, unidad, cantidad, ubicación, estado). Conectado a createInventoryItem y updateInventoryItem. |
| `src/app/.../inventory/page.tsx` | Usa InventoryTable; carga lots y locations para el formulario; pasa canCreate y canAdjust según permisos. |
| `prisma/schema.prisma` | Campo `navigationLayout` (String?, default "horizontal") en modelo TenantBranding. |
| `prisma/migrations/.../migration.sql` | Migración que agrega columna `navigationLayout` a TenantBranding. |
| `src/lib/branding.ts` | Tipo TenantBrandingData y getTenantBranding incluyen navigationLayout; default "horizontal". |
| `src/actions/branding.ts` | updateTenantBranding acepta y persiste navigationLayout. |
| `src/features/branding/branding-form.tsx` | Selector "Layout de navegación" (Menú horizontal / Menú vertical); envía navigationLayout en el submit. |
| `src/app/app/[tenantSlug]/(dashboard)/layout.tsx` | Obtiene branding y pasa navigationLayout a AppShell. |

No se modificaron otros archivos más allá de los listados; el resto de hallazgos son módulos ausentes o parciales documentados.

---

# VALIDACIÓN MULTI-TENANT

- **Entidades con tenant_id:** Todas las tablas de negocio (User, Member, Location, InventoryLot, InventoryItem, InventoryMovement, Scale, Weighing, Device, Telemetry, Alert, Ticket, Notification, AuditLog con tenantId nullable para platform, QrScanLog) tienen tenantId o son globales por diseño (Tenant, PlatformUser, Permission).
- **Queries:** En `src/actions` (members, users, locations, lots, tickets, devices, inventory) todas las operaciones usan `getTenantContext()` o `assertTenantSession()` y filtran por `ctx.tenantId`. Las páginas usan `getTenantBySlug(tenantSlug)` y `where: { tenantId: tenant.id }`.
- **Endpoints / Server Actions:** Ninguno acepta tenantId desde el cliente sin validar; el tenant viene de sesión. Branding (platform) usa `validateTenantIdExists(tenantId)`.
- **Joins:** No se detectaron joins que mezclen tenants. Prisma usa relaciones por FK; tenantId está en las entidades.
- **Reportes:** La página de reportes del tenant solo enlaza a rutas bajo `/app/[tenantSlug]/...`; no hay reportes globales sin filtro.
- **Portal del socio:** Sesión por tenant + member; getMemberAndTenantFromSession valida tenantSlug.
- **Conclusión:** No hay riesgo cross-tenant; no se detectaron queries sin tenant, joins inseguros ni endpoints que devuelvan datos de otro tenant.

---

# CONSISTENCIA FUNCIONAL

- **Stock vs movimientos:** No validado de punta a punta: no hay UI de movimientos; el stock actual (quantityCurrent) es un campo en InventoryItem que no se actualiza por movimientos (InventoryMovement existe pero sin uso). Si en el futuro se implementan movimientos, habría que mantener consistencia (sumatoria de movimientos = stock o política explícita).
- **Saldo vs historial del socio:** No aplica; no existe modelo de saldo/cupo ni historial de movimientos del socio.
- **Auditoría vs acciones críticas:** createAuditLog se llama en create/update/delete de members, users, locations, lots, tickets, devices e inventory (ítems). Acciones críticas del tenant quedan auditadas.
- **Reportes vs datos fuente:** La página Reportes enlaza a las mismas listas que Socios, Inventario, Lotes y Tickets; no hay agregados que puedan desincronizarse.
- **Lotes vs inventario:** Los ítems tienen lotId; el listado de inventario incluye `lot`; consistencia por FK.

---

# ESCENARIOS DE USO

| Escenario | Resultado | Explicación |
|-----------|-----------|-------------|
| **1. Admin: configurar club, crear usuario, ubicación, alta socio, listar socios** | SOPORTADO PARCIALMENTE | Configuración/branding desde platform, no desde panel. Crear usuario, ubicación y socio y listar socios está soportado de punta a punta. |
| **2. Cultivador: crear lote, ítem, movimiento, trazabilidad, QR** | SOPORTADO PARCIALMENTE | Crear lote: sí. Crear ítem: sí (UI con permiso inventory.create). Movimientos y trazabilidad: no. QR: no. |
| **3. Socio: login, perfil, historial, saldo, notificación** | SOPORTADO PARCIALMENTE | Login y perfil: sí. Historial y saldo: no (placeholder o ausente). Notificaciones: no. |
| **4. Admin: registrar balanza, pesaje, historial pesajes, vínculo movimiento** | NO SOPORTADO | Sin UI ni acciones para balanzas ni pesajes. |
| **5. Operador: incidencia/evento, estado, alertas, resolver alerta** | SOPORTADO PARCIALMENTE | Tickets como incidencias: crear y cambiar estado sí. Alertas: modelo existe, sin UI. |
| **6. Auditor/admin: reportes, auditoría, sin datos de otros tenants** | SOPORTADO | Reportes (enlaces) y auditoría en platform filtrable por tenant; aislamiento correcto. |
| **7. Admin vs Cultivador en navegación** | SOPORTADO | Menú construido por permisos; Cultivador no ve Gestión del club ni Tickets; Admin ve todo. |
| **8. Cambio de layout horizontal/vertical** | SOPORTADO | Configuración en Platform > Tenants > [slug] > Branding: campo "Layout de navegación" (horizontal/vertical). Persiste en TenantBranding.navigationLayout; el layout del dashboard aplica el valor (AppShell). |
| **9. Uso desde celular (admin)** | SOPORTADO | Header compacto con menú hamburguesa; drawer desde la izquierda con la misma navegación por permisos; rutas y formularios accesibles. |
| **10. Portal del socio en mobile** | SOPORTADO PARCIALMENTE | Login, perfil y navegación funcionan; falta revisión fina de overflow y touch en todas las pantallas del portal. |

---

# VALIDACIÓN DE LAYOUT HORIZONTAL / VERTICAL

## Existencia y ubicación

- **Sí existe** configuración por tenant.
- **Dónde se configura:** Platform > Tenants > [slug] > Branding. En el formulario de branding hay un selector "Layout de navegación" con opciones "Menú horizontal" y "Menú vertical".
- **Persistencia:** Campo `navigationLayout` en tabla `TenantBranding` (valor `"horizontal"` | `"vertical"`, por defecto `"horizontal"`). La acción `updateTenantBranding` guarda el valor; `getTenantBranding` lo devuelve; el layout del dashboard (`(dashboard)/layout.tsx`) obtiene el branding y pasa `navigationLayout` a `AppShell`.

## Comportamiento real del layout

- **Horizontal:** En desktop se muestra la barra superior (header) con logo, navegación en línea y dropdowns por grupo, ThemeToggle y Salir. En móvil, header compacto con botón menú que abre el drawer.
- **Vertical:** En desktop se muestra un sidebar fijo a la izquierda (56rem) con grupos e ítems, y en el pie del sidebar ThemeToggle y Salir. El contenido principal tiene `md:pl-56`. En móvil, el mismo header compacto y drawer que en horizontal.
- **Permisos y rol:** En ambos modos la navegación se construye con los mismos grupos e ítems filtrados por permiso; Admin ve Gestión del club y Control; Cultivador no ve Usuarios, Socios ni Tickets.

## Problemas detectados y mejoras aplicadas

- **Sidebar vertical en desktop:** Se quitó `md:pt-14` del sidebar para que no quedara hueco superior; el sidebar va de arriba a abajo. Se añadió en el pie del sidebar la barra con ThemeToggle y Salir para que en modo vertical el usuario pueda cambiar tema y cerrar sesión sin depender de un header superior.
- **Drawer móvil:** Se usó `showClose={false}` en el `DialogContent` del drawer para evitar doble botón de cierre; el cierre se hace con el botón X del encabezado del drawer. Se añadió `data-[state=closed]:slide-out-to-left` para animación de cierre coherente.

## Validación final

- Configuración guardada por tenant: **Sí** (TenantBranding.navigationLayout).
- Selector en Branding: **Sí** (Menú horizontal / Menú vertical).
- Al cambiar y guardar, el layout efectivamente cambia al recargar o navegar: **Sí** (layout lee branding en servidor).
- Menú usable en ambos modos y por rol: **Sí**.

---

# VALIDACIÓN RESPONSIVE / MOBILE

## Pantallas revisadas

- **App shell:** Header móvil con menú hamburguesa; drawer de ancho 72 (max-w-[85vw]); en desktop horizontal: barra con nav; en desktop vertical: sidebar fijo.
- **Dashboard, Socios, Ubicaciones, Lotes, Inventario, Dispositivos, Tickets, Reportes, Usuarios:** Contenedor con `container max-w-6xl mx-auto px-4`; tablas y formularios dentro de cards o contenedores que se adaptan al ancho.
- **Portal del socio:** Layout con branding; páginas de perfil, movimientos y tickets con estructura responsive básica.
- **Login (tenant y portal):** Formularios centrados y apilados.

## Problemas detectados

- Menú en móvil: antes no había drawer; **corregido** con Dialog como drawer desde la izquierda, mismo contenido de navegación que en desktop.
- Sidebar vertical en desktop: falta de barra Salir/Tema; **corregido** con pie de sidebar con ThemeToggle y Salir.
- Posible overflow en tablas muy anchas en pantallas chicas: las tablas usan contenedores con scroll horizontal donde aplica (p. ej. overflow-x-auto en tablas); no se detectaron roturas graves en las pantallas críticas.

## Correcciones aplicadas

- **AppShell:** En móvil siempre se muestra header compacto + drawer; en desktop según `navigationLayout` se muestra header horizontal o sidebar vertical. Sidebar vertical con pie fijo (Tema + Salir). Drawer con cierre explícito y animación de salida.

## Estado final

- **Mobile:** Navegación operable mediante drawer; contenido principal con padding y ancho controlado; formularios y listados usables.
- **Tablet:** Misma lógica que desktop (breakpoint `md`); menú horizontal o vertical según configuración del tenant.
- **Desktop:** Layout horizontal o vertical según `navigationLayout`; sin huecos ni elementos duplicados.

---

# FALTANTES FINALES

- ~~UI para alta/edición de ítems de inventario~~ (implementado: Nuevo ítem + Editar en inventario).
- Movimientos de inventario (ingreso, egreso, transferencia, ajuste) con UI y consistencia con stock.
- Trazabilidad (historial de eventos por lote/ítem).
- QR: generación, lectura, resolución.
- Balanzas y pesajes: alta, captura, confirmación, historial.
- Telemetría, alertas, notificaciones (modelos en DB; sin flujos).
- Cupo/saldo del socio y historial de movimientos del socio.
- Configuración del club (datos institucionales) desde el panel del tenant.
- Parámetros generales (TenantFeature) si se desea usar.
- Reportes agregados con filtros por fecha.

---

# ELEMENTOS MUERTOS O INCONSISTENTES

- **Tablas sin uso desde UI/acciones:** Scale, Weighing, Telemetry, Alert, Notification, InventoryMovement, QrScanLog, TenantFeature.
- **Pantallas sin datos reales:** Portal movimientos (placeholder).
- **Código duplicado:** Patrón getTenantContext en varias acciones (members, locations, users); assertTenantSession en otras (lots, tickets, devices, inventory). Consistente con dos estilos; no crítico.

---

# VEREDICTO FINAL

**TENANT LISTO CON OBSERVACIONES**

- El tenant es utilizable para: administración de usuarios, socios, ubicaciones, lotes, inventario (consulta, alta/edición de ítems y export), dispositivos, tickets y reportes (acceso a listados). La navegación diferencia correctamente Admin vs Cultivador por permisos y está agrupada por función.
- **Layout de navegación:** Cada tenant puede elegir menú horizontal o vertical desde Platform > Branding; la preferencia persiste y se aplica en el dashboard (sidebar en desktop para vertical; drawer en móvil en ambos casos).
- **Responsive/mobile:** Menú móvil con drawer; contenido con contenedores adaptativos; sidebar/header según layout y breakpoint.
- Aislamiento multi-tenant y permisos están correctamente aplicados.
- Para uso operativo completo faltan: movimientos de inventario, QR, balanzas/pesajes, telemetría, alertas, notificaciones, cupo/saldo socio. Estos faltantes están documentados y no comprometen la seguridad ni el aislamiento del tenant.

**Nota de despliegue:** Si la base de datos no tiene aún la columna `navigationLayout` en `TenantBranding`, ejecutar `npx prisma migrate deploy` (o `prisma db push`) y `npx prisma generate`.
