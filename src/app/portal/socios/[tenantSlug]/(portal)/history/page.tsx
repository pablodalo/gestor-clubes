import { redirect } from "next/navigation";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function PortalHistoryRedirect({ params }: Props) {
  const { tenantSlug } = await params;
  redirect(`/portal/socios/${tenantSlug}/movements`);
}
