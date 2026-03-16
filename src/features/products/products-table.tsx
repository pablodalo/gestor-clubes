"use client";

import type { Product } from "@prisma/client";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";

export function ProductsTable({ products }: { products: Product[] }) {
  const columns: DataTableColumn<Product>[] = [
    { key: "name", header: "Producto", render: (p) => <span className="font-medium">{p.name}</span> },
    { key: "category", header: "Categoría", render: (p) => <Badge variant="secondary">{p.category}</Badge> },
    { key: "price", header: "Precio", render: (p) => `${p.price.toString()} ${p.currency}` },
    { key: "unit", header: "Unidad", render: (p) => p.unit ?? "—" },
    { key: "status", header: "Estado", render: (p) => <Badge variant={p.status === "active" ? "success" : "secondary"}>{p.status}</Badge> },
  ];

  return (
    <DataTable
      columns={columns}
      data={products}
      keyExtractor={(p) => p.id}
      emptyMessage="No hay productos cargados."
    />
  );
}
