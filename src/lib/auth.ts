import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authenticateUser } from "@/lib/services/auth-service";
import type { SessionUser } from "@/types";
import type { RoleCode } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        // Authenticate only — do not bootstrap/migrate here (that timed out on Render).
        return authenticateUser(credentials.email, credentials.password);
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.roleCode = (user as { roleCode: RoleCode }).roleCode;
        token.roleName = (user as { roleName: string }).roleName;
        token.employeeId = (user as { employeeId: string }).employeeId;
        token.firstName = (user as { firstName: string }).firstName;
        token.lastName = (user as { lastName: string }).lastName;
        token.departmentId = (user as { departmentId: string | null }).departmentId;
        token.departmentCode = (user as { departmentCode: string | null }).departmentCode;
        token.departmentName = (user as { departmentName: string | null }).departmentName;
        token.designationName = (user as { designationName: string | null }).designationName;
        token.positionName = (user as { positionName: string | null }).positionName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user = {
          id: token.id as string,
          email: token.email as string,
          employeeId: token.employeeId as string,
          firstName: token.firstName as string,
          lastName: token.lastName as string,
          roleCode: token.roleCode as RoleCode,
          roleName: token.roleName as string,
          departmentId: (token.departmentId as string | null) ?? null,
          departmentCode: (token.departmentCode as string | null) ?? null,
          departmentName: (token.departmentName as string | null) ?? null,
          designationName: (token.designationName as string | null) ?? null,
          positionName: (token.positionName as string | null) ?? null,
        } as SessionUser & { email?: string; name?: string };
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

declare module "next-auth" {
  interface User {
    roleCode: RoleCode;
    roleName: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    departmentId: string | null;
    departmentCode: string | null;
    departmentName: string | null;
    designationName: string | null;
    positionName: string | null;
  }
  interface Session {
    user: SessionUser & { email?: string; name?: string };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    roleCode: RoleCode;
    roleName: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    departmentId: string | null;
    departmentCode: string | null;
    departmentName: string | null;
    designationName: string | null;
    positionName: string | null;
  }
}

