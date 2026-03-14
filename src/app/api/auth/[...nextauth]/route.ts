import "@/lib/env";
import { requireProductionEnv } from "@/lib/env";
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

requireProductionEnv();
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
