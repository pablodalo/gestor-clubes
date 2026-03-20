import { redirect } from "next/navigation";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function PortalMembershipRedirect({ params }: Props) {
  const { tenantSlug } = await params;
  redirect(`/portal/socios/${tenantSlug}`);
}
