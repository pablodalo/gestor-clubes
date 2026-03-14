"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

type Props = {
  search?: string;
  onSearchChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  children?: React.ReactNode;
};

export function TableToolbar({
  search,
  onSearchChange,
  placeholder = "Buscar...",
  className,
  children,
}: Props) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      {(onSearchChange != null || search != null) && (
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={placeholder}
            value={search ?? ""}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      )}
      {children}
    </div>
  );
}
