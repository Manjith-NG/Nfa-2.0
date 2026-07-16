import { NextRequest, NextResponse } from "next/server";
import { listNaacCriteria, syncNaacMetricsFromSeed } from "@/lib/services/naac-service";

export async function GET(req: NextRequest) {
  const sync = req.nextUrl.searchParams.get("sync") === "1";
  if (sync) {
    await syncNaacMetricsFromSeed();
  }

  let criteria = await listNaacCriteria();
  if (criteria.length === 0) {
    await syncNaacMetricsFromSeed();
    criteria = await listNaacCriteria();
  }

  return NextResponse.json({ success: true, data: criteria });
}
