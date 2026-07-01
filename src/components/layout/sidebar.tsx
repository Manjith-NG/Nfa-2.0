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
  ClipboardList,
} from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
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
  ClipboardList,
};

export function Sidebar({
  roleCode,
  collapsed,
  onToggle,
  mobileOpen = false,
  onNavigate,
}: {
  roleCode: RoleCode;
  collapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const nav = [
    ...(NAV_BY_ROLE[roleCode] ?? NAV_BY_ROLE.FACULTY),
    ...(NAV_BY_ROLE[roleCode]?.some((item) => item.href === SETTINGS_NAV_ITEM.href)
      ? []
      : [SETTINGS_NAV_ITEM]),
  ];
  const navHrefs = nav.map((item) => item.href);
  const isCollapsedView = Boolean(collapsed && !mobileOpen);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-nfa-border bg-white transition-all duration-300",
        isCollapsedView ? "md:w-[72px]" : "w-[var(--sidebar-width)]",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-nfa-border",
          isCollapsedView ? "justify-center px-2" : "gap-3 px-4"
        )}
      >
        <BrandLogo size={isCollapsedView ? 32 : 36} priority />
        {!isCollapsedView && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-nfa-primary">{APP_NAME}</p>
            <p className="truncate text-[10px] leading-tight text-slate-500">{APP_FULL_NAME}</p>
          </div>
        )}
      </div>

      <nav
        className={cn(
          "flex flex-1 flex-col overflow-y-auto",
          isCollapsedView ? "items-center gap-1 px-2 py-3" : "gap-0.5 p-3"
        )}
      >
        {nav.map((item) => {
          const Icon = iconMap[item.icon] ?? LayoutDashboard;
          const active = isNavItemActive(pathname, item.href, navHrefs);

          return (
            <div key={item.href} className={cn("w-full", isCollapsedView && "flex justify-center")}>
              {item.sectionLabel && (
                <div
                  className={cn(
                    isCollapsedView
                      ? "my-2 w-full border-t border-nfa-border pt-2"
                      : "mb-2 mt-4 px-3"
                  )}
                >
                  {!isCollapsedView && (
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {item.sectionLabel}
                    </p>
                  )}
                </div>
              )}
              <NavLink
                href={item.href}
                active={active}
                onClick={onNavigate}
                className={cn(
                  "flex items-center rounded-lg text-sm font-medium transition-colors",
                  isCollapsedView
                    ? "h-10 w-10 justify-center p-0"
                    : "w-full gap-3 px-3 py-2.5",
                  active
                    ? "bg-nfa-primary text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
                title={isCollapsedView ? item.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!isCollapsedView && <span className="truncate">{item.label}</span>}
              </NavLink>
            </div>
          );
        })}
      </nav>

      {onToggle && (
        <div className={cn("shrink-0 pb-3", isCollapsedView ? "flex justify-center px-2" : "px-3")}>
          <button
            type="button"
            onClick={onToggle}
            className={cn(
              "hidden items-center justify-center rounded-lg border border-nfa-border text-slate-500 transition-colors hover:bg-slate-50 md:flex",
              isCollapsedView ? "h-10 w-10" : "w-full p-2"
            )}
            aria-label={isCollapsedView ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              className={cn("h-4 w-4 transition-transform", isCollapsedView && "rotate-180")}
            />
          </button>
        </div>
      )}
    </aside>
  );
}
