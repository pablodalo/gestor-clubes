"use client";

import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useThemeToggle } from "@/components/theme-context";

type Props = { className?: string };

export function ThemeToggle({ className }: Props) {
  const ctx = useThemeToggle();
  if (!ctx) return null;

  const isDark = ctx.theme === "dark";
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className}
      onClick={() => ctx.setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Usar modo claro" : "Usar modo oscuro"}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
