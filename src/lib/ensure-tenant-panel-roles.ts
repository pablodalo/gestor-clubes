import { prisma } from "@/lib/prisma";

const PANEL_ROLE_NAMES = ["tenant_admin", "operador", "cultivador"] as const;

const OPERADOR_PERMISSION_KEYS = [
  "members.read", "members.create", "members.update",
  "inventory.read", "inventory.create", "inventory.move", "inventory.adjust",
  "lots.read", "lots.create", "qr.generate", "qr.resolve",
  "weighings.read", "weighings.create", "scales.manage",
  "devices.read", "devices.manage", "reports.read",
  "tickets.read", "tickets.manage",
];

const CULTIVADOR_PERMISSION_KEYS = [
  "lots.read", "lots.create",
  "inventory.read",
  "qr.generate", "qr.resolve",
  "weighings.read", "weighings.create", "scales.manage",
  "devices.read", "reports.read",
];

const ROLE_DESCRIPTIONS: Record<(typeof PANEL_ROLE_NAMES)[number], string> = {
  tenant_admin: "Administrador del club",
  operador: "Operador con acceso a socios, inventario, lotes y tickets",
  cultivador: "Lotes, inventario, QR, pesaje y dispositivos; sin socios ni usuarios",
};

/**
 * Asegura que el tenant tenga los 3 roles de panel (tenant_admin, operador, cultivador).
 * Crea los que falten con sus permisos. Útil para tenants creados antes de tener esta lógica.
 */
export async function ensureTenantPanelRoles(tenantId: string): Promise<void> {
  const existing = await prisma.role.findMany({
    where: { tenantId, name: { in: [...PANEL_ROLE_NAMES] } },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((r) => r.name));
  const missing = PANEL_ROLE_NAMES.filter((n) => !existingNames.has(n));
  if (missing.length === 0) return;

  const permissions = await prisma.permission.findMany({ select: { id: true, key: true } });
  const allPermIds = permissions.map((p) => p.id);
  const operadorPermIds = permissions.filter((p) => OPERADOR_PERMISSION_KEYS.includes(p.key)).map((p) => p.id);
  const cultivadorPermIds = permissions.filter((p) => CULTIVADOR_PERMISSION_KEYS.includes(p.key)).map((p) => p.id);

  for (const name of missing) {
    const role = await prisma.role.create({
      data: {
        tenantId,
        name,
        description: ROLE_DESCRIPTIONS[name],
        isSystem: true,
      },
    });
    const permIds =
      name === "tenant_admin" ? allPermIds : name === "operador" ? operadorPermIds : cultivadorPermIds;
    for (const permissionId of permIds) {
      await prisma.rolePermission.create({ data: { roleId: role.id, permissionId } });
    }
  }
}
