"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/platform", label: "Dashboard" },
  { href: "/platform/tenants", label: "Tenants" },
];

export function PlatformShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 shadow-sm">
        <div className="container flex h-14 max-w-6xl mx-auto items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link href="/platform" className="flex items-center gap-2 text-foreground font-semibold">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm">
                GC
              </span>
              <span className="hidden sm:inline">Gestor Clubes</span>
            </Link>
            <nav className="flex items-center gap-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    pathname === item.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Salir
          </Button>
        </div>
      </header>
      <main className="flex-1 container max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
