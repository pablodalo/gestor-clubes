import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  className?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
};

export function PageHeader({ title, description, className, actions, children }: Props) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
