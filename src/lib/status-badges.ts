/**
 * Mapeo centralizado de valores de estado a variante de Badge y etiqueta para mostrar.
 * Uso: <Badge variant={getStatusVariant(status)}>{getStatusLabel(status) ?? status}</Badge>
 */

export type BadgeVariant = "default" | "secondary" | "success" | "destructive" | "warning" | "outline";

const STATUS_MAP: Record<string, { variant: BadgeVariant; label?: string }> = {
  active: { variant: "success", label: "Activo" },
  inactive: { variant: "secondary", label: "Inactivo" },
  suspended: { variant: "warning", label: "Suspendido" },
  open: { variant: "default", label: "Abierto" },
  closed: { variant: "secondary", label: "Cerrado" },
  resolved: { variant: "success", label: "Resuelto" },
  in_progress: { variant: "warning", label: "En curso" },
  high: { variant: "destructive", label: "Alta" },
  medium: { variant: "warning", label: "Media" },
  low: { variant: "secondary", label: "Baja" },
  trial: { variant: "warning", label: "Prueba" },
};

export function getStatusVariant(status: string): BadgeVariant {
  const key = status.toLowerCase().replace(/\s+/g, "_");
  return STATUS_MAP[key]?.variant ?? "secondary";
}

export function getStatusLabel(status: string): string | undefined {
  const key = status.toLowerCase().replace(/\s+/g, "_");
  return STATUS_MAP[key]?.label;
}
