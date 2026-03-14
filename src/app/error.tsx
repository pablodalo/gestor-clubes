"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

/**
 * Captura errores de server/client en el árbol y los registra.
 * En servidor el error ya se loguea; en cliente acá vemos el serializado y lo enviamos al API.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const msg = error?.message ?? "Unknown error";
    const digest = error?.digest ?? "—";
    const stack = error?.stack;
    console.error("[GESTOR] [error.tsx] Server-side exception:", msg, "Digest:", digest);
    if (stack) console.error("[GESTOR] [error.tsx] stack:", stack);
    if (error?.cause) console.error("[GESTOR] [error.tsx] cause:", error.cause);
    fetch("/api/error-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: msg,
        digest: digest !== "—" ? digest : undefined,
        context: "error.tsx",
        path: typeof window !== "undefined" ? window.location.pathname : undefined,
        stack: stack ?? undefined,
      }),
    }).catch(() => {});
  }, [error]);

  const isGenericMessage = error?.message?.includes("omitted in production");
  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
      </div>
      <h1 className="text-xl font-semibold text-foreground mb-2">Error en la aplicación</h1>
      <p className="text-muted-foreground text-sm max-w-md mb-2">
        {isGenericMessage ? (
          <>
            En producción Next.js oculta el mensaje real. Para ver el detalle: (1) entrá a <strong>/platform/errors</strong> (como admin) y buscá el registro con el digest de abajo; (2) en Vercel → Deployments → Logs buscá <strong>[GESTOR]</strong> o el digest en el momento del error.
          </>
        ) : (
          <>
            Ocurrió un error en el servidor. Revisá los logs (Vercel → Logs) o <strong>/platform/errors</strong>.
          </>
        )}
      </p>
      <p className="font-mono text-xs bg-muted px-3 py-2 rounded mb-6 break-all">
        Digest: {error?.digest ?? "—"}
        {!isGenericMessage && error?.message ? ` · ${error.message}` : ""}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="text-sm font-medium text-primary hover:underline"
      >
        Reintentar
      </button>
    </div>
  );
}
