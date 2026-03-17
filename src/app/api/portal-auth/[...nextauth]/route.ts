import "@/lib/env";
import { requireProductionEnv } from "@/lib/env";
import NextAuth from "next-auth";
import { portalAuthOptions } from "@/lib/auth";

requireProductionEnv();
const handler = NextAuth(portalAuthOptions);

export { handler as GET, handler as POST };

