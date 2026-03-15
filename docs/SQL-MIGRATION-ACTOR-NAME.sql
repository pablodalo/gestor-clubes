-- Migración: agregar columna actorName a AuditLog (para mostrar el nombre del usuario que hizo la acción).
-- Ejecutar en el Editor SQL de tu proveedor (Vercel Postgres, Neon, etc.) si no usás prisma migrate deploy.

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "actorName" TEXT;
