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

  return (
    <NavigationProvider>
      <NavigationProgress />
      <div className="min-h-screen">
        <Sidebar
          roleCode={user.roleCode}
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
        <div
          className={cn(
            "transition-all duration-300",
            collapsed ? "ml-[72px]" : "ml-[var(--sidebar-width)]"
          )}
        >
          <Topbar user={user} />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </NavigationProvider>
  );
}
