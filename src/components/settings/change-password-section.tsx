"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { ChangePasswordForm } from "@/components/settings/change-password-form";

export function ChangePasswordSection() {
  const [open, setOpen] = useState(false);

  function closeModal() {
    setOpen(false);
  }

  return (
    <>
      <section className="nfa-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Security</h2>
            <p className="mt-1 text-sm text-slate-600">
              Keep your account secure with a strong password.
            </p>
          </div>
          <button
            type="button"
            className="nfa-btn-primary shrink-0"
            onClick={() => setOpen(true)}
          >
            <KeyRound className="h-4 w-4" />
            Change password
          </button>
        </div>
      </section>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-password-title"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-xl border border-nfa-border bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="change-password-title" className="text-lg font-semibold text-slate-900">
                  Change password
                </h2>
                <p className="mt-1 text-sm text-slate-600">Use at least 6 characters.</p>
              </div>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                onClick={closeModal}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <ChangePasswordForm onSuccess={closeModal} onCancel={closeModal} />
          </div>
        </div>
      )}
    </>
  );
}
