"use client";

import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FilePlus,
  Files,
  Bell,
  CheckSquare,
  Building2,
  Users,
  Inbox,
  History,
  BarChart3,
  FileText,
  UserCog,
  Shield,
  Settings,
  GitBranch,
  ChevronLeft,
  GraduationCap,
} from "lucide-react";
import { NavLink } from "@/components/layout/nav-link";
import { cn } from "@/lib/utils";
import { NAV_BY_ROLE, APP_NAME, APP_FULL_NAME, SETTINGS_NAV_ITEM } from "@/lib/constants";
import { isNavItemActive } from "@/lib/nav-utils";
import type { RoleCode } from "@prisma/client";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  FilePlus,
  Files,
  Bell,
  CheckSquare,
  Building2,
  Users,
  Inbox,
  History,
  BarChart3,
  FileText,
  UserCog,
  Shield,
  Settings,
  GitBranch,
};

export function Sidebar({
  roleCode,
  collapsed,
  onToggle,
}: {
  roleCode: RoleCode;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const pathname = usePathname();
  const nav = [
    ...(NAV_BY_ROLE[roleCode] ?? NAV_BY_ROLE.FACULTY),
    ...(NAV_BY_ROLE[roleCode]?.some((item) => item.href === SETTINGS_NAV_ITEM.href)
      ? []
      : [SETTINGS_NAV_ITEM]),
  ];
  const navHrefs = nav.map((item) => item.href);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-nfa-border bg-white transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[var(--sidebar-width)]"
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-nfa-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-nfa-primary text-white">
          <GraduationCap className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-nfa-primary">{APP_NAME}</p>
            <p className="truncate text-[10px] text-slate-500 leading-tight">
              {APP_FULL_NAME}
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {nav.map((item) => {
          const Icon = iconMap[item.icon] ?? LayoutDashboard;
          const active = isNavItemActive(pathname, item.href, navHrefs);

          return (
            <NavLink
              key={item.href}
              href={item.href}
              active={active}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-nfa-primary text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {onToggle && (
        <button
          type="button"
          onClick={onToggle}
          className="m-3 flex items-center justify-center rounded-lg border border-nfa-border p-2 text-slate-500 hover:bg-slate-50"
        >
          <ChevronLeft
            className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")}
          />
        </button>
      )}
    </aside>
  );
}
