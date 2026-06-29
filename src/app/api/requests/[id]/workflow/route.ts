import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { assignRequestWorkflow } from "@/lib/services/workflow-service";
import { z } from "zod";
import type { RoleCode } from "@prisma/client";

const schema = z.object({
  steps: z.array(
    z.enum([
      "HOD",
      "CLUB_AUTHORITY",
      "IQAC",
      "PMSEB",
      "HR",
      "COE",
      "REGISTRAR",
    ])
  ),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const { steps } = schema.parse(body);
    const updated = await assignRequestWorkflow(user, id, steps as RoleCode[]);
    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update workflow";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
