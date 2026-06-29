import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getWorkflowPreview } from "@/lib/services/workflow-preview-service";
import type { RequestCategory } from "@prisma/client";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") as RequestCategory | null;
  const academicSectionId = searchParams.get("academicSectionId");
  const clubId = searchParams.get("clubId");
  const departmentId = searchParams.get("departmentId") ?? user.departmentId ?? undefined;

  if (!category || !["ACADEMIC", "CLUB"].includes(category)) {
    return NextResponse.json({ error: "category is required" }, { status: 400 });
  }

  if (category === "ACADEMIC" && !academicSectionId) {
    return NextResponse.json({ error: "academicSectionId is required" }, { status: 400 });
  }

  if (category === "CLUB" && !clubId) {
    return NextResponse.json({ error: "clubId is required" }, { status: 400 });
  }

  try {
    const data = await getWorkflowPreview({
      category,
      academicSectionId: category === "ACADEMIC" ? academicSectionId : null,
      clubId: category === "CLUB" ? clubId : null,
      departmentId: departmentId ?? null,
    });
    return NextResponse.json({ success: true, data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load workflow preview";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
