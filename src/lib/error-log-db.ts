import { prisma } from "@/lib/prisma";

export type ErrorLogPayload = {
  message: string;
  digest?: string | null;
  context?: string | null;
  path?: string | null;
  stack?: string | null;
};

/**
 * Persiste un error en la tabla ErrorLog. No lanza; si falla solo hace console.error.
 */
export async function recordErrorInDb(payload: ErrorLogPayload): Promise<void> {
  try {
    await prisma.errorLog.create({
      data: {
        message: payload.message.slice(0, 2000),
        digest: payload.digest?.slice(0, 100) ?? null,
        context: payload.context?.slice(0, 500) ?? null,
        path: payload.path?.slice(0, 500) ?? null,
        stack: payload.stack?.slice(0, 30000) ?? null,
      },
    });
  } catch (e) {
    console.error("[GESTOR] recordErrorInDb failed", e);
  }
}
