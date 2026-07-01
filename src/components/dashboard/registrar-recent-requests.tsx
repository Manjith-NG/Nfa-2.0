"use client";

import Link from "next/link";
import { useState } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { UserDetailDrawer } from "@/components/users/user-detail-drawer";
import type { RequestListItem } from "@/types";
import { formatDate } from "@/lib/utils";

export function RegistrarRecentRequests({
  items,
  emptyMessage = "No requests yet",
}: {
  items: RequestListItem[];
  emptyMessage?: string;
}) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  if (items.length === 0) {
    return <p className="py-8 text-center text-slate-500">{emptyMessage}</p>;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="nfa-table w-full">
          <thead className="bg-slate-50">
            <tr>
              <th>Request</th>
              <th>Department</th>
              <th>Raised By</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/80">
                <td>
                  <Link
                    href={`/requests/${r.id}`}
                    className="block font-medium text-nfa-primary hover:underline"
                  >
                    {r.title}
                    <span className="mt-0.5 block text-xs font-normal text-slate-500">
                      {r.requestNumber}
                    </span>
                  </Link>
                </td>
                <td>{r.departmentName}</td>
                <td>
                  {r.raisedById ? (
                    <button
                      type="button"
                      className="font-medium text-nfa-primary hover:underline"
                      onClick={() => setSelectedUserId(r.raisedById!)}
                    >
                      {r.raisedByName}
                    </button>
                  ) : (
                    r.raisedByName
                  )}
                </td>
                <td>
                  <StatusBadge status={r.status} currentRoleCode={r.currentRoleCode} />
                </td>
                <td className="text-slate-500">{formatDate(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UserDetailDrawer userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
    </>
  );
}
