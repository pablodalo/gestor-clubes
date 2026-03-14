import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const pathname = req.nextUrl.pathname;
      if (pathname.startsWith("/platform") && !pathname.startsWith("/platform/login")) {
        return token?.context === "platform";
      }
      return true;
    },
  },
  pages: { signIn: "/platform/login" },
});

export const config = {
  matcher: ["/platform/:path*"],
};
