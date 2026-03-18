"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ListPageLayout } from "@/components/list-page-layout";
import { AlertDialog } from "@/components/alert-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteErrorLog, clearAllErrorLogs } from "@/actions/error-log";
import { AlertTriangle, ChevronDown, ChevronRight, Trash2, XCircle } from "lucide-react";
import type { ErrorLog as ErrorLogModel } from "@prisma/client";

type Props = { initialLogs: ErrorLogModel[] };

function StackBlock({ stack }: { stack: string | null }) {
  const [open, setOpen] = useState(false);
  if (!stack?.trim()) return null;
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        Stack trace
      </button>
      {open && (
        <pre className="mt-1 p-3 rounded-md bg-muted text-xs overflow-auto max-h-80 whitespace-pre-wrap break-all font-mono">
          {stack}
        </pre>
      )}
    </div>
  );
}

function LogRow({
  log,
  onDelete,
}: {
  log: ErrorLogModel;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(log.id);
    setDeleting(false);
  };
  return (
    <div className="border rounded-lg p-4 bg-card space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground break-words">{log.message}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
            {log.digest && <span>Digest: {log.digest}</span>}
            {log.context && <span>Contexto: {log.context}</span>}
            {log.path && <span>Ruta: {log.path}</span>}
            <span>{new Date(log.createdAt).toLocaleString("es-AR")}</span>
          </div>
          <StackBlock stack={log.stack} />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 h-8 w-8 text-destructive hover:text-destructive"
          onClick={handleDelete}
          disabled={deleting}
          aria-label="Eliminar"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function ErrorLogList({ initialLogs }: Props) {
  const router = useRouter();
  const [logs, setLogs] = useState(initialLogs);
  const [clearing, setClearing] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ title: "Aviso", message: "" });

  const handleDelete = async (id: string) => {
    const res = await deleteErrorLog(id);
    if (res.error) return;
    setLogs((prev) => prev.filter((l) => l.id !== id));
    router.refresh();
  };

  const handleClearAll = () => setClearConfirmOpen(true);

  const doClearAll = async () => {
    setClearing(true);
    const res = await clearAllErrorLogs();
    setClearing(false);
    if (res.error) {
      setAlertMessage({ title: "Error", message: res.error });
      setAlertOpen(true);
    } else {
      setLogs([]);
      router.refresh();
    }
  };

  return (
    <>
    <ListPageLayout
      title="Log de errores"
      description="Excepciones capturadas en servidor y cliente. Expandí el stack para ver el detalle."
      actions={
        logs.length > 0 ? (
          <Button variant="outline" size="sm" onClick={handleClearAll} disabled={clearing}>
            <XCircle className="h-4 w-4 mr-2" />
            Vaciar todo
          </Button>
        ) : undefined
      }
    >
      {logs.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
          <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">Sin registros</p>
          <p className="text-sm mt-1">Los errores aparecerán aquí cuando ocurran.</p>
          <p className="text-xs mt-3 max-w-md mx-auto">
            Si en producción ves solo &quot;message is omitted&quot;, el detalle está en Vercel → Logs (buscá [GESTOR] o el digest). También se persisten unhandledRejection y onRequestError (Next 15+).
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <LogRow key={log.id} log={log} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </ListPageLayout>
    <ConfirmDialog
      open={clearConfirmOpen}
      onOpenChange={setClearConfirmOpen}
      title="Vaciar log de errores"
      description="¿Borrar todos los registros de errores?"
      confirmLabel="Vaciar todo"
      destructive
      onConfirm={doClearAll}
    />
    <AlertDialog open={alertOpen} onOpenChange={setAlertOpen} title={alertMessage.title} message={alertMessage.message} />
    </>
  );
}
