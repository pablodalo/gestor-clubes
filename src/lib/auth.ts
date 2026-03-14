import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type AuthContext = "platform" | "tenant" | "member";

declare module "next-auth" {
  interface Session {
    context: AuthContext;
    userId: string;
    tenantId?: string;
    tenantSlug?: string;
    role?: string;
    email: string;
    name: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    context: AuthContext;
    userId: string;
    tenantId?: string;
    tenantSlug?: string;
    role?: string;
  }
}

async function updateLastLogin(
  context: AuthContext,
  userId: string,
  tenantId?: string
): Promise<void> {
  if (context === "platform") {
    await prisma.platformUser.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }
  if (context === "tenant" && tenantId) {
    await prisma.user.updateMany({
      where: { id: userId, tenantId },
      data: { lastLoginAt: new Date() },
    });
  }
  if (context === "member") {
    await prisma.memberAccount.updateMany({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.context = (user as { context?: AuthContext }).context ?? "platform";
        token.userId = (user as { userId?: string }).userId ?? (user.id as string);
        token.tenantId = (user as { tenantId?: string }).tenantId;
        token.tenantSlug = (user as { tenantSlug?: string }).tenantSlug;
        token.role = (user as { role?: string }).role;
        token.email = user.email ?? "";
        token.name = user.name ?? "";
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session as unknown as { context: AuthContext }).context = (token.context as AuthContext) ?? "platform";
        (session as unknown as { userId: string }).userId = token.userId ?? "";
        (session as unknown as { tenantId?: string }).tenantId = token.tenantId;
        (session as unknown as { tenantSlug?: string }).tenantSlug = token.tenantSlug;
        (session as unknown as { role?: string }).role = token.role;
      }
      return session;
    },
  },
  providers: [
    CredentialsProvider({
      id: "platform",
      name: "Platform",
      credentials: { email: { label: "Email" }, password: { label: "Password" } },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.platformUser.findUnique({
          where: { email: credentials.email, status: "active" },
        });
        if (!user || !(await compare(credentials.password, user.passwordHash))) return null;
        await updateLastLogin("platform", user.id);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          context: "platform" as AuthContext,
          userId: user.id,
          role: user.role,
        };
      },
    }),
    CredentialsProvider({
      id: "tenant",
      name: "Tenant",
      credentials: {
        email: { label: "Email" },
        password: { label: "Password" },
        tenantSlug: { label: "Tenant" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.tenantSlug) return null;
        const tenant = await prisma.tenant.findFirst({
          where: { slug: credentials.tenantSlug, status: "active" },
        });
        if (!tenant) return null;
        const user = await prisma.user.findFirst({
          where: { tenantId: tenant.id, email: credentials.email, status: "active" },
          include: { role: true },
        });
        if (!user || !(await compare(credentials.password, user.passwordHash))) return null;
        await updateLastLogin("tenant", user.id, tenant.id);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          context: "tenant" as AuthContext,
          userId: user.id,
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          role: user.role.name,
        };
      },
    }),
    CredentialsProvider({
      id: "member",
      name: "Member",
      credentials: {
        email: { label: "Email" },
        password: { label: "Password" },
        tenantSlug: { label: "Tenant" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.tenantSlug) return null;
        const tenant = await prisma.tenant.findFirst({
          where: { slug: credentials.tenantSlug, status: "active" },
        });
        if (!tenant) return null;
        const member = await prisma.member.findFirst({
          where: { tenantId: tenant.id, email: credentials.email, status: "active" },
          include: { account: true },
        });
        if (!member?.account || !(await compare(credentials.password, member.account.passwordHash)))
          return null;
        await updateLastLogin("member", member.account.id);
        return {
          id: member.account.id,
          email: member.account.email,
          name: `${member.firstName} ${member.lastName}`,
          context: "member" as AuthContext,
          userId: member.account.id,
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          role: "socio",
        };
      },
    }),
  ],
};
