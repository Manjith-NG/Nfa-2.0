import { NextResponse } from "next/server";
import { listActiveDepartments, syncOrgMasterFromSeed } from "@/lib/services/org-master-service";

export async function GET() {
  let departments = await listActiveDepartments();
  if (departments.length === 0) {
    await syncOrgMasterFromSeed();
    departments = await listActiveDepartments();
  }

  return NextResponse.json({ success: true, data: departments });
}
