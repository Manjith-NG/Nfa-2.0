"use client";

import { usePathname } from "next/navigation";
import { NavLink } from "@/components/layout/nav-link";
import { SUB_NAV_BY_ROLE } from "@/lib/constants";
import { isNavItemActive } from "@/lib/nav-utils";
import { cn } from "@/lib/utils";
import type { RoleCode } from "@prisma/client";

export function SubNavBar({ roleCode }: { roleCode: RoleCode }) {
  const pathname = usePathname();
  const items = SUB_NAV_BY_ROLE[roleCode];

  if (!items?.length) return null;

  const hrefs = items.map((item) => item.href);

  return (
    <nav
      className="border-b border-nfa-border bg-slate-50/80 px-6 shadow-sm"
      aria-label="Administration"
    >
      <div className="flex items-center gap-1 overflow-x-auto py-2.5">
        <span className="mr-3 shrink-0 rounded-md bg-nfa-primary/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-nfa-primary">
          Administration
        </span>
        {items.map((item) => {
          const active = isNavItemActive(pathname, item.href, hrefs);
          return (
            <NavLink
              key={item.href}
              href={item.href}
              active={active}
              className={cn(
                "shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-white text-nfa-primary shadow-sm ring-1 ring-nfa-border"
                  : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
              )}
            >
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
