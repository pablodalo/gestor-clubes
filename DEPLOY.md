# Deploy en Vercel (paso a paso)

Ya tenés la base Neon creada en Vercel. Seguí estos pasos para dejar el proyecto desplegado y funcionando.

---

## 1. Variables de entorno en Vercel

En el proyecto en Vercel: **Settings → Environment Variables**.

Asegurate de tener estas tres (Neon suele crear `POSTGRES_URL` o `DATABASE_URL`):

| Variable | Valor | Entorno |
|----------|--------|---------|
| `DATABASE_URL` | La connection string de Neon (si la integración creó `POSTGRES_URL`, copiá ese valor acá como `DATABASE_URL`) | Production (y Preview si querés) |
| `NEXTAUTH_URL` | `https://gestor-clubes.vercel.app` (o tu dominio en Vercel) | Production |
| `NEXTAUTH_SECRET` | Una cadena aleatoria de 32+ caracteres | Production |

- Para generar `NEXTAUTH_SECRET`: en PowerShell `[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])` o en cualquier terminal: `openssl rand -base64 32`.

---

## 2. Subir el código a GitHub

En tu PC, desde la carpeta del proyecto:

```powershell
cd c:\Users\marcelo.raviscioni\Desktop\gestor-clubes

git status
git add .
git commit -m "feat: deploy - Next.js, Prisma, Neon, auth y tenants"
git push origin main
```

(Si tu rama principal se llama `master`, usá `git push origin master`.)

Vercel va a detectar el push y va a hacer un **deploy automático**. El build usa `prisma generate && next build` (está en `vercel.json`).

---

## 3. Crear tablas y datos en la base Neon (una sola vez)

El build **no** ejecuta migraciones ni seed. Tenés que aplicar el schema y cargar datos contra la base de **producción**.

**Opción A – Desde tu PC (recomendado)**

