import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { forwardRequestToRole } from "@/lib/services/workflow-service";
import { z } from "zod";
import type { RoleCode } from "@prisma/client";

const schema = z.object({
  targetRole: z.enum(["HR", "COE", "IQAC", "PMSEB"]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const { targetRole } = schema.parse(body);
    const updated = await forwardRequestToRole(user, id, targetRole as RoleCode);
    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to forward request";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
