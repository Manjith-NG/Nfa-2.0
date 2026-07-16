import { NextRequest, NextResponse } from "next/server";
import { listMetrics, syncNaacMetricsFromSeed } from "@/lib/services/naac-service";

export async function GET(req: NextRequest) {
  const criterionId = req.nextUrl.searchParams.get("criterionId") ?? undefined;

  let metrics = await listMetrics(criterionId);
  if (metrics.length === 0) {
    await syncNaacMetricsFromSeed();
    metrics = await listMetrics(criterionId);
  }

  return NextResponse.json({ success: true, data: metrics });
}
