# Vercel Blob: subida de logos en producción

En local, el logo del branding se guarda en `public/uploads/`. En Vercel el filesystem es efímero, así que para que el upload de logo funcione en producción hay que usar **Vercel Blob**.

## Cómo crear el Blob en Vercel

1. Entrá al [Dashboard de Vercel](https://vercel.com) y abrí el proyecto **gestor-clubes**.
2. En el menú lateral: **Storage** → **Create Database** (o **Add Storage**).
3. Elegí **Blob**.
4. Nombre del store: por ejemplo `gestor-clubes-blob`.
5. **Access**: elegí **Public** si querés que las URLs de los logos sean accesibles sin autenticación (recomendado para logos en el header).
6. Crear. Vercel va a crear el store y añadir la variable de entorno **`BLOB_READ_WRITE_TOKEN`** al proyecto.
7. Para usarla en local: en la raíz del repo ejecutá `vercel env pull` (o copiá el token desde Project Settings → Environment Variables y ponelo en `.env.local`).

## Variables de entorno

En **Project Settings → Environment Variables** deberías tener:

- `BLOB_READ_WRITE_TOKEN`: lo crea Vercel al crear el Blob. No hace falta crearla a mano.

## Uso en el código

El proyecto puede usar `@vercel/blob` cuando exista `BLOB_READ_WRITE_TOKEN`. En ese caso, la action `uploadLogo` en `src/actions/branding.ts` sube a Vercel Blob y devuelve la URL pública. Si la variable no está definida, se sigue usando el filesystem local (`public/uploads/`).

Uso en el proyecto: ya está integrado. Si existe la variable `BLOB_READ_WRITE_TOKEN`, la acción `uploadLogo` sube a Vercel Blob y devuelve la URL pública. Si no, guarda en `public/uploads/` (solo en local).

Después de crear el Blob en Vercel, ejecutá `npm i` en el repo (el paquete `@vercel/blob` ya está en `package.json`).
