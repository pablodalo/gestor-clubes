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
