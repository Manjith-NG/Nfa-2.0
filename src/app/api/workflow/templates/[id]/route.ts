import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import {
  deleteWorkflowTemplate,
  updateWorkflowTemplate,
} from "@/lib/services/workflow-service";
import { z } from "zod";
import type { RoleCode } from "@prisma/client";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  steps: z
    .array(
      z.enum([
        "HOD",
        "CLUB_AUTHORITY",
        "IQAC",
        "PMSEB",
        "HR",
        "COE",
        "REGISTRAR",
      ])
    )
    .optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user, "flow:control")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);
    const template = await updateWorkflowTemplate(user, id, {
      ...data,
      steps: data.steps as RoleCode[] | undefined,
    });
    return NextResponse.json({ success: true, data: template });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update template";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user, "flow:control")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await deleteWorkflowTemplate(user, id);
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete template";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
