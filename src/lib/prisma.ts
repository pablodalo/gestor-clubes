import "@/lib/env";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/**
 * Singleton en dev y producción. En serverless (Vercel) reutilizar la misma
 * instancia evita "too many connections" en invocaciones concurrentes.
 */
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}
export const prisma = globalForPrisma.prisma;
