import { Suspense } from "react";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { AppShellFallback } from "@/components/layout/app-shell-fallback";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AppShellFallback />}>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </Suspense>
  );
}
