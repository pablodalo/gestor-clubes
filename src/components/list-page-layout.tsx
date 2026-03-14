import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

/**
 * Layout estándar para páginas de listado: título, descripción, acciones a la derecha,
 * opcional barra de filtros/búsqueda, y contenido (tabla).
 */
export function ListPageLayout({
  title,
  description,
  actions,
  toolbar,
  children,
  className,
}: Props) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1 text-sm">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {toolbar && <div className="flex flex-col gap-2 sm:flex-row sm:items-center">{toolbar}</div>}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
