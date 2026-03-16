import { getTenantBranding } from "@/lib/branding";
import { TenantLoginForm } from "@/features/auth/tenant-login-form";
import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant";

type Props = { params: Promise<{ tenantSlug: string }> };

export default async function TenantLoginPage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) notFound();

  const branding = await getTenantBranding(tenantSlug, "slug");

  return (
    <TenantLoginForm
      tenantSlug={tenantSlug}
      logoUrl={branding.logoUrl}
      appName={branding.appName}
      loginTitle={branding.loginTitle}
      loginSubtitle={branding.loginSubtitle}
    />
  );
}
