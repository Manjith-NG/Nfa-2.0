"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useNavigation } from "@/components/layout/navigation-context";

function NavLinkContent({
  children,
  className,
  active,
}: {
  children: ReactNode;
  className?: string;
  active: boolean;
}) {
  const { pending } = useLinkStatus();

  return (
    <span
      className={cn(
        className,
        pending && "opacity-75",
        active && pending && "ring-2 ring-white/30"
      )}
    >
      {children}
    </span>
  );
}

export function NavLink({
  href,
  active,
  className,
  title,
  children,
}: {
  href: string;
  active: boolean;
  className?: string;
  title?: string;
  children: ReactNode;
}) {
  const { startNavigation } = useNavigation();

  return (
    <Link
      href={href}
      prefetch={true}
      title={title}
      onClick={() => startNavigation()}
      className={className}
    >
      <NavLinkContent active={active} className="flex items-center gap-3">
        {children}
      </NavLinkContent>
    </Link>
  );
}
