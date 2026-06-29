"use client";

import { useEffect, useState } from "react";
import { Bell, LogOut, User, Loader2 } from "lucide-react";
import Link from "next/link";
import type { SessionUser } from "@/types";
import { ROLE_LABELS, UNIVERSITY_NAME } from "@/lib/constants";
import { signOutUser } from "@/lib/auth-client";

export function Topbar({ user }: { user: SessionUser }) {
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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-nfa-border bg-white/95 px-6 backdrop-blur">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {UNIVERSITY_NAME}
        </p>
        <h1 className="text-lg font-semibold text-slate-900">
          {ROLE_LABELS[user.roleCode]} Portal
        </h1>
      </div>

      <div className="flex items-center gap-4">
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

        <div className="flex items-center gap-3 border-l border-nfa-border pl-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-nfa-primary/10 text-nfa-primary">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden text-right sm:block">
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
