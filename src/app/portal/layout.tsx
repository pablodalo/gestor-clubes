import { PortalAuthProvider } from "@/components/portal-auth-provider";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalAuthProvider>{children}</PortalAuthProvider>;
}
