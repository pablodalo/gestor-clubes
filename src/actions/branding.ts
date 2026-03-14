"use server";

import { assertPlatformSession, validateTenantIdExists } from "@/lib/server-context";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/server/audit";
import { z } from "zod";

const updateBrandingSchema = z.object({
  appName: z.string().nullable(),
  shortName: z.string().nullable(),
  primaryColor: z.string().nullable(),
  secondaryColor: z.string().nullable(),
  accentColor: z.string().nullable(),
  backgroundColor: z.string().nullable(),
  fontFamily: z.string().nullable(),
  radiusScale: z.string().nullable(),
  darkModeDefault: z.boolean(),
  loginTitle: z.string().nullable(),
  loginSubtitle: z.string().nullable(),
  portalBannerUrl: z.string().nullable(),
});

export async function updateTenantBranding(
  tenantId: string,
  input: z.infer<typeof updateBrandingSchema>
) {
  let session;
  try {
    session = await assertPlatformSession();
  } catch {
    return { error: "Solo superadmin puede editar branding" };
  }
  const ok = await validateTenantIdExists(tenantId);
  if (!ok) return { error: "Tenant no encontrado" };

  const parsed = updateBrandingSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const data = parsed.data as Record<string, unknown>;
  const branding = await prisma.tenantBranding.upsert({
    where: { tenantId },
    create: { tenantId, ...data },
    update: data,
  });

  await createAuditLog({
    tenantId: null,
    actorType: "platform_user",
    actorId: session.userId,
    action: "branding.update",
    entityName: "TenantBranding",
    entityId: branding.id,
  });

  return { data: branding };
}
