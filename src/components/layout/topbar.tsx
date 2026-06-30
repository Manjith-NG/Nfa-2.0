"use client";

import { useEffect, useState } from "react";
import { Bell, LogOut, User, Loader2, Menu, X } from "lucide-react";
import Link from "next/link";
import type { SessionUser } from "@/types";
import { ROLE_LABELS, UNIVERSITY_NAME } from "@/lib/constants";
import { signOutUser } from "@/lib/auth-client";

export function Topbar({
  user,
  onMenuClick,
  menuOpen = false,
}: {
  user: SessionUser;
  onMenuClick?: () => void;
  menuOpen?: boolean;
}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    fetch("/api/notifications?limit=1")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setUnreadCount(d.data.unreadCount ?? 0);
      })
      .catch(() => undefined);
  }, []);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);

    try {
      await signOutUser();
    } catch {
      // Always redirect — fallback route clears cookies server-side
    }

    window.location.href = "/login";
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-nfa-border bg-white/95 px-4 backdrop-blur sm:h-16 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        )}
        <div className="min-w-0">
          <p className="truncate text-[10px] font-medium uppercase tracking-wider text-slate-400 sm:text-xs">
            {UNIVERSITY_NAME}
          </p>
          <h1 className="truncate text-base font-semibold text-slate-900 sm:text-lg">
            {ROLE_LABELS[user.roleCode]} Portal
          </h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <Link
          href="/notifications"
          prefetch={true}
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-2 border-l border-nfa-border pl-2 sm:gap-3 sm:pl-4">
          <Link
            href="/settings"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
            aria-label="Account settings"
          >
            <User className="h-5 w-5" />
          </Link>
          <div className="hidden text-right md:block">
            <Link href="/settings" className="block hover:text-nfa-primary">
              <p className="text-sm font-medium text-slate-900">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-slate-500">
                {user.departmentName ?? user.roleName}
              </p>
            </Link>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            title="Sign out"
            aria-label="Sign out"
          >
            {signingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
