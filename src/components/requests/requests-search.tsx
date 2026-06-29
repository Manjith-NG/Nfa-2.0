"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export function RequestsSearch({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (value === (searchParams.get("search") ?? "")) return;

      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set("search", value);
      else params.delete("search");

      startTransition(() => {
        router.replace(`/requests?${params.toString()}`);
      });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [value, searchParams, router]);

  return (
    <input
      className="nfa-input max-w-sm"
      placeholder="Search by title or number..."
      value={value}
      onChange={(e) => setValue(e.target.value)}
      aria-busy={isPending}
    />
  );
}
