"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { APP_NAME, APP_FULL_NAME, UNIVERSITY_NAME } from "@/lib/constants";
import { DEMO_LOGIN_PASSWORD, FALLBACK_LOGIN_OPTIONS } from "@/lib/demo-users";
import { signInWithCredentials } from "@/lib/auth-client";
import type { LoginOption } from "@/lib/services/auth-service";

export default function LoginPage() {
  const { status } = useSession();
  const [email, setEmail] = useState("faculty.cse@gcu.edu.in");
  const [password, setPassword] = useState(DEMO_LOGIN_PASSWORD);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoPick, setDemoPick] = useState("");
  const [loginOptions, setLoginOptions] = useState<LoginOption[]>(FALLBACK_LOGIN_OPTIONS);
  const [dbWarning, setDbWarning] = useState("");
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    if (status !== "loading") {
      setSessionChecked(true);
    }
  }, [status]);

  useEffect(() => {
    const timer = window.setTimeout(() => setSessionChecked(true), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      window.location.replace("/dashboard");
    }
  }, [status]);

  useEffect(() => {
    let cancelled = false;

    async function loadLoginOptions() {
      try {
        const res = await fetch("/api/auth/login-options");
        if (!res.ok) {
          setDbWarning("Could not reach the server. Using default demo accounts.");
          return;
        }
        const json = (await res.json()) as {
          data?: LoginOption[];
          warning?: string;
        };
        if (!cancelled) {
          if (json.data?.length) {
            setLoginOptions(json.data);
            setEmail((current) => current || json.data![0].email);
          }
          if (json.warning) {
            setDbWarning(json.warning);
          }
        }
      } catch {
        if (!cancelled) {
          setDbWarning("Database unavailable. Configure Supabase to sign in.");
        }
      }
    }

    void loadLoginOptions();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const redirectTo = await signInWithCredentials(email, password);
      window.location.replace(redirectTo);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed. Please try again.";
      if (message.includes("Invalid email or password")) {
        setError(
          dbWarning
            ? `${message} ${dbWarning}`
            : `${message} Use demo password "${DEMO_LOGIN_PASSWORD}" for seeded accounts.`
        );
      } else {
        setError(message);
      }
      setLoading(false);
    }
  }

  function quickLogin(demoEmail: string) {
    setEmail(demoEmail);
    setPassword(DEMO_LOGIN_PASSWORD);
    setDemoPick(demoEmail);
  }

  if (status === "loading" && !sessionChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-nfa-surface">
        <Loader2 className="h-8 w-8 animate-spin text-nfa-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      <Image
        src="/images/gcu-campus-login.png"
        alt=""
        fill
        priority
        className="object-cover"
        sizes="100vw"
        aria-hidden
      />
      <div className="absolute inset-0 bg-slate-900/40" aria-hidden />

      <div className="relative flex h-full items-center justify-end p-4 sm:p-8 lg:pr-12 xl:pr-16">
        <div className="w-full max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-[0_25px_60px_-12px_rgba(0,0,0,0.45)] ring-1 ring-white/20">
          <div className="bg-nfa-primary px-7 py-6 text-white sm:px-8">
            <div className="flex items-center gap-3">
              <BrandLogo size={44} priority className="rounded-lg ring-1 ring-white/20" />
              <div className="min-w-0">
                <p className="text-xl font-bold tracking-tight">{APP_NAME}</p>
                <p className="truncate text-sm text-white/85">{APP_FULL_NAME}</p>
              </div>
            </div>
            <p className="mt-4 text-xs font-medium uppercase tracking-widest text-white/70">
              {UNIVERSITY_NAME}
            </p>
          </div>

          <div className="px-7 py-6 sm:px-8">
            <h1 className="text-lg font-semibold text-slate-900">Sign in</h1>
            <p className="mt-0.5 text-sm text-slate-600">Faculty &amp; staff portal</p>

            {dbWarning && (
              <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                {dbWarning}
              </p>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="email" className="nfa-label">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="nfa-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="nfa-label">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className="nfa-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              {error && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
              )}
              <button type="submit" className="nfa-btn-primary w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-7 py-3.5 sm:px-8">
            <p className="text-[11px] leading-tight text-slate-600">
              Demo password{" "}
              <code className="font-semibold text-nfa-primary">{DEMO_LOGIN_PASSWORD}</code>
            </p>
            <select
              id="demo-select"
              aria-label="Quick demo login"
              className="nfa-input w-auto min-w-[7.5rem] shrink-0 py-1.5 text-xs"
              value={demoPick}
              disabled={loading}
              onChange={(e) => {
                const v = e.target.value;
                setDemoPick(v);
                if (v) quickLogin(v);
              }}
            >
              <option value="">Select role…</option>
              {loginOptions.map((u) => (
                <option key={u.email} value={u.email}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
