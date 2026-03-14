# Auditoría funcional – Gestor Clubes vs definición funcional

## Tabla resumen por módulo

| Módulo | Estado | Evidencia encontrada | Faltantes | Riesgo |
|--------|--------|----------------------|-----------|--------|
| **Autenticación y control de acceso** | Parcial | Login unificado (email + password, resolución por email). NextAuth con providers platform/tenant/member. Cierre de sesión. Nav y páginas filtradas por permisos (app-shell, platform). Validación en Server Actions (requirePermission). | Recuperación de contraseña, 2FA, expiración de sesión configurable explícita. | Medio: sin recuperación de contraseña los usuarios pueden quedar bloqueados. |
| **Usuarios internos (tenant)** | Completo | ABM en `/app/[slug]/users`. Listado, alta, edición, baja (delete). Asignación de rol (Admin, Operador, Cultivador). Estado activo. Acciones: users.ts (create/update/delete) con requirePermission. Tablas: User, Role. | Último acceso mostrado en UI, “quién creó/modificó” en detalle. | Bajo. |
| **Roles y permisos** | Parcial | Roles por tenant (tenant_admin, operador, cultivador). Permisos en Permission/RolePermission. Seed y createTenant crean roles con permisos. Nav y páginas filtran por permission key. | No hay UI para editar permisos por rol (matriz); roles son fijos por seed/creación de tenant. | Medio: no se pueden personalizar permisos sin tocar código/seed. |
| **Gestión de socios** | Completo | ABM en `/app/[slug]/members`. Listado, alta, edición, eliminación. Filtros implícitos en listado. Export JSON/CSV. Acciones: members.ts. Tablas: Member. | Historial del socio en una sola vista, documentación asociada, observaciones como entidad rica. | Bajo. |
| **Portal del socio** | Parcial | Login socio, Inicio, Mi perfil, Mis movimientos (placeholder), Tickets. Rutas: profile, movements, tickets. Solo ve su propia información. | Cupo/saldo, comprobantes, notificaciones en UI, edición de datos personales, soporte/contacto. Movimientos reales no vinculados a socio. | Alto: sin cupo/saldo ni movimientos reales el portal queda limitado. |
| **Gestión de inventario** | Parcial | Pantalla inventario en `/app/[slug]/inventory`. Listado ítems con lote, cantidad, estado. DataTable + export. Tablas: InventoryItem, InventoryLot, Location. | Alta/edición de ítems desde UI, clasificación tipo/categoría, ajustes manuales con motivo, pantalla de movimientos que afectan stock. | Alto: no hay creación de ítems ni movimientos desde UI; stock no se actualiza por flujo operativo. |
| **Lotes y trazabilidad** | Parcial | Pantalla lotes en `/app/[slug]/lots`. ABM lotes (código, descripción, estado, ubicación). Tablas: InventoryLot, InventoryItem, Location. | Historial de eventos por lote, trazabilidad hacia adelante/atrás, ficha de lote con movimientos/pesajes/QR. | Medio: modelo permite trazabilidad pero no hay pantallas de historial ni navegación lote → movimientos. |
| **Movimientos de inventario** | Ausente | Modelo: InventoryMovement (in/out/transfer/adjust, itemId, quantity, etc.). Backend: no hay acciones ni API para crear/listar movimientos. | Toda la UI: creación, listado, filtros, impacto en stock. Tipos adicionales (pesaje, merma, asignación, retiro, etc.). | Alto: sin movimientos operativos no hay trazabilidad real ni actualización de stock. |
| **Integración QR** | Ausente | Permisos qr_generate, qr_resolve. InventoryItem tiene qrUuid. | Generación/registro de QR, lectura desde UI, resolución de entidad, acciones desde QR. | Alto: no hay flujo operativo con QR. |
| **Integración balanza** | Ausente | Modelo: Scale, Weighing. Permisos weighings_read/create, scales_manage. | Alta de balanzas, asociación a ubicación, lectura de peso, confirmación por operador, vinculación a ítem/lote/movimiento, historial de pesajes. | Alto: no hay pantallas ni flujos. |
| **Gestión operativa interna** | Parcial | Tickets en `/app/[slug]/tickets` (listado, creación, gestión). No hay “eventos operativos” ni “incidencias” como módulo aparte. | Registro de eventos operativos, incidencias con estado, checklist/tareas, filtros por responsable/fecha. | Medio: tickets cubren parte del soporte; falta operación de campo. |
| **Dispositivos** | Ausente | Modelo: Device (tenantId, locationId, name, type, status, etc.). Permisos devices_read, devices_manage. | Pantallas: listado, alta, edición, asociación a ubicación, estado online/offline. | Medio: modelo listo; sin UI no se usa. |
| **Telemetría** | Ausente | Modelo: Telemetry (deviceId, metricKey, metricValue, observedAt). | Recepción de mediciones, almacenamiento, UI por dispositivo/variable, filtros por fecha, dashboard de métricas. | Medio: modelo listo; sin API ni UI. |
| **Alertas** | Ausente | Modelo: Alert (tenantId, deviceId, type, severity, status, etc.). | Listado, creación manual/automática, clasificación por severidad, ciclo de vida (abierta/resuelta), asignación. | Medio: modelo listo; sin UI ni reglas automáticas. |
| **Historial del socio** | Parcial | Portal “Mis movimientos” existe pero muestra mensaje fijo “no hay movimientos vinculados”. No hay vínculo Member ↔ movimientos en el modelo (InventoryMovement sin memberId). | Modelo: referencia movimiento↔socio. UI: historial cronológico, detalle, vínculo con cupo/saldo. | Alto: imposible sin modelo de movimientos por socio. |
| **Cupos / saldo** | Ausente | No hay entidad ni campo de cupo/saldo por socio. | Modelo y UI de cupo/saldo, impacto por movimientos, reglas configurables, vista en backoffice y portal. | Alto: requisito central para muchos clubes. |
| **Auditoría** | Parcial | createAuditLog en varias acciones (tenants, users, members, branding, lots, locations, tickets). Platform: `/platform/audit` con filtro por tenant, listado, export. Tabla AuditLog. | Auditoría de login/logout, más acciones auditadas, filtros por usuario/entidad/acción en tenant. | Bajo en platform; en tenant no hay pantalla de auditoría. |
| **Reportes y exportación** | Parcial | Export JSON/CSV en listados (tenants, audit, members, locations, lots, tickets, inventory, portal tickets). No hay reportes predefinidos (socios activos, inventario actual, movimientos por período, etc.). | Módulo de reportes con filtros, totales, reportes por permiso. Export CSV/Excel formal. | Medio: solo export de listados; no reportes de negocio. |
| **Configuración general** | Parcial | Platform: tenants, branding por tenant (colores, logo, tema). No hay “configuración general” del tenant (parámetros, catálogos, tipos de movimiento, unidades). | Pantalla de configuración del tenant, estados/catálogos editables, unidades de medida, tipos de movimiento. | Medio: branding cubierto; resto de parámetros no. |

