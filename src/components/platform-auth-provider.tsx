"use client";

import * as React from "react";
import {
  isPlatformOwner,
  PLATFORM_PERMISSION_KEYS,
  type PlatformPermissionKey,
} from "@/config/platform-permissions";

type PlatformAuthContextValue = {
  role: string | undefined;
  permissions: PlatformPermissionKey[];
  canAccessAudit: boolean;
  canAccessErrors: boolean;
  canAccessUsers: boolean;
};

const PlatformAuthContext = React.createContext<PlatformAuthContextValue | null>(null);

export function usePlatformAuth() {
  return React.useContext(PlatformAuthContext);
}

function parsePermissions(permissions: unknown): PlatformPermissionKey[] {
  if (!Array.isArray(permissions)) return [];
  const keys = Object.values(PLATFORM_PERMISSION_KEYS);
  return permissions.filter((p): p is PlatformPermissionKey => typeof p === "string" && keys.includes(p as PlatformPermissionKey));
}

type Props = {
  children: React.ReactNode;
  role: string | undefined;
  permissions: unknown;
};

export function PlatformAuthProvider({ children, role, permissions: raw }: Props) {
  const permissions = React.useMemo(() => parsePermissions(raw), [raw]);
  const value = React.useMemo(() => {
    const owner = isPlatformOwner(role);
    return {
      role,
      permissions,
      canAccessAudit: owner || permissions.includes(PLATFORM_PERMISSION_KEYS.audit_read),
      canAccessErrors: owner || permissions.includes(PLATFORM_PERMISSION_KEYS.errors_read),
      canAccessUsers: owner,
    };
  }, [role, permissions]);

  return (
    <PlatformAuthContext.Provider value={value}>
      {children}
    </PlatformAuthContext.Provider>
  );
}
