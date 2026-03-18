"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const createProductSchema = z.object({
  name: z.string().min(1),
  // Compatibilidad: valores viejos (flores/extractos) y canónicos (plant_material/extract).
  category: z.enum(["flores", "extractos", "accesorios", "plant_material", "extract"]),
  sku: z.string().optional(),
  unit: z.string().optional(),
  price: z.string().min(1),
  currency: z.string().min(1),
  status: z.enum(["active", "inactive"]).default("active"),
  notes: z.string().optional(),
});

async function getTenantContext(): Promise<{ tenantId: string; tenantSlug: string } | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const ctx = (session as unknown as { context?: string }).context;
  const tenantId = (session as unknown as { tenantId?: string }).tenantId;
  const tenantSlug = (session as unknown as { tenantSlug?: string }).tenantSlug;
  if (ctx !== "tenant" || !tenantId || !tenantSlug) return null;
  return { tenantId, tenantSlug };
}

export async function createProduct(input: z.infer<typeof createProductSchema>) {
  try {
    await requirePermission(PERMISSION_KEYS.products_manage);
  } catch {
    return { error: "No tenés permiso para crear productos" };
  }

  const ctx = await getTenantContext();
  if (!ctx) return { error: "No autorizado" };

  const parsed = createProductSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  const data = parsed.data;
  const price = new Prisma.Decimal(data.price);

  const category = (() => {
    if (data.category === "flores") return "plant_material";
    if (data.category === "extractos") return "extract";
    return data.category;
  })();

  const product = await prisma.product.create({
    data: {
      tenantId: ctx.tenantId,
      name: data.name,
      category,
      sku: data.sku || null,
      unit: data.unit || null,
      price,
      currency: data.currency,
      status: data.status,
      notes: data.notes || null,
    },
  });

  revalidatePath(`/app/${ctx.tenantSlug}/products`);
  return { data: product };
}
