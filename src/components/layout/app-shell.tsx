"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import {
  NavigationProvider,
  NavigationProgress,
} from "@/components/layout/navigation-context";
import type { SessionUser } from "@/types";
import { cn } from "@/lib/utils";

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <NavigationProvider>
      <NavigationProgress />
      <div className="min-h-screen">
        {mobileOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-900/50 md:hidden"
            aria-label="Close menu"
            onClick={closeMobile}
          />
        )}

        <Sidebar
          roleCode={user.roleCode}
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          mobileOpen={mobileOpen}
          onNavigate={closeMobile}
        />

        <div
          className={cn(
            "transition-all duration-300",
            "ml-0 md:ml-[var(--sidebar-width)]",
            collapsed && "md:ml-[76px]"
          )}
        >
          <Topbar
            user={user}
            onMenuClick={() => setMobileOpen((open) => !open)}
            menuOpen={mobileOpen}
          />
          <main className="p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </NavigationProvider>
  );
}
