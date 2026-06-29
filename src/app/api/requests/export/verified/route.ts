import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { buildVerifiedRequestsCsv } from "@/lib/services/request-export-service";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!hasPermission(user, "reports:view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const csv = await buildVerifiedRequestsCsv();
  const stamp = new Date().toISOString().slice(0, 10);
  const withBom = `\uFEFF${csv}`;

  return new NextResponse(withBom, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="nfa-verified-requests-${stamp}.csv"`,
      "Cache-Control": "private, no-cache",
    },
  });
}
