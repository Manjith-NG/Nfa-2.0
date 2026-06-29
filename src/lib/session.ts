import { cache } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { SessionUser } from "@/types";
import { redirect } from "next/navigation";

export const getSession = cache(async () => {
  return getServerSession(authOptions);
});

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await getSession();
  if (!session?.user) return null;
  return session.user as SessionUser;
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(allowed: string[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!allowed.includes(user.roleCode)) {
    redirect("/dashboard");
  }
  return user;
}
