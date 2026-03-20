"use server";

import { revalidatePath } from "next/cache";
import { assertTenantSession } from "@/lib/server-context";
import { getMemberAndTenantFromSession } from "@/lib/portal-session";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/server/audit";
import { requirePermission } from "@/lib/rbac";
import { PERMISSION_KEYS } from "@/config/permissions";
import { z } from "zod";

const createTicketSchema = z.object({
  subject: z.string().min(1, "Asunto requerido"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export async function createTicket(input: CreateTicketInput) {
  try {
    await requirePermission(PERMISSION_KEYS.tickets_manage);
  } catch {
    return { error: "No tenés permiso para crear tickets" };
  }
  let ctx;
  try {
    ctx = await assertTenantSession();
  } catch {
    return { error: "No autorizado" };
  }

  const parsed = createTicketSchema.safeParse(input);
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return { error: msg ?? "Datos inválidos" };
  }

  const ticket = await prisma.ticket.create({
    data: {
      tenantId: ctx.tenantId,
      createdByType: "user",
      createdById: ctx.userId,
      subject: parsed.data.subject,
      description: parsed.data.description ?? null,
      priority: parsed.data.priority,
      status: "open",
    },
  });

  await createAuditLog({
    tenantId: ctx.tenantId,
    actorType: "user",
    actorId: ctx.userId,
      actorName: ctx.name ?? undefined,
    action: "ticket.create",
    entityName: "Ticket",
    entityId: ticket.id,
    origin: "actions/tickets",
  });

  revalidatePath(`/app/${ctx.tenantSlug}/tickets`);
  return { data: ticket };
}

const createTicketForMemberSchema = z.object({
  subject: z.string().min(1, "Asunto requerido"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

export async function createTicketForMember(
  tenantSlug: string,
  input: z.infer<typeof createTicketForMemberSchema>
) {
  const session = await getMemberAndTenantFromSession(tenantSlug);
  if (!session) return { error: "No autorizado" };

  const parsed = createTicketForMemberSchema.safeParse(input);
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return { error: msg ?? "Datos inválidos" };
  }

  const ticket = await prisma.ticket.create({
    data: {
      tenantId: session.tenant.id,
      createdByType: "member",
      createdById: session.member.id,
      subject: parsed.data.subject,
      description: parsed.data.description ?? null,
      priority: parsed.data.priority,
      status: "open",
    },
  });

  await createAuditLog({
    tenantId: session.tenant.id,
    actorType: "member",
    actorId: session.member.id,
    actorName: `${session.member.firstName} ${session.member.lastName}`.trim() || undefined,
    action: "ticket.create",
    entityName: "Ticket",
    entityId: ticket.id,
    origin: "actions/tickets",
  });

  revalidatePath(`/portal/socios/${tenantSlug}`);
  revalidatePath(`/portal/socios/${tenantSlug}/tickets`);
  return { data: ticket };
}

const updateTicketStatusSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
});

export async function updateTicketStatus(ticketId: string, status: string) {
  try {
    await requirePermission(PERMISSION_KEYS.tickets_manage);
  } catch {
    return { error: "No tenés permiso para actualizar tickets" };
  }
  let ctx;
  try {
    ctx = await assertTenantSession();
  } catch {
    return { error: "No autorizado" };
  }

  const parsed = updateTicketStatusSchema.safeParse({ status });
  if (!parsed.success) return { error: "Estado inválido" };

  const existing = await prisma.ticket.findFirst({
    where: { id: ticketId, tenantId: ctx.tenantId },
  });
  if (!existing) return { error: "Ticket no encontrado" };

  await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: parsed.data.status },
  });

  revalidatePath(`/app/${ctx.tenantSlug}/tickets`);
  return { ok: true };
}