1. Copiá la **connection string** de Neon:
   - En Vercel: **Storage** (o el recurso Neon) → tu base → **Connection string**, o  
   - En [Neon Console](https://console.neon.tech) → tu proyecto → **Connection details**.

2. En la carpeta del proyecto, ejecutá **una vez** (reemplazá la URL):

```powershell
$env:DATABASE_URL = "postgresql://usuario:password@host/neondb?sslmode=require"
npx prisma db push
npx prisma db seed
```

O en CMD:

```cmd
set DATABASE_URL=postgresql://usuario:password@host/neondb?sslmode=require
npx prisma db push
npx prisma db seed
```

- `db push`: crea/actualiza todas las tablas en Neon.
- `db seed`: inserta el usuario admin, tenants demo, socios, etc.

**Opción B – Sin poner la URL en la terminal**

1. Creá un `.env.production` **solo en tu PC** (no lo subas a Git) con:

```env
DATABASE_URL="postgresql://...tu-connection-string-de-neon..."
```

2. Ejecutá:

```powershell
npx dotenv -e .env.production -- prisma db push
npx dotenv -e .env.production -- prisma db seed
```

(Si no tenés `dotenv-cli`: `npm install -D dotenv-cli`.)

O cargá la variable en el sistema y después:

```powershell
npx prisma db push
npx prisma db seed
```

---

## 4. Probar el deploy

1. Entrá a la URL del proyecto en Vercel (ej. `https://gestor-clubes.vercel.app`).
2. Probá:
   - **/** → página de inicio.
   - **/platform/login** → admin@gestorclubes.com / Admin123!
   - **/platform/tenants** → listado de tenants.
   - **/app/demo-club/login** → operador@demo-club.com / Operador123!
   - **/portal/demo-club/login** → socio@demo-club.com / Socio123!

Si algo falla, revisá **Deployments** en Vercel → último deploy → **Building** o **Functions** para ver errores.

**Log de errores:** En **/platform/errors** (solo platform) podés ver el listado de excepciones con stack completo. La tabla `ErrorLog` se crea con `npx prisma db push`; si no existe, la app sigue funcionando y solo no se guardan errores para esa vista.

---

## 5. Probar si Vercel tiene conexión a PostgreSQL

Abrí en el navegador (reemplazá por la URL de tu proyecto):

**https://gestor-clubes.vercel.app/api/health**

Ese endpoint devuelve en un solo request:

1. **env** – Si están definidas `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET` (o las versiones con prefijo `dbgc_`). No muestra los valores, solo "set" o "missing".
2. **database** – Si la app logra conectar a PostgreSQL y escribir un registro de prueba.

- Si **env** tiene algo "missing" → entrá a Vercel → **Settings → Environment Variables** y agregá las variables (ver sección 1). Después hacé **Redeploy** del último deployment.
- Si **env** está todo "set" pero **database.ok** es `false` → la URL de la base está mal o las tablas no existen. Revisá que `DATABASE_URL` sea la connection string correcta de Neon y que alguien haya ejecutado `npx prisma db push` (y opcional `npx prisma db seed`) contra esa base al menos una vez.

También podés usar por separado:

- **GET /api/env-check** – Solo variables de entorno.
- **GET /api/test-db** – Solo prueba de conexión y escritura en la DB.

---

## 6. Errores frecuentes en Vercel (qué está pasando)

| Dónde ves el error | Qué suele ser | Qué hacer |
|--------------------|----------------|-----------|
| **Build falla** (Deployments → Building) | Falta `DATABASE_URL` en el build, o un error de TypeScript/Prisma. | Revisá el log del build. Si dice "env("DATABASE_URL")" o "schema not found", agregá `DATABASE_URL` en Vercel (Environment Variables) para el entorno que usás (Production/Preview). El build solo necesita que la variable exista; no conecta a la DB en build. |
| **Deploy OK pero al abrir la app** "Application error" o pantalla de error | En runtime falta una variable o la DB no responde. | Abrí **/api/health**. Si `env` tiene "missing", agregá las variables en Vercel y redeployá. Si `database.ok` es false, corregí `DATABASE_URL` o ejecutá `prisma db push` contra esa base. |
| **500 en /api/test-db o /api/health** con mensaje de Prisma | Conexión rechazada, SSL, o tablas no creadas. | La URL de Neon debe tener `?sslmode=require`. Las tablas tienen que existir: alguien tiene que haber corrido `npx prisma db push` contra la misma base que usa `DATABASE_URL`. |

---

## 7. Node y calidad de build

- El proyecto fija **Node 20.x** en `package.json` (`engines.node`). Vercel usa esa versión.
- **Importante:** En Vercel → **Settings → General → Node.js Version** elegí **20.x**. Si tenés 24.x u otra, el build usará igual 20.x por `engines` pero verás un warning y se salteará el build cache. Con 20.x en Settings el warning desaparece y se reutiliza el cache.
- Antes de push (opcional): `npm run typecheck` y `npm run lint`. El build en Vercel no falla por errores de tipo/lint salvo que los actives en `next.config.js`.
- Si en producción faltan `NEXTAUTH_URL` o `NEXTAUTH_SECRET`, las rutas `/api/auth/*` responderán con error explícito pidiendo configurarlas en Vercel.
- Para reducir vulnerabilidades: `npm audit` y `npm audit fix`. El proyecto incluye `overrides` para `glob` y `rimraf`; tras cambios en dependencias conviene ejecutar de nuevo `npm install` y `npm audit`.

## Resumen

1. Variables en Vercel: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`.
2. `git push origin main` (o tu rama principal).
3. Una vez: `npx prisma db push` y `npx prisma db seed` con la URL de Neon.
4. Probar la app en la URL de Vercel.

A partir de ahí, cada **push a main** vuelve a desplegar solo la app; no hace falta repetir `db push` ni `db seed` salvo que cambies el schema o quieras resetear datos.
