"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { PortalMemberProfileForm } from "@/features/portal/portal-member-profile-form";

type Props = {
  tenantSlug: string;
  member: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    stateOrProvince: string;
    country: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
  };
};

export function PortalProfileClient({ tenantSlug, member }: Props) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setEditOpen(true)}
        className="shrink-0"
      >
        <Pencil className="h-4 w-4 mr-1.5" />
        Editar perfil
      </Button>
      <PortalMemberProfileForm
        tenantSlug={tenantSlug}
        initial={member}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
