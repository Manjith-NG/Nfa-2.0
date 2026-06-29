"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatRelative } from "@/lib/utils";
import { PageSkeleton } from "@/components/ui/page-skeleton";

interface Notification {
  id: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications?limit=50")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setNotifications(d.data.notifications);
          fetch("/api/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ markAll: true }),
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Notifications</h2>
          <p className="text-slate-500">Updates on your requests and approvals</p>
        </div>
        <PageSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Notifications</h2>
        <p className="text-slate-500">Updates on your requests and approvals</p>
      </div>

      <div className="space-y-2">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`nfa-card ${!n.isRead ? "border-l-4 border-l-nfa-primary" : ""}`}
          >
            {n.link ? (
              <Link href={n.link}>
                <p className="font-medium text-slate-900">{n.title}</p>
                <p className="mt-1 text-sm text-slate-600">{n.message}</p>
                <p className="mt-2 text-xs text-slate-400">{formatRelative(n.createdAt)}</p>
              </Link>
            ) : (
              <>
                <p className="font-medium">{n.title}</p>
                <p className="text-sm text-slate-600">{n.message}</p>
              </>
            )}
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="nfa-card py-12 text-center text-slate-500">No notifications</div>
        )}
      </div>
    </div>
  );
}
