"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getBackHref, getBackLabel } from "@/lib/nav-utils";
import { useNavigation } from "@/components/layout/navigation-context";

export function BackButton() {
  const pathname = usePathname();
  const { startNavigation } = useNavigation();
  const href = getBackHref(pathname);

  if (!href) return null;

  const label = getBackLabel(pathname);

  return (
    <Link
      href={href}
      prefetch={true}
      onClick={() => startNavigation()}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-nfa-border px-2.5 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 sm:gap-2 sm:px-3 sm:py-2"
      aria-label={`Back to ${label}`}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="hidden sm:inline">Back</span>
    </Link>
  );
}
