/**
 * Permisos RBAC. Keys usados en RolePermission y en guards.
 */
export const PERMISSION_KEYS = {
  // Platform (superadmin)
  tenants_read: "tenants.read",
  tenants_create: "tenants.create",
  tenants_update: "tenants.update",
  tenants_suspend: "tenants.suspend",
  branding_read: "branding.read",
  branding_update: "branding.update",
  // Users
  users_read: "users.read",
  users_create: "users.create",
  users_update: "users.update",
  users_delete: "users.delete",
  // Members
  members_read: "members.read",
  members_create: "members.create",
  members_update: "members.update",
  members_delete: "members.delete",
  // Inventory
  inventory_read: "inventory.read",
  inventory_create: "inventory.create",
  inventory_move: "inventory.move",
  inventory_adjust: "inventory.adjust",
  // Lots
  lots_read: "lots.read",
  lots_create: "lots.create",
  // QR
  qr_generate: "qr.generate",
  qr_resolve: "qr.resolve",
  // Weighings
  weighings_read: "weighings.read",
  weighings_create: "weighings.create",
  scales_manage: "scales.manage",
  // Devices
  devices_read: "devices.read",
  devices_manage: "devices.manage",
  // Reports & tickets
  reports_read: "reports.read",
  tickets_read: "tickets.read",
  tickets_manage: "tickets.manage",
  audit_read: "audit.read",
} as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[keyof typeof PERMISSION_KEYS];

export const PLATFORM_ROLES = ["platform_owner", "platform_admin", "support_agent", "billing_admin"] as const;
export const TENANT_ROLES = ["tenant_admin", "operador", "cultivador", "auditor", "socio"] as const;
