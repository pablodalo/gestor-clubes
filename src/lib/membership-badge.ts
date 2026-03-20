import { cn } from "@/lib/utils";

/** Colores suaves para badges de tipo de membresía (paleta The Dab Club: #1a1a1a, #e6dcc8, #c6a15b, #f7f2e8) */
export function getMembershipBadgeClassName(planLabel: string): string {
  const normalized = planLabel.toLowerCase().trim();
  if (normalized === "pendiente")
    return "border-slate-200/80 bg-slate-100/90 text-slate-700 dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-slate-200";
  if (normalized.includes("básico") || normalized.includes("basico"))
    return "border-amber-200/80 bg-amber-50/90 text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100";
  if (normalized.includes("premium"))
    return "border-stone-300/80 bg-stone-100/90 text-stone-800 dark:border-stone-700/60 dark:bg-stone-900/50 dark:text-stone-200";
  return "border-muted-foreground/20 bg-muted/50 text-foreground";
}
