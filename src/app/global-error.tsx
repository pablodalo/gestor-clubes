"use client";

import { useEffect } from "react";

/**
 * Captura errores que ocurren en el root layout. Reemplaza toda la UI.
 * Loguea igual que error.tsx para ver el error en consola del navegador y en server logs.
 */
export default function GlobalError({
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
    console.error("[GESTOR] [global-error] Exception:", msg, "Digest:", digest);
    if (stack) console.error("[GESTOR] [global-error] stack:", stack);
    if (error?.cause) console.error("[GESTOR] [global-error] cause:", error.cause);
  }, [error]);

  return (
    <html lang="es">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Error en la aplicación</h1>
        <p style={{ color: "#666", fontSize: "0.875rem", marginBottom: "1rem" }}>
          Revisá los logs del servidor (Vercel → Logs). Buscá <strong>[GESTOR]</strong> o el digest.
        </p>
        <p style={{ fontFamily: "monospace", fontSize: "0.75rem", background: "#f0f0f0", padding: "0.5rem 1rem", borderRadius: "4px", marginBottom: "1rem", wordBreak: "break-all" }}>
          Digest: {error?.digest ?? "—"} {error?.message ? ` · ${error.message}` : ""}
        </p>
        <button type="button" onClick={() => reset()} style={{ color: "#0066cc", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", fontSize: "0.875rem" }}>
          Reintentar
        </button>
      </body>
    </html>
  );
}