---

## Detecciones adicionales

### Pantallas sin backend (o backend mínimo)
- **Portal – Mis movimientos**: pantalla existe; no hay movimientos asociados al socio ni API que los devuelva.
- **Portal – Cupo/saldo**: no existe pantalla ni modelo.

### Backend sin UI (o UI mínima)
- **InventoryMovement**: modelo y relaciones; no hay acciones ni páginas para crear/listar movimientos.
- **Scale / Weighing**: modelos; no hay pantallas ni flujos.
- **Device / Telemetry / Alert**: modelos; no hay CRUD ni dashboards.
- **QR**: permisos y qrUuid en ítem; no hay generación ni resolución desde UI/API.
- **Notification**: modelo; no hay listado/lectura en portal ni en backoffice.

### Tablas no usadas (o uso muy limitado)
- **Notification**: no se crean ni listan desde la app.
- **QrScanLog**: no hay flujo que escriba/consulte.
- **Telemetry**: no hay ingreso ni consulta.
- **Alert**: no hay creación ni listado en tenant.
- **Weighing / Scale**: no hay uso en UI.

### Endpoints muertos
- No hay APIs REST públicas para QR, balanza, dispositivos o telemetría; solo NextAuth y error-log/health/test-db/env-check.

### Permisos no aplicados
- **audit_read** (tenant): no hay pantalla de auditoría en el tenant que lo use.
- **reports_read**: no hay módulo de reportes; el permiso no restringe nada específico.
- **qr_generate / qr_resolve**: sin flujo, el permiso no se usa en práctica.
- **weighings_*, scales_manage, devices_***: sin pantallas, solo ocultarían nav si se añadieran ítems.

### Inconsistencias
- **Stock vs movimientos**: el stock (quantityCurrent) existe en InventoryItem pero no hay flujo que lo actualice desde movimientos; sin módulo de movimientos no hay consistencia auditada.
- **Historial del socio vs saldo**: no hay vínculo socio ↔ movimientos ni concepto de cupo/saldo; historial y saldo no pueden ser consistentes.
- **Trazabilidad**: hay relaciones (Lote → Item → Movement, Weighing) pero la UI no explota historial ni navegación entre entidades.

### Auditoría faltante
- Login/logout no se registran en AuditLog.
- Varias lecturas/listados no se auditan (solo altas/bajas/modificaciones en algunas entidades).
- Cambios de permisos/roles: se auditan en platform users; en tenant no hay edición de matriz de permisos.

---

## Resumen de estado

- **Completo**: Usuarios internos (tenant), Gestión de socios (ABM).
- **Parcial**: Autenticación, Roles y permisos, Portal del socio, Inventario (solo listado), Lotes, Gestión operativa (tickets), Historial del socio (placeholder), Auditoría (platform), Reportes (solo export listados), Configuración (branding).
- **Ausente**: Movimientos de inventario (UI y flujo), QR, Balanza, Dispositivos (UI), Telemetría, Alertas (UI), Cupo/saldo.

Para acercarse al “desarrollado” por módulo hace falta, en cada uno: UI usable, backend/API, persistencia, reglas de negocio y permisos, e integración con el resto (p. ej. movimientos que actualicen stock y, si aplica, saldo/cupo del socio).
