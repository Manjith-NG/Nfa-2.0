import { Suspense } from "react";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { AppShellFallback } from "@/components/layout/app-shell-fallback";

/** Auth + DB pages must not prerender at build time (avoids Supabase pool exhaustion on Render). */
export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AppShellFallback />}>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </Suspense>
  );
}
