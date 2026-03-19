import { prisma } from "@/lib/prisma";

export type ErrorLogPayload = {
  message: string;
  digest?: string | null;
  context?: string | null;
  path?: string | null;
  stack?: string | null;
};

let p2021Warned = false;

/**
 * Persiste un error en la tabla ErrorLog. No lanza; si falla solo hace console.error.
 * Si la tabla no existe (P2021), solo avisa una vez para no llenar logs.
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
    const code = e && typeof e === "object" && "code" in e ? (e as { code: string }).code : "";
    if (code === "P2021" && !p2021Warned) {
      p2021Warned = true;
      console.warn(
        "[cultiOS] ErrorLog: la tabla no existe. Ejecutá una vez: npx prisma db push (con DATABASE_URL de producción)."
      );
      return;
    }
    if (code !== "P2021") {
      console.error("[cultiOS] recordErrorInDb failed", e);
    }
  }
}
