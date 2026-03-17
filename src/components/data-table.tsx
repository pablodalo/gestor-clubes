"use client";

import React, { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  align?: "left" | "center" | "right";
  render?: (item: T) => React.ReactNode;
  className?: string;
  /** Habilita ordenamiento haciendo clic en el encabezado */
  sortable?: boolean;
  /** Cómo obtener el valor a ordenar para esta columna (por defecto usa item[key]) */
  sortAccessor?: (item: T) => unknown;
};

export type DataTableEmptyState = {
  icon?: LucideIcon;
  title?: string;
  description?: string;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  /** Mensaje corto o estado vacío con icono/título/descripción */
  emptyMessage?: string;
  emptyState?: DataTableEmptyState;
  /** Barra opcional arriba de la tabla (búsqueda, filtros) */
  toolbar?: React.ReactNode;
  /** Contenido de la última celda por fila (menú de acciones discreto) */
  rowActions?: (item: T) => React.ReactNode;
  rowClassName?: string;
};

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "No hay datos.",
  emptyState,
  toolbar,
  rowActions,
  rowClassName,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const sortedData = useMemo(() => {
    if (!sort) return data;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return data;
    const accessor =
      col.sortAccessor ??
      ((item: T) => (item as unknown as Record<string, unknown>)[col.key]);

    const compare = (a: unknown, b: unknown) => {
      if (a == null && b == null) return 0;
      if (a == null) return -1;
      if (b == null) return 1;

      const av = a instanceof Date ? a.getTime() : a;
      const bv = b instanceof Date ? b.getTime() : b;

      if (typeof av === "number" && typeof bv === "number") return av - bv;
      return String(av).localeCompare(String(bv), "es", { sensitivity: "base" });
    };

    return [...data].sort((a, b) => {
      const res = compare(accessor(a), accessor(b));
      return sort.direction === "asc" ? res : -res;
    });
  }, [data, columns, sort]);

  const colCount = columns.length + (rowActions ? 1 : 0);
  const emptyContent = emptyState ? (
    <EmptyState
      icon={emptyState.icon}
      title={emptyState.title}
      description={emptyState.description}
      className="py-12"
    />
  ) : (
    <span className="text-muted-foreground">{emptyMessage}</span>
  );

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {toolbar && (
        <div className="border-b bg-muted/30 px-4 py-3">
          {toolbar}
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b bg-muted/40">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={cn(
                  col.align === "right" && "text-right",
                  col.align === "center" && "text-center",
                  col.className
                )}
              >
                {col.sortable !== false ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 select-none"
                    onClick={() =>
                      setSort((prev) =>
                        prev && prev.key === col.key && prev.direction === "asc"
                          ? { key: col.key, direction: "desc" }
                          : { key: col.key, direction: "asc" }
                      )
                    }
                  >
                    <span>{col.header}</span>
                    {sort?.key === col.key && (
                      <span className="text-[10px] text-muted-foreground">
                        {sort.direction === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </button>
                ) : (
                  col.header
                )}
              </TableHead>
            ))}
            {rowActions && (
              <TableHead className="w-[4.5rem] text-right pr-3" aria-label="Acciones" />
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={colCount}
                className="py-0"
              >
                <div className="flex min-h-[12rem] items-center justify-center">
                  {emptyContent}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            sortedData.map((item) => (
              <TableRow key={keyExtractor(item)} className={rowClassName}>
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className={cn(
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center",
                      col.className
                    )}
                  >
                    {col.render ? col.render(item) : (item as Record<string, unknown>)[col.key] as React.ReactNode}
                  </TableCell>
                ))}
                {rowActions && (
                  <TableCell className="text-right pr-3 w-[4.5rem]">{rowActions(item)}</TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
