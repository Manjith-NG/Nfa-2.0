import { requireUser } from "@/lib/session";
import { AppShell } from "@/components/layout/app-shell";

export async function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <AppShell user={user}>{children}</AppShell>;
}
