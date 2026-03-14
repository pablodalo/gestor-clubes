import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PlatformShell } from "@/components/platform-shell";
import { ErrorLogList } from "@/features/error-log/error-log-list";

export const dynamic = "force-dynamic";

export default async function PlatformErrorsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");
  const ctx = (session as unknown as { context?: string }).context;
  if (ctx !== "platform") redirect("/platform");

  const { getPlatformAuth } = await import("@/lib/platform-auth");
  const auth = await getPlatformAuth();
  if (!auth?.canAccessErrors) redirect("/platform");

  const logs = await prisma.errorLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <PlatformShell>
      <ErrorLogList initialLogs={logs} />
    </PlatformShell>
  );
}
