"use server";

import { assertPlatformSession, validateTenantIdExists } from "@/lib/server-context";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/server/audit";
import { z } from "zod";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const updateBrandingSchema = z.object({
  appName: z.string().nullable(),
  shortName: z.string().nullable(),
  logoUrl: z.string().nullable().or(z.literal("")),
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
  navigationLayout: z.enum(["horizontal", "vertical"]).nullable(),
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

  const parsed = updateBrandingSchema.safeParse({
    ...input,
    logoUrl: input.logoUrl === "" ? null : input.logoUrl,
  });
  if (!parsed.success) return { error: "Datos inválidos" };

  try {
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
      actorName: session.name ?? undefined,
      action: "branding.update",
      entityName: "TenantBranding",
      entityId: branding.id,
    });

    return { data: branding };
  } catch (err) {
    console.error("updateTenantBranding", err);
    return { error: "Error al guardar. Revisá los datos e intentá de nuevo." };
  }
}

/** Sube una imagen de logo y devuelve la URL pública (ruta /uploads/...). Solo platform. */
export async function uploadLogo(tenantId: string, formData: FormData): Promise<{ data?: { url: string }; error?: string }> {
  try {
    await assertPlatformSession();
  } catch {
    return { error: "No autorizado" };
  }
  const ok = await validateTenantIdExists(tenantId);
  if (!ok) return { error: "Tenant no encontrado" };

  const file = formData.get("file") as File | null;
  if (!file || !file.size || !file.type.startsWith("image/")) {
    return { error: "Seleccioná una imagen válida (PNG, JPG, etc.)" };
  }
  const maxSize = 2 * 1024 * 1024; // 2 MB
  if (file.size > maxSize) return { error: "La imagen no debe superar 2 MB" };

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  if (!["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
    return { error: "Formato no permitido. Usá PNG, JPG, GIF, WebP o SVG." };
  }

  try {
    // Fallback compatible con el entorno actual: guardar en /public/uploads.
    // Si más adelante se configura Vercel Blob, se puede reintroducir sin bloquear el build.
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const filename = `logo-${tenantId}-${Date.now()}.${ext}`;
    const filepath = path.join(dir, filename);
    await writeFile(filepath, Buffer.from(await file.arrayBuffer()));
    return { data: { url: `/uploads/${filename}` } };
  } catch (err) {
    console.error("uploadLogo", err);
    return { error: "Error al guardar la imagen" };
  }
}
