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
import { Button } from "@/components/ui/button";
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
  /** Paginado en cliente (por defecto true) */
  paginate?: boolean;
  /** Tamaño de página (por defecto 20) */
  pageSize?: number;
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
  paginate = true,
  pageSize = 20,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSizeState, setPageSizeState] = useState<number>(pageSize);

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
  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSizeState));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSizeState;
  const end = start + pageSizeState;
  const viewData = paginate ? sortedData.slice(start, end) : sortedData;
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
            viewData.map((item) => (
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
      {paginate && totalPages > 1 && (
        <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2 text-xs sm:text-sm">
          <span className="text-muted-foreground">
            Mostrando{" "}
            <span className="font-medium">
              {start + 1}–{Math.min(end, totalItems)}
            </span>{" "}
            de <span className="font-medium">{totalItems}</span>
          </span>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Mostrar</span>
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-xs sm:text-sm"
                value={pageSizeState}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setPage(1);
                  setPageSizeState(next);
                }}
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span className="text-muted-foreground">por página</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="text-muted-foreground">
              Página <span className="font-medium">{currentPage}</span> de{" "}
              <span className="font-medium">{totalPages}</span>
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
