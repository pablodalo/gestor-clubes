import { recordErrorInDb } from "@/lib/error-log-db";

/**
 * Logger para servidor. En Vercel aparece en Runtime Logs / Function Logs.
 * Buscar por "[cultiOS]" para filtrar.
 * También persiste en la tabla ErrorLog para verlos en /platform/errors.
 */
const PREFIX = "[cultiOS]";

export function logError(context: string, error: unknown, path?: string): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const digest = error && typeof error === "object" && "digest" in error ? String((error as { digest?: string }).digest) : undefined;
  console.error(`${PREFIX} [${context}]`, message);
  if (stack) console.error(`${PREFIX} [${context}] stack`, stack);
  if (error && typeof error === "object" && "cause" in error) {
    console.error(`${PREFIX} [${context}] cause`, (error as { cause: unknown }).cause);
  }
  recordErrorInDb({ message, digest, context, path, stack }).catch(() => {});
}
