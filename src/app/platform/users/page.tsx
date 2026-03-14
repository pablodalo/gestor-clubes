import { redirect } from "next/navigation";
import { PlatformShell } from "@/components/platform-shell";
import { requirePlatformOwner } from "@/lib/platform-auth";
import { getPlatformUsersList } from "@/actions/platform-users";
import { PlatformUsersTable } from "@/features/platform-users/platform-users-table";

export default async function PlatformUsersPage() {
  const auth = await requirePlatformOwner();
  if (!auth) redirect("/platform");

  const users = await getPlatformUsersList();

  return (
    <PlatformShell>
      <PlatformUsersTable users={users} />
    </PlatformShell>
  );
}
