import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface KpiCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "pending" | "approved" | "rejected" | "resend";
  className?: string;
  href?: string;
}

const variantStyles = {
  default: "text-nfa-primary bg-slate-100",
  pending: "text-status-pending bg-orange-50",
  approved: "text-status-approved bg-green-50",
  rejected: "text-status-rejected bg-red-50",
  resend: "text-status-resend bg-yellow-50",
};

const cardClassName =
  "flex items-center justify-between gap-2 rounded-xl border border-nfa-border bg-white p-3 shadow-card sm:gap-3 sm:p-4";

export function KpiCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = "default",
  className,
  href,
}: KpiCardProps) {
  const content = (
    <>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-500 sm:text-sm">{title}</p>
        <p className="mt-0.5 text-xl font-semibold tabular-nums tracking-tight text-slate-900 sm:mt-1 sm:text-2xl">
          {value}
        </p>
        {trend && <p className="mt-0.5 text-xs text-slate-500">{trend}</p>}
      </div>
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10",
          variantStyles[variant]
        )}
      >
        <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          cardClassName,
          "transition-colors hover:border-nfa-primary/30 hover:bg-slate-50/50",
          className
        )}
      >
        {content}
      </Link>
    );
  }

  return <div className={cn(cardClassName, className)}>{content}</div>;
}
