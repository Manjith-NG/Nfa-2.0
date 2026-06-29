import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import type { RequestListItem } from "@/types";
import { formatDate } from "@/lib/utils";

export function RequestsTable({ items }: { items: RequestListItem[] }) {
  if (items.length === 0) {
    return <p className="py-12 text-center text-slate-500">No requests found.</p>;
  }

  return (
    <div className="overflow-x-auto p-4">
      <table className="nfa-table w-full">
      <thead className="bg-slate-50">
        <tr>
          <th>Request</th>
          <th>Department</th>
          <th>Club</th>
          <th>Category</th>
          <th>Status</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        {items.map((r) => (
          <tr key={r.id}>
            <td>
              <Link
                href={`/requests/${r.id}`}
                className="font-medium text-nfa-primary hover:underline"
              >
                {r.title}
              </Link>
              <p className="text-xs text-slate-500">{r.requestNumber}</p>
            </td>
            <td>{r.departmentName}</td>
            <td>{r.clubName ?? "—"}</td>
            <td>{r.category}</td>
            <td>
              <StatusBadge status={r.status} currentRoleCode={r.currentRoleCode} />
            </td>
            <td className="text-slate-500">{formatDate(r.createdAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}

export function ApprovalsTable({ items }: { items: RequestListItem[] }) {
  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-slate-500">No pending approvals</p>
    );
  }

  return (
    <div className="overflow-x-auto p-4">
      <table className="nfa-table w-full">
      <thead className="bg-slate-50">
        <tr>
          <th>Request</th>
          <th>Department</th>
          <th>Club</th>
          <th>Raised By</th>
          <th>Category</th>
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
            <td>{r.departmentName}</td>
            <td>{r.clubName ?? "—"}</td>
            <td>{r.raisedByName}</td>
            <td>{r.category}</td>
            <td>
              <StatusBadge status={r.status} currentRoleCode={r.currentRoleCode} />
            </td>
            <td>
              <Link href={`/requests/${r.id}`} className="nfa-btn-primary py-1.5 text-xs">
                Review
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}
