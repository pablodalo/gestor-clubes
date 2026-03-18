"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  /** Texto del botón. Default: "Cerrar" */
  closeLabel?: string;
};

/**
 * Modal para avisos y mensajes (reemplazo de alert()).
 * Regla: los avisos siempre en modales, no en alert.
 */
export function AlertDialog({ open, onOpenChange, title, message, closeLabel = "Cerrar" }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showClose={true}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground py-2">{message}</p>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>{closeLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
