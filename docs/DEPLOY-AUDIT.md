# Auditoría deploy / producción (Vercel)

**Fecha:** 2025-03  
**Contexto:** Build y deploy en Vercel terminan correctamente; se audita runtime, configuración y calidad para detectar problemas reales y endurecer el proyecto.

---

## A. Diagnóstico

### ¿Hubo error real de build?

**No.** El build compila, las páginas estáticas se generan y el deployment se completa. Los avisos del log no indican fallo de compilación ni de publicación.

### Problemas reales detectados (o riesgo)

| Área | Hallazgo | Severidad |
|------|----------|-----------|
| **Prisma en serverless** | En producción no se reutilizaba la misma instancia de `PrismaClient` (solo se guardaba en `global` en dev). En Vercel cada invocación podría crear conexiones nuevas y llevar a "too many connections". | **Alta** – Corregido con singleton global también en producción. |
| **Env en producción** | Si en Vercel faltan `NEXTAUTH_URL` o `NEXTAUTH_SECRET`, el auth falla con errores poco claros. | **Media** – Corregido con validación explícita en `/api/auth` que lanza mensaje claro. |
| **Node** | `engines.node: ">=18"` permite versiones mayores automáticas y posibles incompatibilidades. | **Baja** – Corregido fijando `20.x`. |
| **TypeScript / ESLint** | `ignoreBuildErrors: true` y `ignoreDuringBuilds: true` evitan que errores de tipos o lint fallen el build; no hay “gate” de calidad en el pipeline. | **Baja** – Documentado; scripts `typecheck` y `lint` listos para ejecutar en CI. |
| **Vulnerabilidades / Prisma** | 4 high severity y Prisma 5.22 vs major nueva: impacto depende del contexto; no se cambió versión de Prisma en esta auditoría para no introducir regresiones. | **Informativo** – Recomendación: ejecutar `npm audit` y planificar actualización de Prisma en un ciclo aparte. |

### Rutas y runtime revisados

- **Middleware:** Solo aplica a `/platform/:path*` y hace `NextResponse.next()`. No bloquea `/api`, `/app`, `/portal` ni auth.
- **Auth:** NextAuth con credenciales (platform, tenant, member). Callbacks y sesión correctos. En producción se exige `NEXTAUTH_URL` y `NEXTAUTH_SECRET` vía `requireProductionEnv()`.
- **Layouts con tenant:** `getTenantBySlug` + `notFound()` cuando no hay tenant; `getServerSession` + redirect o mensaje cuando no hay acceso. Sin fallos obvios de runtime.
- **API:** `/api/health` y `/api/test-db` requieren `x-internal-secret` solo si `INTERNAL_API_SECRET` está definido en producción; si no, siguen siendo accesibles para diagnóstico.
- **Prisma:** Uso de cliente único vía `globalThis` en dev y producción para evitar múltiples conexiones en serverless.

### Warnings que importan vs que no

- **`engines: { "node": ">=18" }`** – Importante para predecibilidad; se fijó a `20.x`.
- **4 high severity vulnerabilities** – Importante revisar con `npm audit` y actualizar dependencias en un PR dedicado; no bloquea el deploy actual.
- **Prisma desactualizado** – Informativo; actualizar a major nueva requiere pruebas; no es requisito para “estable en producción” en esta auditoría.
- **Skipping validation of types / linting** – Importante para calidad a largo plazo; se dejaron scripts listos y documentación para usarlos en CI; no se activó en el build para no romper el flujo actual.

---

## B. Lista de cambios aplicados

| Archivo | Cambio | Motivo |
|---------|--------|--------|
| `package.json` | `engines.node`: `">=18"` → `"20.x"`; script `"typecheck": "tsc --noEmit"`. | Fijar Node estable; permitir ejecutar typecheck en CI/local. |
| `next.config.js` | Comentarios aclarando por qué están `ignoreDuringBuilds` e `ignoreBuildErrors` y que se puede activar typecheck/lint en build cuando se corrijan errores. | Documentar decisión y camino para endurecer el build. |
| `src/lib/prisma.ts` | Singleton de Prisma siempre asignado a `globalThis` (también en producción). Uso de `if (!globalForPrisma.prisma) { ... }` y `export const prisma = globalForPrisma.prisma`. | Evitar múltiples instancias de `PrismaClient` en serverless y reducir riesgo de "too many connections". |
| `src/lib/env.ts` | Función `requireProductionEnv()` que en producción comprueba `NEXTAUTH_SECRET` y `NEXTAUTH_URL` y lanza error con mensaje claro si faltan. | Fallo rápido y mensaje explícito en producción si faltan variables de auth. |
| `src/app/api/auth/[...nextauth]/route.ts` | Llamada a `requireProductionEnv()` antes de crear el handler de NextAuth. | Garantizar que en producción no se inicie auth sin variables configuradas. |
| `README.md` | Requisito Node 20.x; sección “Calidad de deploy” con typecheck/lint y “Variables requeridas en producción”; scripts `typecheck` y `lint` en la lista. | Documentar requisitos y uso de scripts de calidad. |
| `env.example` | Comentario en NEXTAUTH indicando que son obligatorias en producción (Vercel). | Dejar claro qué debe configurarse en producción. |
| `DEPLOY.md` | Sección 7: Node 20, typecheck/lint opcionales, comportamiento si faltan vars de auth en producción. | Guía de deploy alineada con la configuración endurecida. |
| `docs/DEPLOY-AUDIT.md` | Nuevo documento con diagnóstico, cambios y estado final. | Entregable de la auditoría. |

---

## C. Estado final

### ¿El proyecto quedó listo para redeploy?

**Sí.** Los cambios son compatibles con el build actual y mejoran robustez en runtime y configuración. Un redeploy en Vercel (push a `main`) es suficiente.

### Variables de entorno necesarias en Vercel

- **Obligatorias:** `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET` (o equivalentes con prefijo `dbgc_` si se usa).
- **Opcional:** `INTERNAL_API_SECRET` – si está definida, `/api/health` y `/api/test-db` requieren el header `x-internal-secret` en producción.

### Configuración manual recomendada en Vercel

1. Comprobar que en **Environment Variables** existan `DATABASE_URL`, `NEXTAUTH_URL` y `NEXTAUTH_SECRET` para Production (y Preview si aplica).
2. Vercel usará Node 20.x por `engines.node` en `package.json`; no suele hacer falta configurar la versión de Node a mano.
3. Opcional: en un job de CI (p. ej. GitHub Actions), ejecutar `npm run typecheck` y `npm run lint` antes o en paralelo al deploy.

### Conclusión

El deploy en Vercel **ya estaba correcto** desde el punto de vista de build y publicación. La auditoría se centró en **runtime, configuración y calidad**: singleton de Prisma en serverless, validación de variables de auth en producción, Node fijado a 20.x, scripts de typecheck y lint listos, y documentación clara. Con estos cambios el proyecto queda más estable y predecible en producción.
