/**
 * Permisos para usuarios de la plataforma (superadmin).
 * platform_owner ve todo; el resto solo ve Tenants y lo que tenga en permissions.
 */
export const PLATFORM_PERMISSION_KEYS = {
  audit_read: "audit.read",
  errors_read: "errors.read",
} as const;

export type PlatformPermissionKey = (typeof PLATFORM_PERMISSION_KEYS)[keyof typeof PLATFORM_PERMISSION_KEYS];

export const PLATFORM_OWNER_ROLE = "platform_owner";

export function isPlatformOwner(role: string | undefined): boolean {
  return role === PLATFORM_OWNER_ROLE;
}
