import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import {
  buildVerifiedRequestsCsv,
  buildVerifiedShortSummaryPdf,
  parseVerifiedReportFormat,
  parseVerifiedReportPeriod,
  verifiedReportPeriodLabel,
} from "@/lib/services/request-export-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!hasPermission(user, "reports:view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const period = parseVerifiedReportPeriod(searchParams.get("period"));
  const format = parseVerifiedReportFormat(searchParams.get("format"));
  const stamp = new Date().toISOString().slice(0, 10);
  const periodSlug = period === "all" ? "all" : period;

  try {
    if (format === "summary") {
      const pdf = await buildVerifiedShortSummaryPdf(period);
      return new NextResponse(new Uint8Array(pdf), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="nfa-short-summaries-${periodSlug}-${stamp}.pdf"`,
          "Cache-Control": "private, no-cache",
          "X-Report-Period": verifiedReportPeriodLabel(period),
        },
      });
    }

    const csv = await buildVerifiedRequestsCsv(period);
    const withBom = `\uFEFF${csv}`;

    return new NextResponse(withBom, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="nfa-verified-${periodSlug}-${stamp}.csv"`,
        "Cache-Control": "private, no-cache",
        "X-Report-Period": verifiedReportPeriodLabel(period),
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Export failed";
    const status = message.includes("No verified requests") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
