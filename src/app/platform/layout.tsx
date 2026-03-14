import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ThemeProvider } from "@/components/theme-provider";
import { PlatformAuthProvider } from "@/components/platform-auth-provider";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/server-log";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let role: string | undefined;
  let permissions: unknown;
  try {
    const session = await getServerSession(authOptions);
    const ctx = (session as unknown as { context?: string })?.context;
    const userId = (session as unknown as { userId?: string })?.userId;
    if (ctx === "platform" && userId) {
      const user = await prisma.platformUser.findUnique({
        where: { id: userId },
        select: { role: true, permissions: true },
      });
      role = user?.role;
      permissions = user?.permissions ?? [];
    }
  } catch (err) {
    logError("PlatformLayout getServerSession", err);
  }
  return (
    <ThemeProvider branding={null}>
      <PlatformAuthProvider role={role} permissions={permissions ?? []}>
        {children}
      </PlatformAuthProvider>
    </ThemeProvider>
  );
}
