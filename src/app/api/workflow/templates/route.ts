import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import {
  createWorkflowTemplate,
  listWorkflowTemplates,
} from "@/lib/services/workflow-service";
import { z } from "zod";
import type { RoleCode } from "@prisma/client";

const createSchema = z.object({
  name: z.string().min(2),
  category: z.enum(["ACADEMIC", "CLUB"]),
  requestTypeId: z.string().optional(),
  academicSectionId: z.string().optional(),
  clubId: z.string().optional(),
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
  isDefault: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user, "flow:control")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const category = new URL(req.url).searchParams.get("category") as
    | "ACADEMIC"
    | "CLUB"
    | null;

  const templates = await listWorkflowTemplates(category ?? undefined);
  return NextResponse.json({ success: true, data: templates });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user, "flow:control")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createSchema.parse(body);
    const template = await createWorkflowTemplate(user, {
      ...data,
      steps: data.steps as RoleCode[],
    });
    return NextResponse.json({ success: true, data: template }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create template";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
