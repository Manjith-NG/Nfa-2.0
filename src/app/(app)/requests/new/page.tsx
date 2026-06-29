import { requireUser } from "@/lib/session";
import { RequestForm } from "@/components/requests/request-form";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/rbac";

export default async function NewRequestPage() {
  const user = await requireUser();
  if (!hasPermission(user, "request:create")) {
    redirect("/dashboard");
  }
  return <RequestForm user={user} />;
}
