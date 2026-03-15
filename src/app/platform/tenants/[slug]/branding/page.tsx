import { redirect } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

/** Redirige a la página del tenant (branding está integrado ahí). */
export default async function TenantBrandingRedirect({ params }: Props) {
  const { slug } = await params;
  redirect(`/platform/tenants/${slug}`);
}
