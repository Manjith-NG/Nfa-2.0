"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useNavigation } from "@/components/layout/navigation-context";

function NavLinkContent({
  children,
  active,
}: {
  children: ReactNode;
  active: boolean;
}) {
  const { pending } = useLinkStatus();

  return (
    <span
      className={cn(
        "flex w-full min-w-0 items-center",
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
  onClick,
}: {
  href: string;
  active: boolean;
  className?: string;
  title?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  const { startNavigation } = useNavigation();

  return (
    <Link
      href={href}
      prefetch={true}
      title={title}
      onClick={() => {
        startNavigation();
        onClick?.();
      }}
      className={className}
    >
      <NavLinkContent active={active}>{children}</NavLinkContent>
    </Link>
  );
}
