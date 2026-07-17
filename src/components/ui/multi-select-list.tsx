"use client";

import { Loader2 } from "lucide-react";

export function MultiSelectList({
  label,
  options,
  selectedIds,
  onToggle,
  loading,
  error,
  onRetry,
  emptyMessage = "No options available",
}: {
  label: string;
  options: { id: string; label: string; hint?: string }[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyMessage?: string;
}) {
  return (
    <div>
      <label className="nfa-label">{label}</label>
      <div className="max-h-44 overflow-y-auto rounded-lg border border-nfa-border bg-white p-2">
        {loading ? (
          <p className="flex items-center gap-2 px-2 py-3 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </p>
        ) : error ? (
          <div className="space-y-2 px-2 py-3">
            <p className="text-sm text-red-600">{error}</p>
            {onRetry && (
              <button type="button" onClick={onRetry} className="text-sm font-medium text-nfa-primary hover:underline">
                Retry
              </button>
            )}
          </div>
        ) : options.length === 0 ? (
          <p className="px-2 py-3 text-sm text-slate-500">{emptyMessage}</p>
        ) : (
          <ul className="space-y-1">
            {options.map((opt) => {
              const checked = selectedIds.includes(opt.id);
              return (
                <li key={opt.id}>
                  <label
                    className={`flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                      checked ? "bg-nfa-primary/10 text-nfa-primary" : "hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 shrink-0"
                      checked={checked}
                      onChange={() => onToggle(opt.id)}
                    />
                    <span className="min-w-0">
                      <span className="font-medium">{opt.label}</span>
                      {opt.hint && (
                        <span className="mt-0.5 block text-xs text-slate-500">{opt.hint}</span>
                      )}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {selectedIds.length > 0 && (
        <p className="mt-1 text-xs text-slate-500">{selectedIds.length} selected</p>
      )}
    </div>
  );
}
