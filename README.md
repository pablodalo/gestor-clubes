# Gestor Clubes

SaaS multi-tenant white-label para operar múltiples clubes desde una sola base de código.

**Repo:** https://github.com/pablodalo/gestor-clubes  
**Vercel:** https://gestor-clubes.vercel.app

Última actualización: código en rama `main`.

---

## Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Prisma + PostgreSQL
- NextAuth (credenciales: platform, tenant, member)
- React Hook Form + Zod
- TanStack Query
- Recharts (dashboards)

## Estructura de rutas

- `/` — Inicio (links a las 3 áreas)
- `/platform` — Superadmin (tenants, branding, usuarios plataforma)
- `/app/[tenantSlug]` — Panel del club (usuarios internos, socios, inventario, etc.)
- `/portal/[tenantSlug]` — Portal de socios (login, perfil, movimientos, tickets)

## Requisitos

- Node.js 18+
- PostgreSQL
- npm o pnpm

## Instalación local

1. **Clonar y dependencias**

```bash
git clone https://github.com/pablodalo/gestor-clubes.git
cd gestor-clubes
npm install
```

2. **Variables de entorno**

Crear `.env` en la raíz (copiar desde `env.example`):

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/gestor_clubes?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generar-con-openssl-rand-base64-32"
```

Generar `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

3. **Base de datos**

```bash
npx prisma db push
npm run db:seed
```

4. **Arrancar**

```bash
npm run dev
```

Abrir http://localhost:3000.

## Usuarios demo (después del seed)

| Área        | Email                    | Contraseña   |
|------------|---------------------------|--------------|
| Superadmin | admin@gestorclubes.com    | Admin123!    |
| Panel club | operador@demo-club.com   | Operador123! |
| Panel club | operador@club-ejemplo.com| Operador123! |
| Portal socio | socio@demo-club.com    | Socio123!    |
| Portal socio | socio@club-ejemplo.com | Socio123!    |

- Superadmin: http://localhost:3000/platform/login → luego /platform/tenants
- Panel club: http://localhost:3000/app/demo-club/login
- Portal socio: http://localhost:3000/portal/demo-club/login

## Deploy en Vercel

**Guía paso a paso:** ver **[DEPLOY.md](./DEPLOY.md)**.

1. **Conectar el repo**  
   En [Vercel](https://vercel.com): Import Project → GitHub → elegir `gestor-clubes`. Cada push a `main` despliega automáticamente.

2. **Variables de entorno en Vercel**  
   En el proyecto → Settings → Environment Variables:

   - `DATABASE_URL`: URL de PostgreSQL (Vercel Postgres, Neon, Supabase, etc.)
   - `NEXTAUTH_URL`: `https://gestor-clubes.vercel.app` (o tu dominio)
   - `NEXTAUTH_SECRET`: mismo valor que en local (o uno nuevo de 32+ caracteres)

3. **PostgreSQL en Vercel**  
   Opción A: Vercel Postgres (Storage → Create Database).  
   Opción B: Servicio externo (Neon, Supabase, etc.) y pegar la URL en `DATABASE_URL`.

4. **Migraciones en producción**  
   Tras el primer deploy, ejecutar migraciones contra la DB de producción:

   - Con Vercel Postgres: desde el dashboard o CLI.
   - O en “Settings → General → Build Command” dejar:

   ```bash
   prisma generate && next build
   ```

   Y añadir un paso de deploy que ejecute (por ejemplo en un job o script):

   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

   La primera vez puedes hacer `prisma db push` desde tu máquina apuntando a `DATABASE_URL` de producción y luego `prisma db seed`.

5. **Build**  
   El proyecto usa `prisma generate` en el build (ver `vercel.json`). Asegurarse de que `DATABASE_URL` esté definida en Vercel para que el build no falle.

## Scripts

- `npm run dev` — Desarrollo
- `npm run build` — Build producción
- `npm run start` — Servir build
- `npm run db:generate` — Generar cliente Prisma
- `npm run db:push` — Sincronizar schema con la DB (sin migraciones)
- `npm run db:migrate` — Aplicar migraciones (producción)
- `npm run db:migrate:dev` — Crear/aplicar migraciones (desarrollo)
- `npm run db:seed` — Cargar datos demo
- `npm run db:studio` — Abrir Prisma Studio

## Desarrollo en colaboración

- Antes de programar: `git pull origin main`
- Después de cambiar: `git add .` → `git commit -m "..."` → `git push origin main`
- Opcional: trabajar en rama y abrir Pull Request a `main`.

---

Desarrollo en colaboración (Pablo + Marcelo).
