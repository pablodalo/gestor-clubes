/**
 * Next.js instrumentation: captura errores de request (Next 15+) y rechazos no manejados
 * para loguear y persistir el error real en ErrorLog.
 */

const PREFIX = "[cultiOS]";

function serializeError(err: unknown): { message: string; stack?: string; digest?: string } {
  if (err instanceof Error) {
    const digest = "digest" in err && typeof (err as { digest?: string }).digest === "string"
      ? (err as { digest: string }).digest
      : undefined;
    return { message: err.message, stack: err.stack, digest };
  }
  return { message: String(err) };
}

async function persistError(payload: { message: string; stack?: string; digest?: string; context?: string; path?: string }) {
  try {
    const { recordErrorInDb } = await import("@/lib/error-log-db");
    await recordErrorInDb({
      message: payload.message,
      digest: payload.digest ?? null,
      context: payload.context ?? null,
      path: payload.path ?? null,
      stack: payload.stack ?? null,
    });
  } catch (e) {
    console.error(PREFIX, "persistError failed", e);
  }
}

export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  process.on("unhandledRejection", (reason) => {
    const { message, stack } = serializeError(reason);
    console.error(PREFIX, "[unhandledRejection]", message);
    if (stack) console.error(PREFIX, "[unhandledRejection] stack", stack);
    persistError({ message, stack, context: "unhandledRejection" }).catch(() => {});
  });

  process.on("uncaughtException", (err) => {
    const { message, stack } = serializeError(err);
    console.error(PREFIX, "[uncaughtException]", message);
    if (stack) console.error(PREFIX, "[uncaughtException] stack", stack);
    persistError({ message, stack, context: "uncaughtException" }).catch(() => {});
  });
}

// Next 15+: captura errores de request y persiste con path y contexto
type Req = { path?: string; method?: string };
type Ctx = { routePath?: string; routeType?: string; renderSource?: string };

export async function onRequestError(
  err: Error & { digest?: string },
  request?: Req,
  context?: Ctx
): Promise<void> {
  try {
    const message = err?.message ?? "Unknown error";
    const stack = err?.stack;
    const digest = err?.digest;
    const path = request?.path ?? "";
    const ctx = context
      ? [context.routePath, context.routeType, context.renderSource].filter(Boolean).join(" | ") || "onRequestError"
      : "onRequestError";

    console.error(PREFIX, "[onRequestError]", path, message);
    if (stack) console.error(PREFIX, "[onRequestError] stack", stack);
    await persistError({
      message,
      stack: stack ?? undefined,
      digest,
      context: ctx,
      path: path || undefined,
    });
  } catch (e) {
    console.error(PREFIX, "onRequestError handler failed", e);
  }
}
