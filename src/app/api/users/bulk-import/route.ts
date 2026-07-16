import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { importFacultyFromCsv } from "@/lib/faculty/faculty-import-service";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user, "users:manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const csvText = typeof body.csv === "string" ? body.csv : "";
    if (!csvText.trim()) {
      return NextResponse.json({ success: false, error: "CSV content is required" }, { status: 400 });
    }

    const data = await importFacultyFromCsv(csvText, { actorUserId: user.id });

    return NextResponse.json({ success: true, data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Bulk import failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
