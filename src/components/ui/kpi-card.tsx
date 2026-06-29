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
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          {value}
        </p>
        {trend && <p className="mt-1 text-xs text-slate-500">{trend}</p>}
      </div>
      <div
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-lg",
          variantStyles[variant]
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "nfa-card flex items-start justify-between transition-colors hover:border-nfa-primary/30 hover:bg-slate-50/50",
          className
        )}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={cn("nfa-card flex items-start justify-between", className)}>
      {content}
    </div>
  );
}
