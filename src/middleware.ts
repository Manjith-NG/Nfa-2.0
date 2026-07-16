import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/requests/:path*",
    "/approvals/:path*",
    "/analytics/:path*",
    "/reports/:path*",
    "/authorities/:path*",
    "/flow-control/:path*",
    "/clubs/:path*",
    "/notifications/:path*",
    "/audit-logs/:path*",
    "/users/:path*",
    "/settings/:path*",
    "/department/:path*",
    "/faculty/:path*",
  ],
};
