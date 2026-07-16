import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { canEditUsers } from "@/lib/rbac";
import { migrateLegacyPasswordsToFacultyId } from "@/lib/bootstrap/migrate-faculty-id-passwords";

/** Developer-only: force-reset password123 accounts to Faculty ID. */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canEditUsers(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await migrateLegacyPasswordsToFacultyId();
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Migration failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
