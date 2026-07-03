"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, X } from "lucide-react";

export type FacultyOption = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId?: string;
  department?: { name: string } | null;
};

type FacultySearchPickerProps = {
  value: string;
  onChange: (userId: string) => void;
  onSelectUser?: (user: FacultyOption | null) => void;
  selectedUser?: FacultyOption | null;
  placeholder?: string;
  required?: boolean;
};

function cleanText(value: string): string {
  return value.replace(/_x000D_/gi, " ").replace(/\s+/g, " ").trim();
}

export function FacultySearchPicker({
  value,
  onChange,
  onSelectUser,
  selectedUser,
  placeholder = "Search by name, email, or employee ID",
  required = false,
}: FacultySearchPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FacultyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => {
    if (!value) return null;
    if (selectedUser?.id === value) return selectedUser;
    return results.find((u) => u.id === value) ?? null;
  }, [value, selectedUser, results]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setLoading(true);
      fetch(`/api/users?search=${encodeURIComponent(trimmed)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setResults(d.data);
          else setResults([]);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query, open]);

  function pick(user: FacultyOption) {
    onChange(user.id);
    onSelectUser?.(user);
    setQuery("");
    setOpen(false);
  }

  function clear() {
    onChange("");
    onSelectUser?.(null);
    setQuery("");
    setResults([]);
  }

  return (
    <div className="relative">
      {selected ? (
        <div className="flex items-center gap-2 rounded-lg border border-nfa-border bg-slate-50 px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">
              {cleanText(selected.firstName)} {cleanText(selected.lastName)}
            </p>
            <p className="truncate text-xs text-slate-500">
              {selected.email}
              {selected.department?.name ? ` · ${selected.department.name}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={clear}
            className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-700"
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="nfa-input pl-9"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            required={required && !value}
            autoComplete="off"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
          )}
        </div>
      )}

      {open && !selected && query.trim().length >= 2 && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-nfa-border bg-white py-1 shadow-lg">
          {loading ? (
            <li className="px-3 py-2 text-sm text-slate-500">Searching…</li>
          ) : results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-500">No faculty found</li>
          ) : (
            results.map((user) => (
              <li key={user.id}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                  onClick={() => pick(user)}
                >
                  <span className="font-medium text-slate-900">
                    {cleanText(user.firstName)} {cleanText(user.lastName)}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">
                    {user.email}
                    {user.employeeId ? ` · ID ${user.employeeId}` : ""}
                    {user.department?.name ? ` · ${user.department.name}` : ""}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}

      {open && !selected && (
        <button
          type="button"
          className="fixed inset-0 z-10 cursor-default"
          aria-label="Close search results"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}
