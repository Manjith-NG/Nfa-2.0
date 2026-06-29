import { NextResponse } from "next/server";
import { listDesignations, syncDesignationsFromSeed } from "@/lib/services/org-master-service";

export async function GET() {
  let rows = await listDesignations();
  if (rows.length === 0) {
    await syncDesignationsFromSeed();
    rows = await listDesignations();
  }
  return NextResponse.json({ success: true, data: rows });
}
