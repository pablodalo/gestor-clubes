# Auditoría deploy Vercel y producción

**Fecha:** 2025-03  
**Objetivo:** Endurecer configuración, runtime y calidad de deploy sin asumir que el build fallaba.

---

## A. Diagnóstico

- **¿Hubo error real de build?** No. El build y el deploy en Vercel terminaban correctamente (Compiled successfully, Build Completed, Deployment completed).
- **Problema real:** Los warnings indicaban riesgo de **runtime** y **calidad**: typecheck y lint se saltaban en el build, health escribía en la DB en cada request, y no había `.env.example` ni documentación alineada.
- **Warnings que importan:**  
  - **Skipping validation of types / Skipping linting:** Se corrigió activando typecheck y lint en el build para que el deploy falle si hay errores de tipo o lint.  
  - **4 high severity vulnerabilities:** Conviene ejecutar `npm audit` y `npm audit fix` en local; no se modificaron dependencias en esta auditoría.  
  - **Prisma desactualizado:** Opcional actualizar cuando haya tiempo; la versión actual es estable para serverless.  
  - **engines.node ">=18":** El proyecto ya tenía `20.x` en `package.json`; no había cambio pendiente.

---

## B. Cambios aplicados (archivo por archivo)

| Archivo | Qué se hizo | Por qué |
|--------|-------------|--------|
| `next.config.js` | `eslint.ignoreDuringBuilds: false`, `typescript.ignoreBuildErrors: false` | Que el build en Vercel ejecute typecheck y lint y falle si hay errores. |
| `.env.example` | Creado con `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, opcional `INTERNAL_API_SECRET` y nota sobre prefijo `dbgc_`. | Referencia única de variables para local y Vercel. |
| `src/app/api/health/route.ts` | Eliminada la escritura en `auditLog` en cada GET; el endpoint solo hace lectura (`tenant.count()`). | Evitar llenar la tabla de auditoría con cada health check y posibles fallos por permisos. |
| `README.md` | Referencia a `.env.example` (antes `env.example`); sección “Calidad de deploy” actualizada: build ya ejecuta typecheck/lint. | Consistencia con el repo y con el comportamiento real del build. |
| `DEPLOY.md` | Health ya no “escribe un registro de prueba”; nota de que el build ejecuta typecheck y lint y referencia a `.env.example`. | Documentación alineada con el código. |
| `DEPLOY-AUDIT.md` | Este informe (diagnóstico, cambios, estado final). | Dejar trazabilidad de la auditoría. |

**No se cambiaron:** Auth (fail-fast en producción si faltan env está bien), middleware (solo aplica a `/platform` y no interfiere con auth), Prisma singleton, `vercel.json` (buildCommand con `prisma generate` correcto), `package.json` (engines y scripts ya correctos).

---

## C. Estado final

- **¿Listo para redeploy?** Sí. El proyecto queda con build más estricto (typecheck + lint), health solo lectura y documentación y `.env.example` consistentes.
- **Variables de entorno necesarias en Vercel:**  
  - **Obligatorias:** `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`.  
  - **Opcionales:** `INTERNAL_API_SECRET` (si está definido, `/api/health` y `/api/test-db` exigen header `x-internal-secret` en producción).  
  - Opcional usar prefijo `dbgc_` (ej. `dbgc_DATABASE_URL`); el app las copia a las variables estándar.
- **Configuración manual en Vercel:**  
  - Settings → Environment Variables con las tres obligatorias (y las opcionales si las usás).  
  - Settings → General → Node.js Version: **20.x** recomendado (coherente con `engines` en `package.json`).  
  - No es necesario cambiar Build Command; `vercel.json` ya tiene `npx prisma generate && npm run build`.

**Nota:** Si el primer build tras estos cambios falla por TypeScript o ESLint, corregir los errores que muestre el log de Vercel o, de forma temporal, volver a `ignoreDuringBuilds: true` / `ignoreBuildErrors: true` en `next.config.js` hasta corregirlos en el código.
