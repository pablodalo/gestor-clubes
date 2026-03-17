"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { usePathname } from "next/navigation";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const pathname = usePathname();
  const isPortal = typeof pathname === "string" && pathname.startsWith("/portal/socios");
  return (
    <SessionProvider basePath={isPortal ? "/api/portal-auth" : "/api/auth"}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider branding={null}>
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
