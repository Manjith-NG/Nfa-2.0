import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { buildFacultyImportTemplateCsv } from "@/lib/faculty/faculty-import";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user, "users:manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const csv = buildFacultyImportTemplateCsv();
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="faculty-import-template.csv"',
    },
  });
}
