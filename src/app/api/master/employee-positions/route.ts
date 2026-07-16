import { NextResponse } from "next/server";
import {
  listEmployeePositions,
  syncEmployeePositionsFromSeed,
} from "@/lib/services/org-master-service";

export async function GET() {
  let rows = await listEmployeePositions();
  if (rows.length === 0) {
    await syncEmployeePositionsFromSeed();
    rows = await listEmployeePositions();
  }
  return NextResponse.json({ success: true, data: rows });
}
