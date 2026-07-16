import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { createClub, listActiveClubs } from "@/lib/services/club-service";
import { z } from "zod";

const createSchema = z.object({
  code: z.string().min(2).max(32),
  name: z.string().min(2).max(120),
});

export async function GET() {
  const clubs = await listActiveClubs();
  return NextResponse.json({ success: true, data: clubs });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user, "flow:control")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = createSchema.parse(body);
    const club = await createClub(parsed);
    return NextResponse.json({ success: true, data: club }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create club";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
