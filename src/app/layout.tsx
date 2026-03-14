import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

/** Evita pre-render en build: las páginas que usan Prisma se generan en runtime (no requiere DB en build). */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gestor Clubes",
  description: "SaaS multi-tenant para gestión de clubes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
