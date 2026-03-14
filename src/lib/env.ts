/**
 * Soporta variables con prefijo dbgc_ en Vercel (ej. integración con prefijo "dbgc").
 * Si existen dbgc_DATABASE_URL, dbgc_NEXTAUTH_URL, dbgc_NEXTAUTH_SECRET,
 * se copian a DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET para que Prisma y NextAuth las usen.
 */
const PREFIX = "dbgc_";
const STANDARD_KEYS = ["DATABASE_URL", "NEXTAUTH_URL", "NEXTAUTH_SECRET"] as const;

function loadPrefixedEnv() {
  for (const key of STANDARD_KEYS) {
    const prefixedValue = process.env[PREFIX + key];
    if (prefixedValue && !process.env[key]) {
      process.env[key] = prefixedValue;
    }
  }
}

loadPrefixedEnv();

/**
 * Comprueba que las variables requeridas en producción estén definidas.
 * Útil para fallar rápido con mensaje claro en deploy (p. ej. en /api/auth).
 */
export function requireProductionEnv(): void {
  if (process.env.NODE_ENV !== "production") return;
  const missing: string[] = [];
  if (!process.env.NEXTAUTH_SECRET) missing.push("NEXTAUTH_SECRET");
  if (!process.env.NEXTAUTH_URL) missing.push("NEXTAUTH_URL");
  if (missing.length > 0) {
    throw new Error(
      `En producción se requieren: ${missing.join(", ")}. Configuralas en Vercel → Settings → Environment Variables.`
    );
  }
}
