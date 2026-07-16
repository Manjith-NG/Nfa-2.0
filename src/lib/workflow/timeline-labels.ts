import type { RoleCode } from "@prisma/client";
import { ROLE_LABELS } from "@/lib/constants";

export function resendActionLabel(roleCode: RoleCode): "Resend" | "Recheck" {
  return roleCode === "HOD" || roleCode === "COE" ? "Resend" : "Recheck";
}

/** Role-based status shown in the approval tracking UI (not free-text authority remarks). */
export function getTrackingStatusLabel(roleCode: RoleCode, action: string): string | undefined {
  if (action === "REJECT") return "Rejected";
  if (action === "RESEND") return resendActionLabel(roleCode);
  if (action !== "APPROVE") return undefined;

  switch (roleCode) {
    case "HOD":
    case "CLUB_AUTHORITY":
      return "APPROVED";
    case "IQAC":
    case "PMSEB":
    case "HR":
      return "Forwarded";
    case "COE":
      return "Verified";
    case "REGISTRAR":
      return "Recommended";
    case "OFC":
      return "Verified";
    default:
      return "Approved";
  }
}

export function getTrackingDisplayRemarks(
  roleCode: RoleCode,
  action: string,
  authorityRemarks?: string | null
): string | undefined {
  if (action === "RESEND") {
    const label = resendActionLabel(roleCode);
    const roleName = ROLE_LABELS[roleCode] ?? roleCode;
    const note = authorityRemarks?.trim();
    if (note) return `${label} by ${roleName}: ${note}`;
    return `Sent back for ${label.toLowerCase()} by ${roleName}`;
  }
  return undefined;
}

export function formatTrackingDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const mon = d.toLocaleDateString("en-GB", { month: "short" }).toUpperCase();
  return `${day}-${mon}-${d.getFullYear()}`;
}

export function formatTrackingTime(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
