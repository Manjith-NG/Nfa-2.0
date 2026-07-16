"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string } | null;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    fetch("/api/audit-logs")
      .then((r) => r.json())
      .then((d) => d.success && setLogs(d.data.logs));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Audit Logs</h2>
        <p className="text-slate-500">System-wide activity trail</p>
      </div>

      <div className="nfa-card overflow-hidden p-0">
        <table className="nfa-table w-full">
          <thead className="bg-slate-50">
            <tr>
              <th>Time</th>
              <th>User</th>
              <th>Action</th>
              <th>Entity</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="text-slate-500">{formatDate(log.createdAt)}</td>
                <td>
                  {log.user
                    ? `${log.user.firstName} ${log.user.lastName}`
                    : "System"}
                </td>
                <td className="font-medium">{log.action}</td>
                <td>
                  {log.entityType}
                  {log.entityId && (
                    <span className="text-xs text-slate-400"> #{log.entityId.slice(0, 8)}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
