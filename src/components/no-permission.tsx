import { Card, CardContent } from "@/components/ui/card";

type Props = { message?: string };

export function NoPermissionMessage({ message = "No tenés permiso para ver esta sección." }: Props) {
  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground font-medium">{message}</p>
        <p className="text-sm text-muted-foreground mt-1">Contactá al administrador del club si creés que es un error.</p>
      </CardContent>
    </Card>
  );
}
