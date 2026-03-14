import { getTenantBySlug } from "@/lib/tenant";
import { getTenantBranding } from "@/lib/branding";
import { ThemeProvider } from "@/components/theme-provider";
import { notFound } from "next/navigation";

type Props = {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>;
};

export default async function TenantAppLayout({ children, params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) notFound();

  const branding = await getTenantBranding(tenantSlug, "slug");

  return <ThemeProvider branding={branding}>{children}</ThemeProvider>;
}
