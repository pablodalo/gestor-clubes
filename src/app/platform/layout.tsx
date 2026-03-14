import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ThemeProvider } from "@/components/theme-provider";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const isLoginPage = false; // we'll check path in children

  return (
    <ThemeProvider branding={null}>
      {children}
    </ThemeProvider>
  );
}
