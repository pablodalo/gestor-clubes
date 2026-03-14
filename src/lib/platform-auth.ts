import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformOwner, PLATFORM_PERMISSION_KEYS } from "@/config/platform-permissions";

export type PlatformAuthResult = {
  userId: string;
  role: string;
  permissions: string[];
  canAccessAudit: boolean;
  canAccessErrors: boolean;
  canAccessUsers: boolean;
} | null;

export async function getPlatformAuth(): Promise<PlatformAuthResult> {
  const session = await getServerSession(authOptions);
  const ctx = (session as unknown as { context?: string })?.context;
  const userId = (session as unknown as { userId?: string })?.userId;
  if (ctx !== "platform" || !userId) return null;

  const user = await prisma.platformUser.findUnique({
    where: { id: userId },
    select: { id: true, role: true, permissions: true },
  });
  if (!user) return null;

  const permissions = Array.isArray(user.permissions) ? (user.permissions as string[]) : [];
  const owner = isPlatformOwner(user.role);
  return {
    userId: user.id,
    role: user.role,
    permissions,
    canAccessAudit: owner || permissions.includes(PLATFORM_PERMISSION_KEYS.audit_read),
    canAccessErrors: owner || permissions.includes(PLATFORM_PERMISSION_KEYS.errors_read),
    canAccessUsers: owner,
  };
}

export async function requirePlatformOwner(): Promise<PlatformAuthResult> {
  const auth = await getPlatformAuth();
  if (!auth || !auth.canAccessUsers) return null;
  return auth;
}
