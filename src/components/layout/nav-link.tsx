"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useNavigation } from "@/components/layout/navigation-context";

function NavLinkContent({
  children,
  active,
  centered,
}: {
  children: ReactNode;
  active: boolean;
  centered?: boolean;
}) {
  const { pending } = useLinkStatus();

  return (
    <span
      className={cn(
        "flex min-w-0 items-center",
        centered ? "justify-center" : "w-full gap-3",
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
  centered = false,
}: {
  href: string;
  active: boolean;
  className?: string;
  title?: string;
  children: ReactNode;
  onClick?: () => void;
  centered?: boolean;
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
      <NavLinkContent active={active} centered={centered}>
        {children}
      </NavLinkContent>
    </Link>
  );
}
