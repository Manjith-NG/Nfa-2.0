"use client";

import { useState } from "react";
import { Loader2, KeyRound } from "lucide-react";

export function ChangePasswordForm({
  onSuccess,
  onCancel,
}: {
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = (await res.json()) as { error?: string; message?: string };

      if (!res.ok) {
        setError(data.error ?? "Could not update password.");
        return;
      }

      setSuccess(data.message ?? "Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      if (onSuccess) {
        window.setTimeout(onSuccess, 700);
      }
    } catch {
      setError("Could not update password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="current-password" className="nfa-label">
          Current password
        </label>
        <input
          id="current-password"
          type="password"
          autoComplete="current-password"
          className="nfa-input"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          disabled={loading}
          required
        />
      </div>
      <div>
        <label htmlFor="new-password" className="nfa-label">
          New password
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          className="nfa-input"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={loading}
          minLength={6}
          required
        />
      </div>
      <div>
        <label htmlFor="confirm-password" className="nfa-label">
          Confirm new password
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          className="nfa-input"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
          minLength={6}
          required
        />
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}
      {success && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">{success}</p>
      )}

      <div className="flex flex-wrap justify-end gap-3 pt-1">
        {onCancel && (
          <button
            type="button"
            className="nfa-btn-secondary"
            disabled={loading}
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
        <button type="submit" className="nfa-btn-primary" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating…
            </>
          ) : (
            <>
              <KeyRound className="h-4 w-4" />
              Update password
            </>
          )}
        </button>
      </div>
    </form>
  );
}
