import { prisma } from "@/lib/prisma";

type AuditParams = {
  tenantId: string | null;
  actorType: "platform_user" | "user" | "member";
  actorId: string;
  action: string;
  entityName: string;
  entityId?: string | null;
  beforeJson?: string | null;
  afterJson?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  origin?: string | null;
};

export async function createAuditLog(params: AuditParams): Promise<void> {
  await prisma.auditLog.create({
    data: {
      tenantId: params.tenantId,
      actorType: params.actorType,
      actorId: params.actorId,
      action: params.action,
      entityName: params.entityName,
      entityId: params.entityId,
      beforeJson: params.beforeJson,
      afterJson: params.afterJson,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      origin: params.origin,
    },
  });
}
