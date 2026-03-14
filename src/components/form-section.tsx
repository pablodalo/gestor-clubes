import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

/**
 * Sección de formulario con título opcional. Espaciado consistente entre campos.
 */
export function FormSection({ title, description, children, className }: Props) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div>
          {title && <h3 className="text-sm font-medium leading-none">{title}</h3>}
          {description && (
            <p className="text-xs text-muted-foreground mt-1.5">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
}
