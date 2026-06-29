import { requireUser } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { redirect } from "next/navigation";

export default async function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  if (!hasPermission(user, "users:manage")) {
    redirect("/dashboard");
  }
  return children;
}
