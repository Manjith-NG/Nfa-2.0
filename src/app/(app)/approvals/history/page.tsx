"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { RequestReviewLink } from "@/components/requests/request-review-link";
import type { RequestListItem } from "@/types";

export default function ApprovalHistoryPage() {
  const [items, setItems] = useState<RequestListItem[]>([]);

  useEffect(() => {
    fetch("/api/requests?limit=50")
      .then((r) => r.json())
      .then((d) => d.success && setItems(d.data.items));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Approval History</h2>
        <p className="text-slate-500">Previously processed requests</p>
      </div>
      <div className="nfa-card overflow-hidden p-0">
        <table className="nfa-table w-full">
          <thead className="bg-slate-50">
            <tr>
              <th>Request</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id}>
                <td>
                  <p className="font-medium">{r.title}</p>
                  <p className="text-xs text-slate-500">{r.requestNumber}</p>
                </td>
                <td>
                  <StatusBadge status={r.status} currentRoleCode={r.currentRoleCode} />
                </td>
                <td>
                  <RequestReviewLink requestId={r.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
